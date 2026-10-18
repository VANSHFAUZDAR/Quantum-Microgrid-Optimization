import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds
import math
from quantum_energy_optimizer.models import Load
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.config import PRIORITY_WEIGHTS
import time

class ClassicalOptimizer:
    def __init__(self, grid: SmartGrid, granularity: float = 1.0):
        self.grid = grid
        self.granularity = granularity

    def solve(self):
        start_time = time.time()
        
        loads = self.grid.loads
        n_vars = len(loads)
        if n_vars == 0:
            return {"allocations": {}, "objective": 0.0, "runtime": time.time() - start_time, "feasible": True}
            
        total_supply = self.grid.get_total_supply()
        
        # We want to solve for variables n_i (integer number of granular units)
        # x_i = n_i * granularity
        # Minimize sum( w_i * (D_i - n_i * g) ) <=> Minimize sum(w_i*D_i) - sum(w_i * g * n_i)
        # Since milp minimizes c^T x, we set c_i = - w_i * g
        
        c = np.zeros(n_vars)
        upper_bounds = np.zeros(n_vars)
        
        for i, load in enumerate(loads):
            weight = PRIORITY_WEIGHTS.get(load.priority, 1)
            c[i] = - (weight * self.granularity)
            upper_bounds[i] = math.floor(load.demand_kw / self.granularity)
            
        bounds = Bounds(lb=np.zeros(n_vars), ub=upper_bounds)
        
        # Constraint: sum(n_i * g) <= total_supply
        A = np.ones((1, n_vars)) * self.granularity
        b_u = np.array([total_supply])
        b_l = np.array([-np.inf])
        
        constraints = LinearConstraint(A, b_l, b_u)
        
        integrality = np.ones(n_vars) # All variables are integers
        
        res = milp(c=c, constraints=constraints, integrality=integrality, bounds=bounds)
        
        runtime = time.time() - start_time
        
        if res.success:
            allocations = {}
            original_objective = 0.0
            for i, load in enumerate(loads):
                allocated_n = round(res.x[i])
                allocated_power = allocated_n * self.granularity
                allocations[load.name] = allocated_power
                
                weight = PRIORITY_WEIGHTS.get(load.priority, 1)
                original_objective += weight * (load.demand_kw - allocated_power)
                
            return {
                "allocations": allocations,
                "objective": original_objective,
                "runtime": runtime,
                "feasible": True,
                "status": "Optimal"
            }
        else:
            return {
                "allocations": {load.name: 0.0 for load in loads},
                "objective": sum(PRIORITY_WEIGHTS.get(l.priority, 1) * l.demand_kw for l in loads),
                "runtime": runtime,
                "feasible": False,
                "status": res.message
            }
