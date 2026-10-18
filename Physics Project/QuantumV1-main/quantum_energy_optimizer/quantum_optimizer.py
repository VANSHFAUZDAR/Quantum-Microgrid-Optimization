import time
from typing import Dict, Any, Optional, Callable
import numpy as np

from qiskit_algorithms.minimum_eigensolvers import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit_optimization.algorithms import MinimumEigenOptimizer
from qiskit.primitives import StatevectorSampler as Sampler

from quantum_energy_optimizer.models import Load
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.optimization import create_quadratic_program, get_qubo
from quantum_energy_optimizer.config import (
    MAX_QUANTUM_QUBITS,
    DEFAULT_QAOA_MAXITER,
    DEFAULT_QAOA_REPS,
    PRIORITY_WEIGHTS,
)


class DecomposeTranspiler:
    """Transpiler that unpacks high-level QAOA PauliEvolution gates into elementary gates.

    In Qiskit 1.0+, QAOAAnsatz preserves cost and mixer evolutions as high-level
    PauliEvolutionGate instances. Without decomposing, Statevector simulation falls back to
    PauliEvolutionGate.to_matrix(), invoking scipy.sparse.linalg.expm on a 2^N x 2^N matrix
    at every single COBYLA evaluation. This stalls simulation even for small qubit counts.

    Decomposing transforms the commuting Ising Hamiltonian evolution into native single-qubit
    and two-qubit rotations (rx, rz, rzz, u) with zero Trotter error, allowing StatevectorSampler
    to simulate each variational state in milliseconds.
    """

    def run(self, circuit, **kwargs):
        decomposed = circuit
        for _ in range(3):
            if any(getattr(inst.operation, "name", "") in ("QAOA", "PauliEvolution") for inst in decomposed):
                decomposed = decomposed.decompose()
            else:
                break
        return decomposed


