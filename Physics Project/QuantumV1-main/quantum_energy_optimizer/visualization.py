import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import os
from quantum_energy_optimizer.config import PLOTS_DIR

def plot_allocation_comparison(grid, class_alloc, quant_alloc, run_id, save=True):
    loads = [l.name for l in grid.loads]
    demand = [l.demand_kw for l in grid.loads]
    c_alloc = [class_alloc.get(name, 0) for name in loads]
    q_alloc = [quant_alloc.get(name, 0) if quant_alloc else 0 for name in loads]
    
    x = np.arange(len(loads))
    width = 0.25

    fig, ax = plt.subplots(figsize=(10, 6))
    rects1 = ax.bar(x - width, demand, width, label='Demand')
    rects2 = ax.bar(x, c_alloc, width, label='Classical Allocated')
    if quant_alloc:
        rects3 = ax.bar(x + width, q_alloc, width, label='Quantum Allocated')

    ax.set_ylabel('Power (kW)')
    ax.set_title('Demand vs Allocated Power by Load')
    ax.set_xticks(x, loads)
    ax.legend()

    fig.tight_layout()
    if save:
        plt.savefig(os.path.join(PLOTS_DIR, f"{run_id}_allocation.png"), dpi=300)
    return fig

def plot_unmet_demand(grid, class_alloc, quant_alloc, run_id, save=True):
    loads = [l.name for l in grid.loads]
    c_unmet = [max(0, l.demand_kw - class_alloc.get(l.name, 0)) for l in grid.loads]
    q_unmet = [max(0, l.demand_kw - quant_alloc.get(l.name, 0)) if quant_alloc else 0 for l in grid.loads]
    
    x = np.arange(len(loads))
    width = 0.35

    fig, ax = plt.subplots(figsize=(10, 6))
    rects1 = ax.bar(x - width/2, c_unmet, width, label='Classical Unmet')
    if quant_alloc:
        rects2 = ax.bar(x + width/2, q_unmet, width, label='Quantum Unmet')

    ax.set_ylabel('Unmet Power (kW)')
    ax.set_title('Unmet Demand by Load')
    ax.set_xticks(x, loads)
    ax.legend()

    fig.tight_layout()
    if save:
        plt.savefig(os.path.join(PLOTS_DIR, f"{run_id}_unmet.png"), dpi=300)
    return fig
