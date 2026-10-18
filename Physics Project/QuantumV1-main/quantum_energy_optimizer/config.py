"""Configuration settings for the Quantum Smart Energy Distribution Simulator."""
import os

PRIORITY_WEIGHTS = {
    "Critical": 1000,
    "High": 100,
    "Medium": 10,
    "Low": 1
}

# Quantum simulation settings
MAX_QUANTUM_QUBITS = 24  # Avoid simulating too large a problem
DEFAULT_POWER_GRANULARITY = 1  # 1 kW discretizations by default
DEFAULT_QAOA_MAXITER = 30  # Defensible evaluation budget for QAOA variational optimization
DEFAULT_QAOA_REPS = 1  # Appropriate QAOA depth for small grid simulation scale

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Experiment directories
RUNS_DIR = os.path.join(BASE_DIR, "data", "runs")
PLOTS_DIR = os.path.join(BASE_DIR, "outputs", "plots")
EXPERIMENTS_DIR = os.path.join(BASE_DIR, "outputs", "experiments")

# Ensure directories exist
os.makedirs(RUNS_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)
os.makedirs(EXPERIMENTS_DIR, exist_ok=True)
