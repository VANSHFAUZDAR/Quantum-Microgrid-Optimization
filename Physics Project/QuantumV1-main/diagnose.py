import time
from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.classical_optimizer import ClassicalOptimizer
from quantum_energy_optimizer.quantum_optimizer import QuantumOptimizer
from quantum_energy_optimizer.optimization import create_quadratic_program, get_qubo

def run_diagnostics():
    print("--- DIAGNOSTICS START ---\n")
    
    grid = SmartGrid()
    grid.add_source(PowerSource("Main", "Grid", 50))
    grid.add_load(Load("Hospital", 30, "Critical"))
    grid.add_load(Load("School", 30, "High"))
    grid.add_load(Load("Industry", 30, "Low"))
    
    print(f"Total Supply: {grid.get_total_supply()}")
    print(f"Total Demand: {grid.get_total_demand()}\n")
    
    print("--- CLASSICAL OPTIMIZER ---")
    c_opt = ClassicalOptimizer(grid, granularity=1.0)
    c_res = c_opt.solve()
    print(f"Classical Runtime: {c_res['runtime']:.6f}s")
    print(f"Classical Feasible: {c_res['feasible']}")
    print(f"Classical Status: {c_res['status']}")
    print(f"Classical Objective: {c_res['objective']}")
    print(f"Classical Allocations: {c_res['allocations']}\n")
    
    print("--- QUANTUM OPTIMIZER SETUP ---")
    granularity = 10.0
    qp = create_quadratic_program(grid, granularity)
    print("Quadratic Program:")
    print(qp.prettyprint())
    
    qubo = get_qubo(qp)
    print("QUBO:")
    print(qubo.prettyprint())
    print(f"Number of QUBO variables: {qubo.get_num_vars()}")
    print(f"Variables dictionary mapping: {[v.name for v in qubo.variables]}")
    
    print("\n--- QUANTUM OPTIMIZER EXECUTION ---")
    q_opt = QuantumOptimizer(grid, granularity=granularity)
    q_res = q_opt.solve()
    print(f"Quantum Runtime: {q_res['runtime']:.6f}s")
    print(f"Quantum Feasible: {q_res['feasible']}")
    print(f"Quantum Status: {q_res['status']}")
    print(f"Quantum Objective: {q_res['objective']}")
    print(f"Quantum Allocations: {q_res['allocations']}\n")
    print(f"Quantum Qubits needed: {q_res['qubits']}")
    
if __name__ == '__main__':
    run_diagnostics()