class QuantumOptimizer:
    """Solves the discrete energy allocation problem using QAOA simulation."""

    def __init__(
        self,
        grid: SmartGrid,
        granularity: float = 1.0,
        reps: int = DEFAULT_QAOA_REPS,
        maxiter: int = DEFAULT_QAOA_MAXITER,
        callback: Optional[Callable[[int, np.ndarray, float, dict], None]] = None,
        initial_point: Optional[np.ndarray] = None,
    ):
        self.grid = grid
        self.granularity = granularity
        self.reps = reps
        self.maxiter = maxiter
        self.callback = callback
        self.initial_point = (
            initial_point if initial_point is not None else np.full(2 * reps, 0.5)
        )
        self._sampler = Sampler(default_shots=2048)
        self._transpiler = DecomposeTranspiler()

    def solve(self) -> Dict[str, Any]:
        start_time = time.time()
        loads = self.grid.loads
        total_supply = self.grid.get_total_supply()
        total_demand = self.grid.get_total_demand()

        # Handle trivial zero-load case
        if len(loads) == 0:
            return {
                "allocations": {},
                "objective": 0.0,
                "runtime": time.time() - start_time,
                "feasible": True,
                "status": "Optimal (empty grid)",
                "qubits": 0,
                "evaluations": 0,
                "converged": True,
                "fallback_used": False,
            }

        # Handle zero supply
        if total_supply <= 1e-9:
            allocs = {load.name: 0.0 for load in loads}
            obj = sum(PRIORITY_WEIGHTS.get(l.priority, 1) * l.demand_kw for l in loads)
            return {
                "allocations": allocs,
                "objective": obj,
                "runtime": time.time() - start_time,
                "feasible": True,
                "status": "Optimal (zero supply)",
                "qubits": 0,
                "evaluations": 0,
                "converged": True,
                "fallback_used": False,
            }

        # Handle zero demand
        if total_demand <= 1e-9:
            allocs = {load.name: 0.0 for load in loads}
            return {
                "allocations": allocs,
                "objective": 0.0,
                "runtime": time.time() - start_time,
                "feasible": True,
                "status": "Optimal (zero demand)",
                "qubits": 0,
                "evaluations": 0,
                "converged": True,
                "fallback_used": False,
            }

        qp = create_quadratic_program(self.grid, self.granularity)
        qubo = get_qubo(qp)
        qubits_needed = qubo.get_num_vars()

        if qubits_needed > MAX_QUANTUM_QUBITS:
            return {
                "allocations": {load.name: 0.0 for load in loads},
                "objective": sum(PRIORITY_WEIGHTS.get(load.priority, 1) * load.demand_kw for load in loads),
                "runtime": 0.0,
                "feasible": False,
                "status": f"Too many qubits required: {qubits_needed} > {MAX_QUANTUM_QUBITS}",
                "qubits": qubits_needed,
                "evaluations": 0,
                "converged": False,
                "fallback_used": False,
            }

        eval_count = 0

        def qaoa_callback(evals, params, value, meta):
            nonlocal eval_count
            eval_count = evals
            if self.callback:
                self.callback(evals, params, value, meta)

        optimizer = COBYLA(maxiter=self.maxiter)
        qaoa = QAOA(
            sampler=self._sampler,
            optimizer=optimizer,
            reps=self.reps,
            initial_point=self.initial_point,
            transpiler=self._transpiler,
            callback=qaoa_callback,
        )
        eigen_optimizer = MinimumEigenOptimizer(qaoa)

        try:
            result = eigen_optimizer.solve(qp)
        except Exception as exc:
            runtime = time.time() - start_time
            return {
                "allocations": {load.name: 0.0 for load in loads},
                "objective": sum(PRIORITY_WEIGHTS.get(l.priority, 1) * l.demand_kw for l in loads),
                "runtime": runtime,
                "feasible": False,
                "status": f"Optimization failed with exception: {str(exc)}",
                "qubits": qubits_needed,
                "evaluations": eval_count,
                "converged": False,
                "fallback_used": False,
            }

        runtime = time.time() - start_time

        # Physical feasibility validator
        def check_feasibility(alloc_candidate: Dict[str, float]) -> bool:
            tot = 0.0
            for l in loads:
                v = alloc_candidate.get(l.name, 0.0)
                if v < -1e-5:
                    return False
                if v > l.demand_kw + 1e-5:
                    return False
                if v > 1e-5 and abs((v / self.granularity) - round(v / self.granularity)) > 1e-4:
                    return False
                tot += v
            if tot > total_supply + 1e-5:
                return False
            return True

        best_allocations = None
        best_objective = float("inf")
        is_converged = result.status.name == "SUCCESS"

        # 1. Primary candidate from result.variables_dict
        if is_converged:
            candidate = {}
            for l in loads:
                n_val = round(result.variables_dict.get(l.name, 0.0))
                candidate[l.name] = n_val * self.granularity
            if check_feasibility(candidate):
                best_allocations = candidate
                best_objective = sum(
                    PRIORITY_WEIGHTS.get(l.priority, 1) * max(0.0, l.demand_kw - candidate[l.name])
                    for l in loads
                )

        # 2. Check all returned samples for the best valid candidate if primary was not valid or to verify optimality
        if hasattr(result, "samples") and result.samples:
            for sample in result.samples:
                cand = {}
                for idx, l in enumerate(loads):
                    n_val = round(sample.x[idx])
                    cand[l.name] = n_val * self.granularity
                if check_feasibility(cand):
                    obj = sum(
                        PRIORITY_WEIGHTS.get(l.priority, 1) * max(0.0, l.demand_kw - cand[l.name])
                        for l in loads
                    )
                    if obj < best_objective:
                        best_objective = obj
                        best_allocations = cand

        if best_allocations is not None:
            return {
                "allocations": best_allocations,
                "objective": best_objective,
                "runtime": runtime,
                "feasible": True,
                "status": "Optimal" if is_converged else "Feasible candidate from QAOA samples",
                "qubits": qubits_needed,
                "evaluations": eval_count,
                "converged": is_converged,
                "fallback_used": False,
            }
        else:
            return {
                "allocations": {load.name: 0.0 for load in loads},
                "objective": sum(PRIORITY_WEIGHTS.get(l.priority, 1) * l.demand_kw for l in loads),
                "runtime": runtime,
                "feasible": False,
                "status": f"No feasible state found ({result.status.name})",
                "qubits": qubits_needed,
                "evaluations": eval_count,
                "converged": False,
                "fallback_used": False,
            }
