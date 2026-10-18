import unittest

from quantum_energy_optimizer.time_dispatch import (
    DispatchConfig,
    build_demo_scenario,
    solve_time_dispatch,
)


class TimeDispatchTests(unittest.TestCase):
    def test_demo_scenario_solves_and_returns_24_hours(self):
        result = solve_time_dispatch()
        self.assertTrue(result["feasible"])
        self.assertEqual(len(result["schedule"]), 24)
        self.assertLess(result["metrics"]["maximum_hourly_balance_error_kw"], 1e-6)

    def test_factory_requirement_is_met(self):
        cfg = DispatchConfig(factory_required_kwh=100.0)
        result = solve_time_dispatch(config=cfg)
        self.assertAlmostEqual(result["metrics"]["factory_scheduled_kwh"], 100.0, places=5)

    def test_critical_load_is_met_in_demo_scenario(self):
        result = solve_time_dispatch()
        self.assertAlmostEqual(result["metrics"]["critical_unmet_kwh"], 0.0, places=5)

    def test_infeasible_factory_target_is_reported(self):
        cfg = DispatchConfig(factory_required_kwh=250.0, factory_max_power_kw=20.0)
        with self.assertRaises(RuntimeError):
            solve_time_dispatch(config=cfg)

    def test_invalid_hour_order_is_rejected(self):
        scenario = build_demo_scenario()
        scenario.loc[[0, 1], ["hour"]] = [1, 0]
        with self.assertRaises(ValueError):
            solve_time_dispatch(scenario=scenario)


if __name__ == "__main__":
    unittest.main()
