import pytest
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.classical_optimizer import ClassicalOptimizer

def test_classical_optimizer_surplus():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 100))
    grid.add_load(Load("L1", 40, "Critical"))
    grid.add_load(Load("L2", 30, "High"))
    
    opt = ClassicalOptimizer(grid, granularity=1.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 40
    assert res["allocations"]["L2"] == 30
    assert res["objective"] == 0

def test_classical_optimizer_shortage():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50))
    grid.add_load(Load("L1", 40, "Critical"))
    grid.add_load(Load("L2", 30, "Low"))
    
    opt = ClassicalOptimizer(grid, granularity=1.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 40
    assert res["allocations"]["L2"] == 10
