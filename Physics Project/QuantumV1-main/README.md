# Quantum-Optimization-Based Smart Energy Distribution Simulator

This is a complete, working prototype for a college research/project demonstration. It optimizes smart-grid energy distribution across loads based on priorities, using both a classical reference solver and a QAOA quantum simulator.

## Mathematical Formulation
The optimizer allocates limited power to minimize priority-weighted unmet demand.

**Decision Variable:**
`x_i` = allocated power to load `i`

**Unmet Demand:**
`u_i` = `D_i` - `x_i`

**Supply Constraint:**
`Σx_i ≤ S` (Total allocated power cannot exceed total available supply)

**Load Constraint:**
`0 ≤ x_i ≤ D_i` (Cannot allocate less than 0 or more than the load demands)

**Objective Function:**
`min Σ w_i * (D_i - x_i)`

Where `w_i` is the priority weight of load `i`. This means critical loads are heavily penalized for unmet demand, ensuring they receive power first during a shortage.

## QUBO and Quantum Approach
The constrained optimization problem is mapped to a Quadratic Unconstrained Binary Optimization (QUBO) model. Continuous power values are discretized based on a configurable "power granularity" to reduce the number of qubits required. The QUBO is then solved using the Quantum Approximate Optimization Algorithm (QAOA) on a local quantum simulator (Qiskit Aer / Sampler). 

This is a proof-of-concept simulation showing how quantum optimization can be formulated for grid problems. A size limit is enforced on the quantum solver, as the local simulator is computationally bound.

## Installation

```bash
python -m venv .venv
# Activate environment (Windows)
.venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Application
To run the interactive Streamlit dashboard:
```bash
streamlit run app.py
```

## Running Tests
To run the full pytest suite:
```bash
pytest quantum_energy_optimizer/tests/
```

## Running Benchmarks
To run the automated research benchmarks:
```bash
python run_benchmarks.py
```

## Limitations
- **Prototype Status:** This is a simulation/prototype, not a real-time power-grid controller.
- **Simulator Execution:** The quantum algorithm is simulated on a classical CPU; this does not represent physical "quantum advantage".
