import pytest
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.models import PowerSource, Load

def test_grid_supply_demand():
    grid = SmartGrid()
    grid.add_source(PowerSource("S1", "Solar", 10))
    grid.add_source(PowerSource("S2", "Wind", 20))
    
    assert grid.get_total_supply() == 30
    
    grid.add_load(Load("L1", 15, "High"))
    grid.add_load(Load("L2", 25, "Low"))
    
    assert grid.get_total_demand() == 40
    
def test_negative_values():
    grid = SmartGrid()
    with pytest.raises(ValueError):
        grid.add_source(PowerSource("S1", "Solar", -10))
    
    with pytest.raises(ValueError):
        grid.add_load(Load("L1", -15, "High"))
