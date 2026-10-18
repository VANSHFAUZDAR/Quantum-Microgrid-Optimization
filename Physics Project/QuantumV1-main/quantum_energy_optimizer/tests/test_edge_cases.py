import pytest
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.classical_optimizer import ClassicalOptimizer

def test_zero_supply():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 0))
    grid.add_load(Load("L1", 40, "Critical"))
    
    opt = ClassicalOptimizer(grid, granularity=1.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 0

def test_zero_demand():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50))
    grid.add_load(Load("L1", 0, "Critical"))
    
    opt = ClassicalOptimizer(grid, granularity=1.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 0
