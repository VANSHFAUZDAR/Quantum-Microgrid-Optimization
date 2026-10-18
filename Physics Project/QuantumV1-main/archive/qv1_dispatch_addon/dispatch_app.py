"""Standalone Streamlit UI for testing the new QuantumV1 time-aware dispatch engine."""
import streamlit as st
import pandas as pd

from quantum_energy_optimizer.time_dispatch import DispatchConfig, build_demo_scenario, solve_time_dispatch

st.set_page_config(page_title="QuantumV1 | Time-Aware Dispatch", page_icon="⚡", layout="wide")
st.title("QuantumV1 — Time-Aware Energy Dispatch")
st.caption("Classical optimization prototype · 24 hourly periods · variable solar, tariff, battery and flexible factory load")
st.warning(
    "This is a new classical dispatch engine, separate from the existing QAOA snapshot model. "
    "It does not claim quantum advantage; it establishes a more realistic benchmark first."
)

with st.sidebar:
    st.header("Grid & battery")
    grid_capacity = st.slider("Grid import limit (kW)", 30, 150, 85, 5)
    solar_capacity = st.slider("Installed solar (kW)", 0, 100, 50, 5)
    battery_capacity = st.slider("Battery capacity (kWh)", 0, 200, 60, 5)
    battery_power = st.slider("Battery charge/discharge limit (kW)", 0, 60, 20, 5)
    initial_soc = st.slider("Initial / final battery charge (kWh)", 0, max(1, battery_capacity), min(30, battery_capacity), 5)
    st.header("Flexible factory")
    factory_energy = st.slider("Required factory energy per day (kWh)", 0, 200, 120, 10)
    factory_power = st.slider("Maximum factory power (kW)", 0, 40, 20, 5)
    st.caption("Factory can operate from 07:00 up to (but not including) 18:00. Initial and final battery charge are equal so the optimizer cannot get 'free' energy by emptying the battery.")

cfg = DispatchConfig(
    grid_capacity_kw=float(grid_capacity),
    solar_capacity_kw=float(solar_capacity),
    battery_capacity_kwh=float(battery_capacity),
    battery_charge_limit_kw=float(battery_power),
    battery_discharge_limit_kw=float(battery_power),
    initial_soc_kwh=float(initial_soc),
    factory_required_kwh=float(factory_energy),
    factory_max_power_kw=float(factory_power),
)
scenario = build_demo_scenario(cfg)

with st.expander("Inspect / edit the 24-hour input scenario", expanded=False):
    st.markdown("Edit hourly solar availability, tariff, and demand. Values are kW except the tariff, which is ₹/kWh.")
    editable = st.data_editor(
        scenario,
        use_container_width=True,
        hide_index=True,
        disabled=["hour"],
        column_config={
            "hour": st.column_config.NumberColumn("Hour", format="%d", help="0 means midnight; 23 means 11 PM"),
            "solar_available_kw": st.column_config.NumberColumn("Solar available (kW)", min_value=0.0, max_value=float(solar_capacity), step=1.0),
            "grid_price_per_kwh": st.column_config.NumberColumn("Grid price (₹/kWh)", min_value=0.0, step=0.5),
            "critical_demand_kw": st.column_config.NumberColumn("Critical demand (kW)", min_value=0.0, step=1.0),
            "residential_demand_kw": st.column_config.NumberColumn("Residential demand (kW)", min_value=0.0, step=1.0),
            "commercial_demand_kw": st.column_config.NumberColumn("Commercial demand (kW)", min_value=0.0, step=1.0),
        },
        key="dispatch_scenario_editor",
    )

if st.button("Optimize 24-hour schedule", type="primary", use_container_width=True):
    try:
        result = solve_time_dispatch(editable, cfg)
        st.session_state["time_dispatch_result"] = result
        st.session_state["time_dispatch_input"] = editable
        st.success("Optimization solved successfully.")
    except Exception as exc:
        st.session_state.pop("time_dispatch_result", None)
        st.error(f"Optimization could not produce a feasible schedule: {exc}")

result = st.session_state.get("time_dispatch_result")
if result:
    schedule = result["schedule"]
    metrics = result["metrics"]
    st.subheader("Optimization results")
    row1 = st.columns(4)
    row1[0].metric("Estimated operating cost", f"₹{metrics['estimated_total_operating_cost_inr']:,.0f}", help="Grid purchase cost plus a small battery-throughput wear estimate; excludes fixed tariffs and capital costs.")
    row1[1].metric("Unmet demand", f"{metrics['total_unmet_kwh']:.2f} kWh", help="Unserved critical, residential and commercial energy, summed across the day.")
    row1[2].metric("Solar utilized", f"{metrics['solar_utilization_pct']:.1f}%")
    row1[3].metric("Peak grid import", f"{metrics['peak_grid_import_kw']:.1f} kW")
    row2 = st.columns(4)
    row2[0].metric("Grid energy cost", f"₹{metrics['grid_energy_cost_inr']:,.0f}")
    row2[1].metric("Grid emissions estimate", f"{metrics['estimated_grid_emissions_kg_co2']:.1f} kg CO₂")
    row2[2].metric("Factory scheduled", f"{metrics['factory_scheduled_kwh']:.1f} / {cfg.factory_required_kwh:.1f} kWh")
    row2[3].metric("Battery SOC range", f"{metrics['minimum_soc_kwh']:.1f}–{metrics['maximum_soc_kwh']:.1f} kWh")

    st.subheader("Hourly decisions")
    st.markdown("**Grid import, solar availability, and served loads (kW)**")
    plot = schedule.set_index("Hour")[[
        "Solar available (kW)", "Grid import (kW)", "Critical served (kW)",
        "Residential served (kW)", "Commercial served (kW)", "Factory scheduled (kW)",
    ]]
    st.line_chart(plot, height=340)
    st.markdown("**Battery schedule**")
    st.line_chart(schedule.set_index("Hour")[[
        "Battery charge (kW)", "Battery discharge (kW)", "Battery SOC after hour (kWh)",
    ]], height=260)
    st.markdown("**Full dispatch table**")
    st.dataframe(schedule.round(2), use_container_width=True, hide_index=True)

    st.download_button(
        "Download hourly schedule CSV",
        data=schedule.to_csv(index=False).encode("utf-8"),
        file_name="quantumv1_time_dispatch_schedule.csv",
        mime="text/csv",
    )
    with st.expander("How the optimization works"):
        st.markdown(
            "The linear program minimizes time-of-use grid purchase cost, estimated battery wear, "
            "a tiny solar-curtailment penalty, and weighted unmet demand. It enforces hourly power "
            "balance, grid import limits, battery state-of-charge dynamics and limits, equal initial/final "
            "battery charge, and a required amount of factory energy within its allowed operating window. "
            "Critical unmet energy receives the largest penalty. Results are a simulation, not a certified "
            "real-grid operating plan."
        )
else:
    st.info("Adjust the scenario if needed, then click **Optimize 24-hour schedule** to compute a schedule.")
