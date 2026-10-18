import os
import uuid
import datetime
import pandas as pd
from typing import Dict, Any, List, Optional, Callable

from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.classical_optimizer import ClassicalOptimizer
from quantum_energy_optimizer.quantum_optimizer import QuantumOptimizer
from quantum_energy_optimizer.metrics import validate_and_calculate_metrics
from quantum_energy_optimizer.config import RUNS_DIR, DEFAULT_QAOA_MAXITER

def run_experiment(
    grid: SmartGrid, 
    scenario_name: str, 
    granularity: float = 1.0, 
    run_qaoa: bool = True,
    qaoa_maxiter: int = DEFAULT_QAOA_MAXITER,
    qaoa_callback: Optional[Callable[[int, Any, float, dict], None]] = None,
) -> Dict[str, Any]:
    
    run_id = str(uuid.uuid4())[:8]
    timestamp = datetime.datetime.now().isoformat()
    
    # Run Classical
    classical_opt = ClassicalOptimizer(grid, granularity)
    classical_res = classical_opt.solve()
    class_metrics = validate_and_calculate_metrics(grid, classical_res["allocations"], granularity)
    
    # Run Quantum
    quantum_res = None
    quant_metrics = None
    
    if run_qaoa:
        quantum_opt = QuantumOptimizer(grid, granularity, maxiter=qaoa_maxiter, callback=qaoa_callback)
        quantum_res = quantum_opt.solve()
        quant_metrics = validate_and_calculate_metrics(grid, quantum_res["allocations"], granularity)
        # Ensure validation agreement
        if not quant_metrics["feasible"]:
            quantum_res["feasible"] = False
        
    result_record = {
        "run_id": run_id,
        "timestamp": timestamp,
        "scenario_name": scenario_name,
        "number_of_sources": len(grid.sources),
        "number_of_loads": len(grid.loads),
        "total_supply": grid.get_total_supply(),
        "total_demand": grid.get_total_demand(),
        "power_granularity": granularity,
        
        "classical_allocated": class_metrics["total_allocated"],
        "classical_unmet_demand": class_metrics["unmet_demand"],
        "classical_weighted_unmet_demand": class_metrics["weighted_unmet_demand"],
        "classical_utilization": class_metrics["utilization"],
        "classical_objective": classical_res["objective"],
        "classical_runtime": classical_res["runtime"],
        "classical_feasible": class_metrics["feasible"],
        
        "quantum_allocated": quant_metrics["total_allocated"] if quant_metrics else None,
        "quantum_unmet_demand": quant_metrics["unmet_demand"] if quant_metrics else None,
        "quantum_weighted_unmet_demand": quant_metrics["weighted_unmet_demand"] if quant_metrics else None,
        "quantum_utilization": quant_metrics["utilization"] if quant_metrics else None,
        "quantum_objective": quantum_res["objective"] if quantum_res else None,
        "quantum_runtime": quantum_res["runtime"] if quantum_res else None,
        "quantum_feasible": quantum_res["feasible"] if quantum_res else None,
        "quantum_variable_count": quantum_res.get("qubits", 0) if quantum_res else None,
    }
    
    csv_path = os.path.join(RUNS_DIR, "experiment_history.csv")
    df = pd.DataFrame([result_record])
    if os.path.exists(csv_path):
        df.to_csv(csv_path, mode='a', header=False, index=False)
    else:
        df.to_csv(csv_path, index=False)
        
    return {
        "record": result_record,
        "classical_res": classical_res,
        "classical_metrics": class_metrics,
        "quantum_res": quantum_res,
        "quantum_metrics": quant_metrics
    }
