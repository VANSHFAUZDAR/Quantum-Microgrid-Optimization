from qiskit_optimization import QuadraticProgram
from qiskit_optimization.converters import IntegerToBinary, LinearEqualityToPenalty, InequalityToEquality
import math
from quantum_energy_optimizer.models import Load
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.config import PRIORITY_WEIGHTS

def create_quadratic_program(grid: SmartGrid, granularity: float) -> QuadraticProgram:
    """Creates a Qiskit QuadraticProgram for the energy distribution problem."""
    qp = QuadraticProgram("Energy_Distribution")
    
    total_supply = grid.get_total_supply()
    loads = grid.loads
    
    # Define variables
    for load in loads:
        max_n = math.floor(load.demand_kw / granularity)
        qp.integer_var(lowerbound=0, upperbound=max_n, name=load.name)
        
    linear_terms = {}
    constant_term = 0.0
    
    for load in loads:
        weight = PRIORITY_WEIGHTS.get(load.priority, 1)
        constant_term += weight * load.demand_kw
        linear_terms[load.name] = -weight * granularity
        
    qp.minimize(constant=constant_term, linear=linear_terms)
    
    # Constraint: sum(n_i * g) <= total_supply
    constraint_linear = {load.name: granularity for load in loads}
    qp.linear_constraint(linear=constraint_linear, sense='<=', rhs=total_supply, name='supply')
    
    return qp

def get_qubo(qp: QuadraticProgram) -> QuadraticProgram:
    """Converts the QuadraticProgram into a QUBO (unconstrained binary)."""
    # 1. Convert inequalities to equalities
    ineq2eq = InequalityToEquality()
    qp_eq = ineq2eq.convert(qp)
    
    # 2. Convert integers to binary
    int2bin = IntegerToBinary()
    qp_bin = int2bin.convert(qp_eq)
    
    # 3. Add penalty for linear equality constraints
    lin2pen = LinearEqualityToPenalty()
    qubo = lin2pen.convert(qp_bin)
    
    return qubo
