import os
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.experiment_runner import run_experiment
import pandas as pd

def run_benchmarks():
    print("Running Benchmarks...")
    
    # Scenario A: Supply > Demand
    print("Scenario A: Supply > Demand")
    grid_a = SmartGrid()
    grid_a.add_source(PowerSource("S1", "Solar", 100))
    grid_a.add_load(Load("L1", 40, "Critical"))
    grid_a.add_load(Load("L2", 30, "Low"))
    run_experiment(grid_a, "Scenario A: Supply > Demand", granularity=10.0)
    
    # Scenario B: Supply = Demand
    print("Scenario B: Supply = Demand")
    grid_b = SmartGrid()
    grid_b.add_source(PowerSource("S1", "Solar", 70))
    grid_b.add_load(Load("L1", 40, "Critical"))
    grid_b.add_load(Load("L2", 30, "Low"))
    run_experiment(grid_b, "Scenario B: Supply = Demand", granularity=10.0)
    
    # Scenario C: Supply < Demand
    print("Scenario C: Supply < Demand")
    grid_c = SmartGrid()
    grid_c.add_source(PowerSource("S1", "Solar", 50))
    grid_c.add_load(Load("L1", 40, "Critical"))
    grid_c.add_load(Load("L2", 30, "High"))
    grid_c.add_load(Load("L3", 20, "Low"))
    run_experiment(grid_c, "Scenario C: Supply < Demand", granularity=10.0)
    
    print("Benchmarks completed. Results saved to data/runs/experiment_history.csv")

if __name__ == "__main__":
    run_benchmarks()
