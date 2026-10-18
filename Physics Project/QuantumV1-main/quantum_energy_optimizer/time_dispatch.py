"""Time-aware classical energy dispatch optimizer for QuantumV1.

Optimizes a 24-hour demonstration microgrid using a linear program (SciPy HiGHS).
This module is deliberately separate from the original single-snapshot QAOA model so
that existing behavior and experiments remain unchanged while the dispatch model is tested.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any
import math

import numpy as np
import pandas as pd
from scipy.optimize import linprog


@dataclass(frozen=True)
class DispatchConfig:
    grid_capacity_kw: float = 85.0
    solar_capacity_kw: float = 50.0
    battery_capacity_kwh: float = 60.0
    battery_charge_limit_kw: float = 20.0
    battery_discharge_limit_kw: float = 20.0
    charge_efficiency: float = 0.95
    discharge_efficiency: float = 0.95
    initial_soc_kwh: float = 30.0
    factory_required_kwh: float = 120.0
    factory_max_power_kw: float = 20.0
    factory_start_hour: int = 7
    factory_end_hour: int = 18  # end-exclusive: available 07:00 through 17:00
    interval_hours: float = 1.0
    battery_wear_cost_per_kwh: float = 0.12
    grid_emissions_kg_per_kwh: float = 0.42

    def validate(self) -> None:
        nonnegative = {
            "grid_capacity_kw": self.grid_capacity_kw,
            "solar_capacity_kw": self.solar_capacity_kw,
            "battery_capacity_kwh": self.battery_capacity_kwh,
            "battery_charge_limit_kw": self.battery_charge_limit_kw,
            "battery_discharge_limit_kw": self.battery_discharge_limit_kw,
            "initial_soc_kwh": self.initial_soc_kwh,
            "factory_required_kwh": self.factory_required_kwh,
            "factory_max_power_kw": self.factory_max_power_kw,
            "battery_wear_cost_per_kwh": self.battery_wear_cost_per_kwh,
            "grid_emissions_kg_per_kwh": self.grid_emissions_kg_per_kwh,
        }
        for name, value in nonnegative.items():
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"{name} must be a finite, non-negative number")
        if not (0 < self.charge_efficiency <= 1):
            raise ValueError("charge_efficiency must be in (0, 1]")
        if not (0 < self.discharge_efficiency <= 1):
            raise ValueError("discharge_efficiency must be in (0, 1]")
        if not (0 < self.interval_hours <= 24):
            raise ValueError("interval_hours must be in (0, 24]")
        if not (0 <= self.initial_soc_kwh <= self.battery_capacity_kwh):
            raise ValueError("initial_soc_kwh must be within battery capacity")
        if not (0 <= self.factory_start_hour < self.factory_end_hour <= 24):
            raise ValueError("Factory window must satisfy 0 <= start < end <= 24")


def build_demo_scenario(config: DispatchConfig | None = None) -> pd.DataFrame:
    """Return a deterministic 24-hour sample with solar, TOU prices and demand profiles."""
    cfg = config or DispatchConfig()
    # Solar availability is a fraction of installed solar capacity.
    solar_fraction = np.array([
        0, 0, 0, 0, 0, 0, .04, .12, .35, .60, .80, .95,
        1.00, .96, .82, .62, .38, .16, .04, 0, 0, 0, 0, 0,
    ], dtype=float)
    price = np.array([
        3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 4.2, 6.8, 6.8, 6.8, 6.8, 6.8,
        6.8, 6.8, 6.8, 6.8, 6.8, 8.5, 11.0, 11.0, 11.0, 8.5, 5.0, 4.2,
    ], dtype=float)
    critical = np.array([
        18, 18, 18, 18, 18, 18, 20, 22, 22, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 26, 26, 26, 22, 20, 18,
    ], dtype=float)
    residential = np.array([
        13, 12, 12, 12, 12, 13, 18, 25, 24, 18, 17, 17,
        17, 17, 18, 19, 21, 26, 32, 35, 33, 25, 18, 15,
    ], dtype=float)
    commercial = np.array([
        3, 3, 3, 3, 3, 3, 4, 8, 15, 22, 22, 22,
        22, 22, 22, 22, 22, 18, 10, 5, 5, 3, 3, 3,
    ], dtype=float)
    return pd.DataFrame({
        "hour": np.arange(24),
        "solar_available_kw": solar_fraction * cfg.solar_capacity_kw,
        "grid_price_per_kwh": price,
        "critical_demand_kw": critical,
        "residential_demand_kw": residential,
        "commercial_demand_kw": commercial,
    })


def solve_time_dispatch(
    scenario: pd.DataFrame | None = None,
    config: DispatchConfig | None = None,
) -> dict[str, Any]:
    """Minimize purchased-energy cost, battery wear, solar curtailment and unmet load.

    This is a continuous linear program for transparent classical benchmarking. It models
    hourly energy balance, SOC dynamics, grid/battery power limits, a daily factory-energy
    requirement, and load-shedding penalties. It is not a quantum solver.
    """
    cfg = config or DispatchConfig()
    cfg.validate()
    data = (scenario.copy() if scenario is not None else build_demo_scenario(cfg)).reset_index(drop=True)
    required_cols = [
        "hour", "solar_available_kw", "grid_price_per_kwh", "critical_demand_kw",
        "residential_demand_kw", "commercial_demand_kw",
    ]
    missing = [c for c in required_cols if c not in data.columns]
    if missing:
        raise ValueError(f"Scenario is missing columns: {', '.join(missing)}")
    if len(data) != 24:
        raise ValueError("This demo optimizer expects exactly 24 hourly periods")
    if data[required_cols].isna().any().any():
        raise ValueError("Scenario contains missing values")
    try:
        hours = data["hour"].astype(int).tolist()
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError("Scenario hour column must contain integers 0 through 23") from exc
    if hours != list(range(24)):
        raise ValueError("Scenario rows must be ordered by hour 0 through 23")
    numeric = data[required_cols].select_dtypes(include=[np.number])
    if len(numeric.columns) != len(required_cols):
        raise ValueError("All scenario columns must be numeric")
    for col in required_cols[1:]:
        if not np.isfinite(data[col].to_numpy(dtype=float)).all():
            raise ValueError(f"Scenario column {col} contains non-finite values")
        if (data[col] < 0).any():
            raise ValueError(f"Scenario column {col} cannot be negative")

    T = len(data)
    dt = cfg.interval_hours
    solar = np.minimum(data["solar_available_kw"].to_numpy(float), cfg.solar_capacity_kw)
    price = data["grid_price_per_kwh"].to_numpy(float)
    d_crit = data["critical_demand_kw"].to_numpy(float)
    d_res = data["residential_demand_kw"].to_numpy(float)
    d_com = data["commercial_demand_kw"].to_numpy(float)

    # Variable layout: grid, charge, discharge, soc[T+1], served-critical,
    # served-residential, served-commercial, factory, curtailed solar.
    ix_grid = 0
    ix_charge = T
    ix_discharge = 2 * T
    ix_soc = 3 * T
    ix_critical = 4 * T + 1
    ix_residential = 5 * T + 1
    ix_commercial = 6 * T + 1
    ix_factory = 7 * T + 1
    ix_curtail = 8 * T + 1
    n_vars = 9 * T + 1

    def at(start: int, t: int) -> int:
        return start + t

    objective = np.zeros(n_vars, dtype=float)
    objective[ix_grid:ix_grid + T] = price * dt
    objective[ix_charge:ix_charge + T] = cfg.battery_wear_cost_per_kwh * dt
    objective[ix_discharge:ix_discharge + T] = cfg.battery_wear_cost_per_kwh * dt
    objective[ix_critical:ix_critical + T] = -10_000.0 * dt
    objective[ix_residential:ix_residential + T] = -250.0 * dt
    objective[ix_commercial:ix_commercial + T] = -100.0 * dt
    objective[ix_curtail:ix_curtail + T] = 0.001 * dt

    bounds: list[tuple[float, float | None]] = [(0.0, None)] * n_vars
    for t in range(T):
        bounds[at(ix_grid, t)] = (0.0, cfg.grid_capacity_kw)
        bounds[at(ix_charge, t)] = (0.0, cfg.battery_charge_limit_kw)
        bounds[at(ix_discharge, t)] = (0.0, cfg.battery_discharge_limit_kw)
        bounds[at(ix_soc, t)] = (cfg.initial_soc_kwh, cfg.initial_soc_kwh) if t == 0 else (0.0, cfg.battery_capacity_kwh)
        bounds[at(ix_critical, t)] = (0.0, float(d_crit[t]))
        bounds[at(ix_residential, t)] = (0.0, float(d_res[t]))
        bounds[at(ix_commercial, t)] = (0.0, float(d_com[t]))
        available_for_factory = cfg.factory_start_hour <= int(data.loc[t, "hour"]) < cfg.factory_end_hour
        bounds[at(ix_factory, t)] = (0.0, cfg.factory_max_power_kw if available_for_factory else 0.0)
        bounds[at(ix_curtail, t)] = (0.0, float(solar[t]))
    bounds[at(ix_soc, T)] = (cfg.initial_soc_kwh, cfg.initial_soc_kwh)

    # Equalities: hourly energy balance, battery SOC transitions, required factory energy.
    A_eq = np.zeros((2 * T + 1, n_vars), dtype=float)
    b_eq = np.zeros(2 * T + 1, dtype=float)
    for t in range(T):
        row = t
        A_eq[row, at(ix_grid, t)] = 1.0
        A_eq[row, at(ix_discharge, t)] = 1.0
        A_eq[row, at(ix_charge, t)] = -1.0
        A_eq[row, at(ix_critical, t)] = -1.0
        A_eq[row, at(ix_residential, t)] = -1.0
        A_eq[row, at(ix_commercial, t)] = -1.0
        A_eq[row, at(ix_factory, t)] = -1.0
        A_eq[row, at(ix_curtail, t)] = -1.0
        b_eq[row] = -solar[t]

        row_soc = T + t
        A_eq[row_soc, at(ix_soc, t + 1)] = 1.0
        A_eq[row_soc, at(ix_soc, t)] = -1.0
        A_eq[row_soc, at(ix_charge, t)] = -cfg.charge_efficiency * dt
        A_eq[row_soc, at(ix_discharge, t)] = dt / cfg.discharge_efficiency

    factory_row = 2 * T
    A_eq[factory_row, ix_factory:ix_factory + T] = dt
    b_eq[factory_row] = cfg.factory_required_kwh

    result = linprog(objective, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")
    if not result.success or result.x is None:
        raise RuntimeError(
            "Time-aware dispatch optimization failed: " + str(result.message) +
            ". Check whether the factory's required energy fits its operating window and whether grid/battery capacity is sufficient."
        )

    x = result.x
    grid_kw = x[ix_grid:ix_grid + T]
    charge_kw = x[ix_charge:ix_charge + T]
    discharge_kw = x[ix_discharge:ix_discharge + T]
    soc = x[ix_soc:ix_soc + T + 1]
    served_crit = x[ix_critical:ix_critical + T]
    served_res = x[ix_residential:ix_residential + T]
    served_com = x[ix_commercial:ix_commercial + T]
    factory_kw = x[ix_factory:ix_factory + T]
    curtail_kw = x[ix_curtail:ix_curtail + T]

    schedule = pd.DataFrame({
        "Hour": data["hour"].astype(int),
        "Grid price (₹/kWh)": price,
        "Solar available (kW)": solar,
        "Grid import (kW)": grid_kw,
        "Battery charge (kW)": charge_kw,
        "Battery discharge (kW)": discharge_kw,
        "Battery SOC after hour (kWh)": soc[1:],
        "Critical demand (kW)": d_crit,
        "Critical served (kW)": served_crit,
        "Residential demand (kW)": d_res,
        "Residential served (kW)": served_res,
        "Commercial demand (kW)": d_com,
        "Commercial served (kW)": served_com,
        "Factory scheduled (kW)": factory_kw,
        "Solar curtailed (kW)": curtail_kw,
    })

    total_grid_kwh = float(grid_kw.sum() * dt)
    grid_energy_cost = float(np.dot(grid_kw, price) * dt)
    battery_wear_cost = float((charge_kw.sum() + discharge_kw.sum()) * dt * cfg.battery_wear_cost_per_kwh)
    critical_unmet = float(np.maximum(0.0, d_crit - served_crit).sum() * dt)
    residential_unmet = float(np.maximum(0.0, d_res - served_res).sum() * dt)
    commercial_unmet = float(np.maximum(0.0, d_com - served_com).sum() * dt)
    solar_available_kwh = float(solar.sum() * dt)
    solar_curtailed_kwh = float(curtail_kw.sum() * dt)
    max_balance_error = 0.0
    for t in range(T):
        supplied = solar[t] + grid_kw[t] + discharge_kw[t]
        used = served_crit[t] + served_res[t] + served_com[t] + factory_kw[t] + charge_kw[t] + curtail_kw[t]
        max_balance_error = max(max_balance_error, abs(float(supplied - used)))

    metrics = {
        "grid_energy_cost_inr": grid_energy_cost,
        "battery_wear_cost_inr": battery_wear_cost,
        "estimated_total_operating_cost_inr": grid_energy_cost + battery_wear_cost,
        "grid_energy_imported_kwh": total_grid_kwh,
        "estimated_grid_emissions_kg_co2": total_grid_kwh * cfg.grid_emissions_kg_per_kwh,
        "critical_unmet_kwh": critical_unmet,
        "residential_unmet_kwh": residential_unmet,
        "commercial_unmet_kwh": commercial_unmet,
        "total_unmet_kwh": critical_unmet + residential_unmet + commercial_unmet,
        "factory_scheduled_kwh": float(factory_kw.sum() * dt),
        "solar_available_kwh": solar_available_kwh,
        "solar_curtailed_kwh": solar_curtailed_kwh,
        "solar_utilization_pct": 100.0 * (solar_available_kwh - solar_curtailed_kwh) / solar_available_kwh if solar_available_kwh > 0 else 100.0,
        "peak_grid_import_kw": float(grid_kw.max()),
        "battery_throughput_kwh": float((charge_kw.sum() + discharge_kw.sum()) * dt),
        "minimum_soc_kwh": float(soc.min()),
        "maximum_soc_kwh": float(soc.max()),
        "maximum_hourly_balance_error_kw": max_balance_error,
        "solver_status": str(result.message),
        "solver_objective_with_unserved_penalties": float(result.fun),
    }
    return {"feasible": True, "schedule": schedule, "metrics": metrics, "config": cfg}
