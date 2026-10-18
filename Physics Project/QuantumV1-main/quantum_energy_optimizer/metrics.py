from typing import Dict, Any
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.config import PRIORITY_WEIGHTS

def validate_and_calculate_metrics(grid: SmartGrid, allocations: Dict[str, float], granularity: float) -> Dict[str, Any]:
    """Validates the allocations and computes key metrics."""
    total_supply = grid.get_total_supply()
    total_allocated = 0.0
    weighted_unmet_demand = 0.0
    unmet_demand_total = 0.0
    
    feasible = True
    messages = []
    
    for load in grid.loads:
        alloc = allocations.get(load.name, 0.0)
        
        if alloc < 0:
            feasible = False
            messages.append(f"Negative allocation for {load.name}")
            
        if alloc > load.demand_kw:
            if alloc - load.demand_kw > 1e-5:
                feasible = False
                messages.append(f"Allocation exceeds demand for {load.name}")
            else:
                alloc = load.demand_kw
                
        # Check granularity
        if alloc > 0 and abs((alloc / granularity) - round(alloc / granularity)) > 1e-4:
            feasible = False
            messages.append(f"Allocation for {load.name} is not a multiple of granularity {granularity}")
            
        total_allocated += alloc
        unmet = max(0.0, load.demand_kw - alloc)
        unmet_demand_total += unmet
        weight = PRIORITY_WEIGHTS.get(load.priority, 1)
        weighted_unmet_demand += weight * unmet
        
    if total_allocated > total_supply + 1e-5:
        feasible = False
        messages.append("Total allocated exceeds total supply")
        
    total_demand = grid.get_total_demand()
    
    return {
        "total_supply": total_supply,
        "total_demand": total_demand,
        "total_allocated": total_allocated,
        "unmet_demand": unmet_demand_total,
        "weighted_unmet_demand": weighted_unmet_demand,
        "utilization": (total_allocated / total_supply) * 100 if total_supply > 0 else 0,
        "feasible": feasible,
        "messages": messages
    }
