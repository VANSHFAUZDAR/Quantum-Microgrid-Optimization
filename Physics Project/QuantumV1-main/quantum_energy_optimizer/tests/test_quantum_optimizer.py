import pytest
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.quantum_optimizer import QuantumOptimizer
from quantum_energy_optimizer.classical_optimizer import ClassicalOptimizer
from quantum_energy_optimizer.metrics import validate_and_calculate_metrics


def test_quantum_optimizer_simple():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 10))
    grid.add_load(Load("L1", 5, "Critical"))
    grid.add_load(Load("L2", 10, "Low"))
    
    opt = QuantumOptimizer(grid, granularity=5.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert "L1" in res["allocations"]
    metrics = validate_and_calculate_metrics(grid, res["allocations"], granularity=5.0)
    assert metrics["feasible"]


def test_quantum_optimizer_two_load_sufficient():
    """Test 2-load problem with sufficient supply."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 20.0))
    grid.add_load(Load("L1", 10.0, "Critical"))
    grid.add_load(Load("L2", 5.0, "Low"))
    
    opt = QuantumOptimizer(grid, granularity=5.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 10.0
    assert res["allocations"]["L2"] == 5.0
    assert res["objective"] == 0.0
    metrics = validate_and_calculate_metrics(grid, res["allocations"], granularity=5.0)
    assert metrics["feasible"]
    assert metrics["unmet_demand"] == 0.0


def test_quantum_optimizer_two_load_shortage():
    """Test 2-load problem with power shortage prioritizing high-priority load."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 10.0))
    grid.add_load(Load("L1", 10.0, "Critical"))
    grid.add_load(Load("L2", 10.0, "Low"))
    
    opt = QuantumOptimizer(grid, granularity=5.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 10.0
    assert res["allocations"]["L2"] == 0.0
    metrics = validate_and_calculate_metrics(grid, res["allocations"], granularity=5.0)
    assert metrics["feasible"]
    assert metrics["total_allocated"] <= 10.0


def test_quantum_optimizer_three_load_shortage():
    """Test 3-load problem (default shortage scenario) with hierarchy of priorities."""
    grid = SmartGrid()
    grid.add_source(PowerSource("Main Grid", "Grid", 50.0))
    grid.add_load(Load("Hospital", 30.0, "Critical"))
    grid.add_load(Load("School", 20.0, "High"))
    grid.add_load(Load("Industry", 10.0, "Low"))
    
    opt = QuantumOptimizer(grid, granularity=10.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["Hospital"] == 30.0
    assert res["allocations"]["School"] == 20.0
    assert res["allocations"]["Industry"] == 0.0
    assert res["runtime"] < 10.0  # Must finish within reasonable time target
    metrics = validate_and_calculate_metrics(grid, res["allocations"], granularity=10.0)
    assert metrics["feasible"]


def test_quantum_optimizer_zero_supply():
    """Test handling of 0 kW total supply."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 0.0))
    grid.add_load(Load("L1", 10.0, "Critical"))
    
    opt = QuantumOptimizer(grid, granularity=5.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 0.0
    assert res["runtime"] < 1.0


def test_quantum_optimizer_zero_demand():
    """Test handling of 0 kW total requested demand."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50.0))
    grid.add_load(Load("L1", 0.0, "Critical"))
    
    opt = QuantumOptimizer(grid, granularity=5.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"]["L1"] == 0.0
    assert res["objective"] == 0.0


def test_quantum_optimizer_empty_grid():
    """Test handling of empty grid without loads."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50.0))
    
    opt = QuantumOptimizer(grid, granularity=5.0)
    res = opt.solve()
    
    assert res["feasible"]
    assert res["allocations"] == {}
    assert res["objective"] == 0.0


def test_quantum_size_limit():
    """Test that safety limits prevent runaway memory allocation for huge problems."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 100))
    for i in range(30):
        grid.add_load(Load(f"L{i}", 1, "Low"))
        
    opt = QuantumOptimizer(grid, granularity=1.0)
    res = opt.solve()
    
    assert not res["feasible"]
    assert "Too many qubits required" in res["status"]


def test_classical_regression_and_parity():
    """Test parity and feasibility comparison between classical and quantum solvers."""
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 50.0))
    grid.add_load(Load("Hospital", 30.0, "Critical"))
    grid.add_load(Load("School", 20.0, "High"))
    grid.add_load(Load("Industry", 10.0, "Low"))
    
    c_opt = ClassicalOptimizer(grid, granularity=10.0)
    c_res = c_opt.solve()
    
    q_opt = QuantumOptimizer(grid, granularity=10.0)
    q_res = q_opt.solve()
    
    assert c_res["feasible"]
    assert q_res["feasible"]
    assert sum(q_res["allocations"].values()) <= grid.get_total_supply() + 1e-5
    assert q_res["allocations"]["Hospital"] == 30.0  # Critical load is prioritized
    assert q_res["runtime"] < 10.0

