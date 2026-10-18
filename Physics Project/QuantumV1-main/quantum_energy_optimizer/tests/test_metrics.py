import pytest
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.metrics import validate_and_calculate_metrics

def test_metrics_feasible():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50))
    grid.add_load(Load("L1", 40, "Critical"))
    
    alloc = {"L1": 40.0}
    metrics = validate_and_calculate_metrics(grid, alloc, 1.0)
    
    assert metrics["feasible"]
    assert metrics["unmet_demand"] == 0
    assert metrics["total_allocated"] == 40
    
def test_metrics_infeasible_supply():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 30))
    grid.add_load(Load("L1", 40, "Critical"))
    
    alloc = {"L1": 40.0}
    metrics = validate_and_calculate_metrics(grid, alloc, 1.0)
    
    assert not metrics["feasible"]
    assert "Total allocated exceeds total supply" in metrics["messages"]

def test_metrics_infeasible_granularity():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50))
    grid.add_load(Load("L1", 40, "Critical"))
    
    alloc = {"L1": 15.5}
    metrics = validate_and_calculate_metrics(grid, alloc, 1.0)
    
    assert not metrics["feasible"]
    assert any("multiple of granularity" in m for m in metrics["messages"])
