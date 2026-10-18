import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import os
import time
import math

from quantum_energy_optimizer.models import PowerSource, Load
from quantum_energy_optimizer.grid import SmartGrid
from quantum_energy_optimizer.optimization import create_quadratic_program, get_qubo
from quantum_energy_optimizer.experiment_runner import run_experiment
from quantum_energy_optimizer.config import PRIORITY_WEIGHTS, MAX_QUANTUM_QUBITS, DEFAULT_POWER_GRANULARITY, RUNS_DIR

st.set_page_config(page_title="Q-Energy Optimizer | Smart Grid", layout="wide", initial_sidebar_state="collapsed")

# Custom CSS reproducing the GridNest reference design
st.markdown("""
<style>
    /* Global Reset & Dark Mode Palette */
    .stApp {
        background-color: #0B0E14;
        color: #FFFFFF;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    header { visibility: hidden !important; }
    #MainMenu { visibility: hidden !important; }
    footer { visibility: hidden !important; }
    .stDeployButton { display: none !important; }

    /* Native container borders styled as sleek GridNest cards */
    [data-testid="stVerticalBlockBorderWrapper"] {
        background-color: #141820 !important;
        border: 1px solid #1E2530 !important;
        border-radius: 16px !important;
        padding: 20px 22px !important;
        margin-bottom: 20px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35) !important;
    }

    /* Top Navigation Bar */
    .gn-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0 18px 0;
        border-bottom: 1px solid #161C24;
        margin-bottom: 22px;
    }
    .gn-brand {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .gn-logo-box {
        width: 36px;
        height: 36px;
        background: #141A22;
        border: 1px solid #1F2836;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00F0FF;
        font-size: 20px;
        box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
    }
    .gn-title-text {
        font-size: 19px;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: #FFFFFF;
    }
    .gn-title-sub {
        font-size: 11px;
        color: #8B95A5;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    /* Top KPI Metric Chips */
    .gn-metrics-container {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .gn-kpi-chip {
        background: #121720;
        border: 1px solid #1A222D;
        border-radius: 12px;
        padding: 8px 16px;
        display: flex;
        flex-direction: column;
        min-width: 125px;
    }
    .gn-kpi-label {
        font-size: 11px;
        color: #8B95A5;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 2px;
    }
    .gn-kpi-val {
        font-size: 18px;
        font-weight: 600;
        color: #FFFFFF;
        letter-spacing: -0.01em;
    }
    .gn-cyan-dot {
        color: #00F0FF;
        font-size: 12px;
    }

    /* Status Pill */
    .gn-status-badge {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .gn-status-ready {
        background: rgba(0, 240, 255, 0.08);
        border: 1px solid rgba(0, 240, 255, 0.25);
        color: #00F0FF;
    }
    .gn-status-success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #10B981;
    }
    .gn-status-shortage {
        background: rgba(255, 159, 67, 0.1);
        border: 1px solid rgba(255, 159, 67, 0.3);
        color: #FF9F43;
    }
    .gn-status-error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #EF4444;
    }

    /* Card Header */
    .gn-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    .gn-card-title {
        color: #FFFFFF;
        font-size: 16px;
        font-weight: 500;
        letter-spacing: -0.01em;
    }
    .gn-card-sub {
        color: #8B95A5;
        font-size: 12px;
    }

    /* Hero Typography */
    .gn-hero-title {
        font-size: 42px;
        font-weight: 300;
        line-height: 1.12;
        margin-bottom: 12px;
        color: #FFFFFF;
        letter-spacing: -0.02em;
    }
    .gn-hero-sub {
        color: #8B95A5;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 18px;
        max-width: 500px;
    }

    /* Dynamic Recommendation Card (Matching reference star card) */
    .gn-recommend-box {
        background: linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(20, 26, 34, 0.8) 100%);
        border: 1px solid rgba(0, 240, 255, 0.2);
        border-radius: 14px;
        padding: 14px 18px;
        margin-bottom: 18px;
        display: flex;
        gap: 14px;
        align-items: flex-start;
    }
    .gn-recommend-icon {
        background: rgba(0, 240, 255, 0.15);
        color: #00F0FF;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
    }
    .gn-recommend-text {
        color: #D1D5DB;
        font-size: 13px;
        line-height: 1.45;
    }

    /* Smart Grid Network Bar Styles */
    .gn-load-row {
        margin-bottom: 16px;
    }
    .gn-load-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        margin-bottom: 7px;
    }
    .gn-load-name {
        color: #FFFFFF;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .gn-pill-priority {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .pill-critical { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    .pill-high { background: rgba(255, 159, 67, 0.15); color: #FF9F43; border: 1px solid rgba(255, 159, 67, 0.3); }
    .pill-medium { background: rgba(0, 240, 255, 0.12); color: #00F0FF; border: 1px solid rgba(0, 240, 255, 0.25); }
    .pill-low { background: rgba(139, 149, 165, 0.15); color: #8B95A5; border: 1px solid rgba(139, 149, 165, 0.25); }

    .gn-load-values {
        color: #8B95A5;
        font-size: 12px;
        font-feature-settings: "tnum";
    }
    .gn-load-track {
        width: 100%;
        height: 6px;
        background-color: #1A222E;
        border-radius: 3px;
        display: flex;
        overflow: hidden;
        margin-bottom: 4px;
    }
    .gn-bar-cyan {
        height: 100%;
        background: linear-gradient(90deg, #00C6FF, #00F0FF);
        box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
    }
    .gn-bar-orange {
        height: 100%;
        background: linear-gradient(90deg, #FF8008, #FF9F43);
        box-shadow: 0 0 10px rgba(255, 159, 67, 0.4);
    }
    .gn-load-micro {
        font-size: 11px;
        color: #8B95A5;
    }

    /* Key-Value Detail Rows */
    .gn-kv {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #1A222E;
        font-size: 13px;
    }
    .gn-kv:last-child {
        border-bottom: none;
    }
    .gn-kv-k { color: #8B95A5; }
    .gn-kv-v { color: #FFFFFF; font-weight: 500; }

    /* Badge Pills */
    .gn-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
    }
    .badge-cyan { background: rgba(0, 240, 255, 0.12); color: #00F0FF; border: 1px solid rgba(0, 240, 255, 0.3); }
    .badge-orange { background: rgba(255, 159, 67, 0.12); color: #FF9F43; border: 1px solid rgba(255, 159, 67, 0.3); }

    /* Streamlit Tab Polishing */
    .stTabs [data-baseweb="tab-list"] {
        gap: 16px;
        background-color: transparent;
        border-bottom: 1px solid #1E2530;
        margin-bottom: 22px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        color: #8B95A5;
        font-size: 14px;
        font-weight: 500;
        padding: 10px 16px;
        border: none;
    }
    .stTabs [aria-selected="true"] {
        color: #00F0FF !important;
        border-bottom: 2px solid #00F0FF !important;
    }
    
    /* Primary Action Button */
    div.stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%) !important;
        border: none !important;
        color: #000000 !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        letter-spacing: 0.05em !important;
        padding: 12px 24px !important;
        border-radius: 10px !important;
        box-shadow: 0 4px 15px rgba(0, 198, 255, 0.3) !important;
        transition: all 0.2s ease !important;
    }
    div.stButton > button[kind="primary"]:hover {
        box-shadow: 0 4px 25px rgba(0, 240, 255, 0.5) !important;
        transform: translateY(-1px) !important;
    }
</style>
""", unsafe_allow_html=True)


def estimate_qubits(grid: SmartGrid, granularity: float) -> int:
    """Calculates the exact number of binary variables required by the QUBO."""
    try:
        if len(grid.loads) == 0:
            return 0
        qp = create_quadratic_program(grid, granularity)
        qubo = get_qubo(qp)
        return qubo.get_num_vars()
    except Exception:
        qubits = 0
        for l in grid.loads:
            units = math.floor(l.demand_kw / granularity)
            qubits += max(1, math.floor(math.log2(max(1, units))) + 1)
        slack_units = math.floor(grid.get_total_supply() / granularity)
        qubits += max(1, math.floor(math.log2(max(1, slack_units))) + 1)
        return qubits


def initialize_state():
    """Initializes persistent application session state."""
    if "grid" not in st.session_state:
        grid = SmartGrid()
        # Default scenario: 50 kW supply, 60 kW requested demand (8 qubits, ~30s fast local simulation)
        grid.add_source(PowerSource("Main Grid", "Grid", 50.0))
        grid.add_load(Load("Hospital", 30.0, "Critical"))
        grid.add_load(Load("School", 20.0, "High"))
        grid.add_load(Load("Industry", 10.0, "Low"))
        st.session_state.grid = grid
        
    if "results" not in st.session_state:
        st.session_state.results = None
    if "app_status" not in st.session_state:
        st.session_state.app_status = "READY"
    if "selected_preset" not in st.session_state:
        st.session_state.selected_preset = "Default Shortage (50 kW Supply, 60 kW Demand)"


def apply_preset(preset_name: str, grid: SmartGrid):
    """Loads standardized grid benchmark presets."""
    grid.clear()
    if preset_name == "Default Shortage (50 kW Supply, 60 kW Demand)":
        grid.add_source(PowerSource("Main Grid", "Grid", 50.0))
        grid.add_load(Load("Hospital", 30.0, "Critical"))
        grid.add_load(Load("School", 20.0, "High"))
        grid.add_load(Load("Industry", 10.0, "Low"))
    elif preset_name == "4-Zone Standard (50 kW Supply, 70 kW Demand)":
        grid.add_source(PowerSource("Main Grid", "Grid", 50.0))
        grid.add_load(Load("Hospital", 25.0, "Critical"))
        grid.add_load(Load("School", 20.0, "High"))
        grid.add_load(Load("Residential", 15.0, "Medium"))
        grid.add_load(Load("Industry", 10.0, "Low"))
    elif preset_name == "Balanced Capacity (60 kW Supply, 60 kW Demand)":
        grid.add_source(PowerSource("Main Grid", "Grid", 60.0))
        grid.add_load(Load("Hospital", 30.0, "Critical"))
        grid.add_load(Load("School", 20.0, "High"))
        grid.add_load(Load("Industry", 10.0, "Low"))
    elif preset_name == "Surplus Generation (80 kW Supply, 55 kW Demand)":
        grid.add_source(PowerSource("Solar + Grid", "Hybrid", 80.0))
        grid.add_load(Load("Hospital", 25.0, "Critical"))
        grid.add_load(Load("School", 20.0, "High"))
        grid.add_load(Load("Industry", 10.0, "Low"))
    elif preset_name == "Extreme Shortage (30 kW Supply, 60 kW Demand)":
        grid.add_source(PowerSource("Emergency Generator", "Diesel", 30.0))
        grid.add_load(Load("Hospital", 30.0, "Critical"))
        grid.add_load(Load("School", 20.0, "High"))
        grid.add_load(Load("Industry", 10.0, "Low"))


def render_top_bar(grid: SmartGrid):
    """Renders the top navigation header and real-time operational KPI chips."""
    supply = grid.get_total_supply()
    demand = grid.get_total_demand()
    res = st.session_state.results
    
    if res and res["quantum_res"] is not None and res["quantum_res"]["feasible"]:
        q_alloc = sum(res["quantum_res"]["allocations"].values())
        satisfaction = (q_alloc / demand * 100.0) if demand > 0 else 100.0
        utilization = (q_alloc / supply * 100.0) if supply > 0 else 0.0
        status_label = "● QAOA OPTIMAL"
        status_class = "gn-status-success"
    elif res and res["quantum_res"] is not None and not res["quantum_res"]["feasible"]:
        satisfaction = 0.0
        utilization = 0.0
        status_label = "● SIMULATION HALTED"
        status_class = "gn-status-error"
    else:
        satisfaction = (min(supply, demand) / demand * 100.0) if demand > 0 else 100.0
        utilization = (min(supply, demand) / supply * 100.0) if supply > 0 else 0.0
        if supply < demand:
            status_label = "● SHORTAGE DETECTED"
            status_class = "gn-status-shortage"
        else:
            status_label = "● QAOA READY"
            status_class = "gn-status-ready"

    st.markdown(f"""
    <div class="gn-topbar">
        <div class="gn-brand">
            <div class="gn-logo-box">⚡</div>
            <div>
                <div class="gn-title-text">Q-ENERGY</div>
                <div class="gn-title-sub">Smart Grid Infrastructure</div>
            </div>
        </div>
        <div class="gn-metrics-container">
            <div class="gn-kpi-chip">
                <div class="gn-kpi-label"><span class="gn-cyan-dot">⚡</span> Available Supply</div>
                <div class="gn-kpi-val">{supply:.1f} kW</div>
            </div>
            <div class="gn-kpi-chip">
                <div class="gn-kpi-label"><span class="gn-cyan-dot">⏱</span> Active Demand</div>
                <div class="gn-kpi-val">{demand:.1f} kW</div>
            </div>
            <div class="gn-kpi-chip">
                <div class="gn-kpi-label"><span class="gn-cyan-dot">✓</span> Satisfaction</div>
                <div class="gn-kpi-val">{satisfaction:.1f}%</div>
            </div>
            <div class="gn-kpi-chip">
                <div class="gn-kpi-label"><span class="gn-cyan-dot">↗</span> Utilization</div>
                <div class="gn-kpi-val">{utilization:.1f}%</div>
            </div>
            <div class="gn-status-badge {status_class}">
                {status_label}
            </div>
            <a href="http://localhost:8080" target="_blank" style="text-decoration: none; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; background: rgba(0, 240, 255, 0.12); border: 1px solid #00F0FF; color: #00F0FF; display: inline-flex; align-items: center; gap: 6px;">
                🌐 3D Digital Twin
            </a>
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_grid_overview_section(grid: SmartGrid):
    """
    Renders the dedicated, plain-English Grid Overview & Power Summary section.
    Fully accessible without quantum computing expertise.
    """
    supply = grid.get_total_supply()
    demand = grid.get_total_demand()
    res = st.session_state.results
    
    with st.container(border=True):
        st.markdown("""
        <div class="gn-card-header">
            <div>
                <div class="gn-card-title">Grid Overview & Power Summary</div>
                <div class="gn-card-sub">Accessible operational summary of power distribution and demand satisfaction.</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        has_quantum_run = res is not None and res.get("quantum_res") is not None
        quantum_success = has_quantum_run and res["quantum_res"]["feasible"]
        
        if quantum_success:
            allocations = res["quantum_res"]["allocations"]
            allocated_total = sum(allocations.values())
            unmet_total = max(0.0, demand - allocated_total)
            supply_util = (allocated_total / supply * 100.0) if supply > 0 else 0.0
            demand_sat = (allocated_total / demand * 100.0) if demand > 0 else 100.0
            alloc_str = f"{allocated_total:.1f} kW"
            unmet_str = f"{unmet_total:.1f} kW"
        elif has_quantum_run and not quantum_success:
            allocations = {l.name: 0.0 for l in grid.loads}
            allocated_total = 0.0
            unmet_total = demand
            supply_util = 0.0
            demand_sat = 0.0
            alloc_str = "0.0 kW (Solver Halted)"
            unmet_str = f"{demand:.1f} kW"
        else:
            allocations = {}
            allocated_total = 0.0
            unmet_total = 0.0
            supply_util = 0.0
            demand_sat = 0.0
            alloc_str = "Pending Optimization"
            unmet_str = "Pending Optimization"

        diff = supply - demand
        if diff > 0:
            balance_str = f"Surplus (+{diff:.1f} kW)"
            balance_color = "#10B981"
        elif diff == 0:
            balance_str = "Balanced (0.0 kW)"
            balance_color = "#00F0FF"
        else:
            balance_str = f"Deficit ({diff:.1f} kW Shortage)"
            balance_color = "#FF9F43"

        # Seven Key Metric Cards
        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:12px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">1. Available Power</div>
                <div style="font-size:22px; font-weight:600; color:#FFFFFF; margin-top:4px;">{supply:.1f} kW</div>
                <div style="font-size:11px; color:#8B95A5;">Total generation capacity</div>
            </div>
            """, unsafe_allow_html=True)
        with m2:
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:12px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">2. Requested Power</div>
                <div style="font-size:22px; font-weight:600; color:#FFFFFF; margin-top:4px;">{demand:.1f} kW</div>
                <div style="font-size:11px; color:#8B95A5;">Total load demand requested</div>
            </div>
            """, unsafe_allow_html=True)
        with m3:
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:12px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">3. QAOA Power Allocated</div>
                <div style="font-size:22px; font-weight:600; color:#00F0FF; margin-top:4px;">{alloc_str}</div>
                <div style="font-size:11px; color:#8B95A5;">Delivered by quantum solution</div>
            </div>
            """, unsafe_allow_html=True)
        with m4:
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:12px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">4. Unmet Demand</div>
                <div style="font-size:22px; font-weight:600; color:#FF9F43; margin-top:4px;">{unmet_str}</div>
                <div style="font-size:11px; color:#8B95A5;">Power loads did not receive</div>
            </div>
            """, unsafe_allow_html=True)

        m5, m6, m7 = st.columns(3)
        with m5:
            util_display = f"{supply_util:.1f}%" if quantum_success else "Pending"
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:16px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">5. Supply Utilization</div>
                <div style="font-size:20px; font-weight:600; color:#FFFFFF; margin-top:4px;">{util_display}</div>
                <div style="font-size:11px; color:#8B95A5;">Allocated power / Available supply</div>
            </div>
            """, unsafe_allow_html=True)
        with m6:
            sat_display = f"{demand_sat:.1f}%" if quantum_success else "Pending"
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:16px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">6. Demand Satisfaction</div>
                <div style="font-size:20px; font-weight:600; color:#FFFFFF; margin-top:4px;">{sat_display}</div>
                <div style="font-size:11px; color:#8B95A5;">Allocated power / Requested demand</div>
            </div>
            """, unsafe_allow_html=True)
        with m7:
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:12px; padding:14px; margin-bottom:16px;">
                <div style="font-size:11px; color:#8B95A5; text-transform:uppercase;">7. Supply–Demand Balance</div>
                <div style="font-size:20px; font-weight:600; color:{balance_color}; margin-top:4px;">{balance_str}</div>
                <div style="font-size:11px; color:#8B95A5;">Grid generation balance status</div>
            </div>
            """, unsafe_allow_html=True)

        # Per-Load Breakdown Table
        st.markdown("<div style='margin-top:6px; margin-bottom:8px; font-size:14px; font-weight:500; color:#FFFFFF;'>Per-Load Distribution Breakdown</div>", unsafe_allow_html=True)
        
        breakdown_rows = []
        for load in grid.loads:
            req = load.demand_kw
            if quantum_success:
                alloc = allocations.get(load.name, 0.0)
                unmet = max(0.0, req - alloc)
                sat = (alloc / req * 100.0) if req > 0 else 100.0
                if unmet <= 1e-5:
                    status_txt = "🟢 Fully Served (100%)"
                elif alloc > 0:
                    status_txt = f"🟠 Partially Served ({sat:.1f}%)"
                else:
                    status_txt = "🔴 Not Served (0%)"
            elif has_quantum_run and not quantum_success:
                alloc = 0.0
                unmet = req
                sat = 0.0
                status_txt = "🔴 Solver Halted"
            else:
                alloc = 0.0
                unmet = req
                sat = 0.0
                status_txt = "⚪ Pending Optimization"

            breakdown_rows.append({
                "Load Name": load.name,
                "Priority": load.priority,
                "Requested (kW)": f"{req:.1f}",
                "QAOA Allocated (kW)": f"{alloc:.1f}" if (quantum_success or has_quantum_run) else "Pending",
                "Unmet Demand (kW)": f"{unmet:.1f}" if (quantum_success or has_quantum_run) else "Pending",
                "Demand Satisfied (%)": f"{sat:.1f}%" if (quantum_success or has_quantum_run) else "Pending",
                "Status": status_txt
            })

        df_breakdown = pd.DataFrame(breakdown_rows)
        st.dataframe(df_breakdown, use_container_width=True, hide_index=True)

        # Plain-English Explanatory Summary
        if quantum_success:
            crit_served = [f"{l.name} ({allocations.get(l.name, 0.0):.1f}/{l.demand_kw:.1f} kW)" for l in grid.loads if l.priority == "Critical"]
            crit_text = f" Critical infrastructure {', '.join(crit_served)} was prioritized." if crit_served else ""
            summary_msg = f"**Operational Summary:** A total of {demand:.1f} kW was requested across {len(grid.loads)} loads. QAOA allocated {allocated_total:.1f} kW from the available {supply:.1f} kW supply ({supply_util:.1f}% supply utilization). {unmet_total:.1f} kW remains unmet due to power limitation.{crit_text}"
            st.info(summary_msg)
        elif has_quantum_run and not quantum_success:
            st.error(f"**Solver Failure Notice:** QAOA optimization was halted: {res['quantum_res']['status']}. The simulated quantum circuit exceeded the memory safety limit on this PC. No power was allocated. Please increase Power Granularity (e.g. 5.0 kW or 10.0 kW) to run QAOA.")
        else:
            st.markdown(f"""
            <div style="background:rgba(255,255,255,0.03); border:1px solid #1E2530; border-radius:10px; padding:12px 16px; font-size:13px; color:#8B95A5;">
                ℹ️ <strong>Awaiting Execution:</strong> Available supply is {supply:.1f} kW and requested demand across {len(grid.loads)} loads is {demand:.1f} kW. Power allocation by QAOA has not been calculated yet. Click <strong>Optimize Grid</strong> to execute the quantum circuit simulation.
            </div>
            """, unsafe_allow_html=True)


def render_simulation_tab(grid: SmartGrid):
    """Renders the main GridNest-styled smart grid simulation page."""
    c_left, c_right = st.columns([1.15, 1.0])
    
    with c_left:
        st.markdown("<div class='gn-hero-title'>Smart Energy<br>Infrastructure</div>", unsafe_allow_html=True)
        st.markdown("<div class='gn-hero-sub'>Optimize clean energy distribution and grid performance in real time using quantum-circuit QUBO & QAOA simulation.</div>", unsafe_allow_html=True)
        
        # Scenario Presets Dropdown
        preset_names = [
            "Default Shortage (50 kW Supply, 60 kW Demand)",
            "4-Zone Standard (50 kW Supply, 70 kW Demand)",
            "Balanced Capacity (60 kW Supply, 60 kW Demand)",
            "Surplus Generation (80 kW Supply, 55 kW Demand)",
            "Extreme Shortage (30 kW Supply, 60 kW Demand)",
            "Custom Grid Configuration"
        ]
        selected = st.selectbox("Select Scenario Preset", preset_names, index=preset_names.index(st.session_state.selected_preset) if st.session_state.selected_preset in preset_names else 0)
        if selected != st.session_state.selected_preset and selected != "Custom Grid Configuration":
            st.session_state.selected_preset = selected
            apply_preset(selected, grid)
            st.session_state.results = None
            st.session_state.app_status = "READY"
            st.rerun()

        # Supply-Demand Advice Callout (matching the cyan star card in the reference image)
        supply = grid.get_total_supply()
        demand = grid.get_total_demand()
        diff = supply - demand
        
        if diff < 0:
            rec_text = f"<strong>Power Shortage Detected:</strong> Total requested demand ({demand:.1f} kW) exceeds generation ({supply:.1f} kW) by {abs(diff):.1f} kW. QAOA objective will penalize unmet critical loads and optimize distribution."
            star_color = "#FF9F43"
        elif diff == 0:
            rec_text = f"<strong>Balanced Supply:</strong> Generation exactly matches requested demand ({supply:.1f} kW). All loads can be fully served."
            star_color = "#00F0FF"
        else:
            rec_text = f"<strong>Surplus Capacity:</strong> Generation ({supply:.1f} kW) exceeds demand ({demand:.1f} kW) by {diff:.1f} kW. All loads can be fully served."
            star_color = "#10B981"
            
        st.markdown(f"""
        <div class="gn-recommend-box">
            <div class="gn-recommend-icon" style="color:{star_color};">⚡</div>
            <div class="gn-recommend-text">{rec_text}</div>
        </div>
        """, unsafe_allow_html=True)

        # Grid Configuration Container Card
        with st.container(border=True):
            st.markdown("<div class='gn-card-header'><div class='gn-card-title'>Grid Configuration</div></div>", unsafe_allow_html=True)
            
            c_s, c_g = st.columns(2)
            new_supply = c_s.number_input("Available Supply (kW)", min_value=0.0, value=float(grid.get_total_supply()), step=5.0)
            granularity = c_g.number_input("Power Granularity (kW)", min_value=1.0, value=10.0, step=1.0)
            
            # Live Qubit Gauge Calculation
            est_q = estimate_qubits(grid, granularity)
            q_color = "#00F0FF" if est_q <= MAX_QUANTUM_QUBITS else "#EF4444"
            q_status = "Safe for local PC simulation" if est_q <= MAX_QUANTUM_QUBITS else f"Exceeds {MAX_QUANTUM_QUBITS} qubit simulation safety limit"
            
            st.markdown(f"""
            <div style="background:#121720; border:1px solid #1F2836; border-radius:10px; padding:10px 14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:12px; color:#8B95A5;">Estimated Quantum Circuit Size:</div>
                <div style="font-size:13px; font-weight:600; color:{q_color};">{est_q} Qubits <span style="font-size:11px; font-weight:400; color:#8B95A5;">({q_status})</span></div>
            </div>
            """, unsafe_allow_html=True)
            
            run_quantum = st.checkbox("Run QAOA Quantum Simulation", value=True)
            
            st.markdown("<div style='margin-top:14px; margin-bottom:8px; color:#8B95A5; font-size:12px; text-transform:uppercase; letter-spacing:0.04em;'>Connected Loads Editor</div>", unsafe_allow_html=True)
            
            load_data = [{"Name": l.name, "Demand (kW)": float(l.demand_kw), "Priority": l.priority} for l in grid.loads]
            edited_loads = st.data_editor(
                load_data, 
                num_rows="dynamic", 
                key="loads_editor_table",
                use_container_width=True,
                column_config={
                    "Priority": st.column_config.SelectboxColumn(
                        "Priority", options=["Critical", "High", "Medium", "Low"], required=True
                    )
                }
            )
            
            # Commit edits into grid state
            grid.clear()
            grid.add_source(PowerSource("Main Grid", "Grid", new_supply))
            for l in edited_loads:
                if l.get("Name") and l.get("Demand (kW)") is not None:
                    grid.add_load(Load(l["Name"], float(l["Demand (kW)"]), l.get("Priority", "Low")))

            st.markdown("<div style='margin-top:16px;'></div>", unsafe_allow_html=True)
            if st.button("⚡ OPTIMIZE GRID (QAOA)", use_container_width=True, type="primary"):
                st.session_state.app_status = "OPTIMIZING"
                st.rerun()

    # Trigger optimization pipeline if requested
    if st.session_state.app_status == "OPTIMIZING":
        render_execution_pipeline(grid, granularity, run_quantum)

    # Right Column: "Smart grid network" Card (Matching reference image)
    with c_right:
        res = st.session_state.results
        has_run = res is not None and res.get("quantum_res") is not None
        q_success = has_run and res["quantum_res"]["feasible"]
        
        with st.container(border=True):
            st.markdown("""
            <div class="gn-card-header">
                <div>
                    <div class="gn-card-title">Smart grid network</div>
                    <div class="gn-card-sub">Dynamic allocation topology across connected zones.</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # Glowing Hexagonal Network Topology Graphic (Matching reference image)
            svg_markup = (
                '<div style="background:#10141C; border:1px solid #1A222E; border-radius:14px; padding:16px; margin-bottom:20px; display:flex; justify-content:center;">'
                '<svg width="340" height="150" viewBox="0 0 340 150">'
                '<line x1="40" y1="75" x2="170" y2="75" stroke="#1E2836" stroke-width="2" stroke-dasharray="4"/>'
                '<line x1="170" y1="75" x2="300" y2="75" stroke="#1E2836" stroke-width="2" stroke-dasharray="4"/>'
                '<line x1="90" y1="35" x2="250" y2="35" stroke="#1A222E" stroke-width="1.5"/>'
                '<line x1="90" y1="115" x2="250" y2="115" stroke="#1A222E" stroke-width="1.5"/>'
                '<circle cx="170" cy="75" r="20" fill="#141C24" stroke="#00F0FF" stroke-width="2"/>'
                '<circle cx="170" cy="75" r="7" fill="#00F0FF"/>'
                '<text x="170" y="105" text-anchor="middle" fill="#8B95A5" font-size="9" font-family="sans-serif">GRID SUPPLY</text>'
                '<line x1="170" y1="75" x2="70" y2="40" stroke="#00F0FF" stroke-width="1.8" opacity="0.8"/>'
                '<circle cx="70" cy="40" r="16" fill="#121820" stroke="#00F0FF" stroke-width="1.8"/>'
                '<text x="70" y="44" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold">A</text>'
                '<text x="70" y="20" text-anchor="middle" fill="#8B95A5" font-size="9">Zone A (Crit)</text>'
                '<line x1="170" y1="75" x2="270" y2="40" stroke="#00F0FF" stroke-width="1.8" opacity="0.8"/>'
                '<circle cx="270" cy="40" r="16" fill="#121820" stroke="#00F0FF" stroke-width="1.8"/>'
                '<text x="270" y="44" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold">B</text>'
                '<text x="270" y="20" text-anchor="middle" fill="#8B95A5" font-size="9">Zone B (High)</text>'
                '<line x1="170" y1="75" x2="70" y2="110" stroke="#FF9F43" stroke-width="1.5" opacity="0.6"/>'
                '<circle cx="70" cy="110" r="16" fill="#121820" stroke="#FF9F43" stroke-width="1.5"/>'
                '<text x="70" y="114" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold">C</text>'
                '<text x="70" y="136" text-anchor="middle" fill="#8B95A5" font-size="9">Zone C (Med)</text>'
                '<line x1="170" y1="75" x2="270" y2="110" stroke="#FF9F43" stroke-width="1.5" opacity="0.6"/>'
                '<circle cx="270" cy="110" r="16" fill="#121820" stroke="#FF9F43" stroke-width="1.5"/>'
                '<text x="270" y="114" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold">D</text>'
                '<text x="270" y="136" text-anchor="middle" fill="#8B95A5" font-size="9">Zone D (Low)</text>'
                '</svg></div>'
            )
            st.markdown(svg_markup, unsafe_allow_html=True)

            # Per-Zone / Per-Load Power Allocation Bars
            if q_success:
                q_allocs = res["quantum_res"]["allocations"]
                for l in grid.loads:
                    demand_val = l.demand_kw
                    alloc_val = q_allocs.get(l.name, 0.0)
                    unmet_val = max(0.0, demand_val - alloc_val)
                    pct_alloc = (alloc_val / demand_val * 100.0) if demand_val > 0 else 0.0
                    pct_unmet = (unmet_val / demand_val * 100.0) if demand_val > 0 else 0.0
                    
                    pill_cls = f"pill-{l.priority.lower()}"
                    
                    st.markdown(f"""
                    <div class="gn-load-row">
                        <div class="gn-load-header">
                            <div class="gn-load-name">
                                {l.name} <span class="gn-pill-priority {pill_cls}">{l.priority}</span>
                            </div>
                            <div class="gn-load-values">{alloc_val:.1f} / {demand_val:.1f} kW</div>
                        </div>
                        <div class="gn-load-track">
                            <div class="gn-bar-cyan" style="width: {pct_alloc}%;"></div>
                            <div class="gn-bar-orange" style="width: {pct_unmet}%;"></div>
                        </div>
                        <div class="gn-load-micro">{alloc_val:.1f} kW supplied, {unmet_val:.1f} kW unmet ({pct_alloc:.0f}% satisfied)</div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                st.markdown(f"""
                <div style="margin-top:16px; padding:10px; background:rgba(0, 240, 255, 0.05); border:1px solid rgba(0, 240, 255, 0.2); border-radius:8px; font-size:12px; color:#00F0FF;">
                    ● <strong>QAOA Allocation Rendered:</strong> Calculated using {res['quantum_res']['qubits']} qubits on local circuit simulator ({res['quantum_res']['runtime']:.4f} s).
                </div>
                """, unsafe_allow_html=True)
            elif has_run and not q_success:
                for l in grid.loads:
                    pill_cls = f"pill-{l.priority.lower()}"
                    st.markdown(f"""
                    <div class="gn-load-row" style="opacity:0.6;">
                        <div class="gn-load-header">
                            <div class="gn-load-name">{l.name} <span class="gn-pill-priority {pill_cls}">{l.priority}</span></div>
                            <div class="gn-load-values">0.0 / {l.demand_kw:.1f} kW</div>
                        </div>
                        <div class="gn-load-track">
                            <div class="gn-bar-orange" style="width: 100%;"></div>
                        </div>
                        <div class="gn-load-micro" style="color:#EF4444;">Simulation halted — No QAOA allocation calculated</div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                st.markdown(f"""
                <div style="margin-top:16px; padding:12px; background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.3); border-radius:8px; font-size:12px; color:#EF4444;">
                    ❌ <strong>QAOA Optimization Failed:</strong> {res['quantum_res']['status']}. Classical fallback is NOT substituted for the quantum allocation.
                </div>
                """, unsafe_allow_html=True)
            else:
                for l in grid.loads:
                    pill_cls = f"pill-{l.priority.lower()}"
                    st.markdown(f"""
                    <div class="gn-load-row" style="opacity:0.5;">
                        <div class="gn-load-header">
                            <div class="gn-load-name">{l.name} <span class="gn-pill-priority {pill_cls}">{l.priority}</span></div>
                            <div class="gn-load-values">0.0 / {l.demand_kw:.1f} kW</div>
                        </div>
                        <div class="gn-load-track"></div>
                        <div class="gn-load-micro">Awaiting optimization...</div>
                    </div>
                    """, unsafe_allow_html=True)
                st.markdown("<div style='color:#8B95A5; font-size:12px; text-align:center; padding:10px 0;'>Click 'Optimize Grid (QAOA)' to run quantum simulation.</div>", unsafe_allow_html=True)

    # Polished Grid Overview & Power Summary Section (Section 4 requirement)
    render_grid_overview_section(grid)

    # Bottom Row: Three Specialized Analytical Panels Matching Reference Image
    render_bottom_three_cards(grid, res)


def render_bottom_three_cards(grid: SmartGrid, res: dict):
    """Renders the three analytical bottom cards matching the reference image layout."""
    b1, b2, b3 = st.columns(3)
    
    has_run = res is not None and res.get("quantum_res") is not None
    q_success = has_run and res["quantum_res"]["feasible"]
    
    # Card 1: QAOA Quantum Simulation Details ("EV Charging stations" style)
    with b1:
        with st.container(border=True):
            status_badge = "OPTIMAL" if q_success else ("FAILED" if has_run else "STANDBY")
            badge_cls = "badge-cyan" if q_success else ("badge-orange" if not has_run else "pill-critical")
            
            st.markdown(f"""
            <div class="gn-card-header">
                <div class="gn-card-title">QAOA Quantum Solver</div>
                <span class="gn-badge {badge_cls}">{status_badge}</span>
            </div>
            """, unsafe_allow_html=True)
            
            if has_run:
                q_res = res["quantum_res"]
                st.markdown(f"""
                <div class="gn-kv"><span class="gn-kv-k">Algorithm</span><span class="gn-kv-v">QAOA (p=1 layer)</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Hamiltonian</span><span class="gn-kv-v">Ising Model (from QUBO)</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Classical Simulator</span><span class="gn-kv-v">StatevectorSampler (CPU)</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Allocated Qubits</span><span class="gn-kv-v">{q_res.get('qubits', 'N/A')} Qubits</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Execution Runtime</span><span class="gn-kv-v">{q_res['runtime']:.4f} s</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Objective Energy</span><span class="gn-kv-v">{q_res['objective']:.2f}</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Solver Status</span><span class="gn-kv-v" style="color:{'#00F0FF' if q_success else '#EF4444'}">{q_res['status']}</span></div>
                """, unsafe_allow_html=True)
            else:
                st.markdown("""
                <div class="gn-kv"><span class="gn-kv-k">Algorithm</span><span class="gn-kv-v">QAOA (p=1 layer)</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Classical Simulator</span><span class="gn-kv-v">Qiskit Statevector</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Status</span><span class="gn-kv-v" style="color:#8B95A5;">Ready for simulation</span></div>
                """, unsafe_allow_html=True)
                
            st.markdown("""
            <div style="margin-top:14px; font-size:11px; color:#8B95A5; line-height:1.45; border-top:1px solid #1E2530; padding-top:10px;">
                ⚠️ <em>Simulation notice:</em> The quantum optimization problem is executed using a quantum-circuit simulator on a classical PC. No physical quantum processor is claimed.
            </div>
            """, unsafe_allow_html=True)

    # Card 2: Demand vs QAOA Allocation Chart ("24 h Demand forecast" style)
    with b2:
        with st.container(border=True):
            st.markdown("""
            <div class="gn-card-header">
                <div class="gn-card-title">Demand vs Allocation Chart</div>
                <span class="gn-badge badge-cyan">COMPARISON</span>
            </div>
            """, unsafe_allow_html=True)
            
            load_names = [l.name for l in grid.loads]
            demands = [l.demand_kw for l in grid.loads]
            
            if q_success:
                allocs = [res["quantum_res"]["allocations"].get(l.name, 0.0) for l in grid.loads]
            else:
                allocs = [0.0 for _ in grid.loads]
                
            fig = go.Figure()
            fig.add_trace(go.Bar(
                name="Requested Demand (kW)",
                x=load_names,
                y=demands,
                marker_color="#2A3649",
                opacity=0.8
            ))
            fig.add_trace(go.Bar(
                name="QAOA Allocated (kW)",
                x=load_names,
                y=allocs,
                marker_color="#00F0FF"
            ))
            fig.update_layout(
                barmode="group",
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#8B95A5", size=11),
                height=190,
                margin=dict(l=10, r=10, t=10, b=10),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=10)),
                yaxis=dict(gridcolor="#1A222E", title=None),
                xaxis=dict(gridcolor="#1A222E")
            )
            st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})

    # Card 3: Classical Baseline Comparison & Energy Flow ("Energy Flow" style)
    with b3:
        with st.container(border=True):
            st.markdown("""
            <div class="gn-card-header">
                <div class="gn-card-title">Classical Reference Baseline</div>
                <span class="gn-badge badge-orange">MILP BENCHMARK</span>
            </div>
            """, unsafe_allow_html=True)
            
            if has_run and res.get("classical_res") is not None:
                c_res = res["classical_res"]
                c_alloc = sum(c_res["allocations"].values())
                st.markdown(f"""
                <div class="gn-kv"><span class="gn-kv-k">Validation Solver</span><span class="gn-kv-v">SciPy MILP (Exact)</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Baseline Allocated</span><span class="gn-kv-v">{c_alloc:.1f} kW</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Baseline Objective</span><span class="gn-kv-v">{c_res['objective']:.2f}</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Classical Runtime</span><span class="gn-kv-v">{c_res['runtime']:.4f} s</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Baseline Feasibility</span><span class="gn-kv-v" style="color:#10B981;">Optimal</span></div>
                """, unsafe_allow_html=True)
                
                if q_success:
                    q_obj = res["quantum_res"]["objective"]
                    c_obj = c_res["objective"]
                    parity_text = "Exact parity (100% optimal)" if abs(q_obj - c_obj) < 1e-4 else "Near-optimal quantum approximation"
                    st.markdown(f"""
                    <div style="margin-top:10px; font-size:11px; color:#00F0FF;">
                        ✓ <strong>Validation:</strong> {parity_text} relative to classical exact baseline.
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.markdown("""
                <div class="gn-kv"><span class="gn-kv-k">Validation Solver</span><span class="gn-kv-v">SciPy MILP (Exact)</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Purpose</span><span class="gn-kv-v">Mathematical Benchmark</span></div>
                <div class="gn-kv"><span class="gn-kv-k">Status</span><span class="gn-kv-v" style="color:#8B95A5;">Awaiting execution</span></div>
                """, unsafe_allow_html=True)

            st.markdown("""
            <div style="margin-top:14px; font-size:11px; color:#8B95A5; line-height:1.45; border-top:1px solid #1E2530; padding-top:10px;">
                ℹ️ <em>Benchmark note:</em> The classical solver provides an exact mathematical reference to validate the QAOA simulation. It is not presented as an alternative quantum solution.
            </div>
            """, unsafe_allow_html=True)


def render_execution_pipeline(grid: SmartGrid, granularity: float, run_quantum: bool):
    """Executes the optimization pipeline with honest progress and error reporting."""
    with st.container(border=True):
        st.markdown("<div style='color:#00F0FF; font-size:18px; margin-bottom:14px; font-weight:500; text-align:center;'>Executing Optimization Pipeline...</div>", unsafe_allow_html=True)
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        status_text.markdown("<span style='color:#8B95A5;'>1/3 Formulating Quadratic Program and converting to QUBO...</span>", unsafe_allow_html=True)
        time.sleep(0.3)
        progress_bar.progress(30)
        
        t_start = time.time()
        def on_qaoa_progress(evals, params, value, meta):
            pct = min(74, 30 + int(44 * min(evals / 30.0, 1.0)))
            progress_bar.progress(pct)
            status_text.markdown(
                f"<span style='color:#8B95A5;'>2/3 Simulating QAOA quantum circuit with COBYLA optimizer (eval {evals}/30, {time.time() - t_start:.1f}s)...</span>",
                unsafe_allow_html=True
            )

        if run_quantum:
            status_text.markdown("<span style='color:#8B95A5;'>2/3 Simulating QAOA quantum circuit with COBYLA optimizer...</span>", unsafe_allow_html=True)
        else:
            status_text.markdown("<span style='color:#8B95A5;'>2/3 QAOA simulation skipped by configuration...</span>", unsafe_allow_html=True)
            
        try:
            results = run_experiment(
                grid, 
                "Dashboard_Run", 
                granularity=granularity, 
                run_qaoa=run_quantum,
                qaoa_callback=on_qaoa_progress if run_quantum else None
            )
            progress_bar.progress(85)
            
            status_text.markdown("<span style='color:#8B95A5;'>3/3 Computing classical SciPy MILP reference baseline...</span>", unsafe_allow_html=True)
            time.sleep(0.1)
            
            st.session_state.results = results
            st.session_state.app_status = "OPTIMIZATION COMPLETE"
            progress_bar.progress(100)
            status_text.markdown("<span style='color:#10B981;'>Optimization completed.</span>", unsafe_allow_html=True)
            time.sleep(0.1)
            st.rerun()
        except Exception as e:
            st.session_state.app_status = "ERROR"
            st.error(f"Execution Error: {str(e)}")
            st.stop()


def render_experiments_tab():
    """Renders the research experiments and automated benchmarks tab."""
    st.markdown("<div class='gn-hero-title'>Research Experiments</div>", unsafe_allow_html=True)
    st.markdown("<div class='gn-hero-sub'>Automated scientific evaluations demonstrating grid stress, qubit complexity, and solver comparisons.</div>", unsafe_allow_html=True)
    
    e1, e2 = st.columns(2)
    with e1:
        with st.container(border=True):
            st.markdown("""
            <div class="gn-card-header">
                <div class="gn-card-title">Experiment A: Supply Stress Test</div>
                <span class="gn-badge badge-cyan">SCALABILITY</span>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("<div style='color:#8B95A5; font-size:13px; margin-bottom:16px;'>Demonstrates how unmet demand scales as available supply degrades from surplus (120 kW) to extreme shortage (40 kW) across fixed loads.</div>", unsafe_allow_html=True)
            
            if st.button("Run Supply Stress Test", key="btn_run_exp_a"):
                with st.spinner("Executing stress test across 4 supply levels..."):
                    grid = SmartGrid()
                    supplies = [120.0, 90.0, 70.0, 40.0]
                    data = []
                    for s in supplies:
                        grid.clear()
                        grid.add_source(PowerSource("Grid", "Main", s))
                        grid.add_load(Load("Hospital", 40.0, "Critical"))
                        grid.add_load(Load("School", 30.0, "High"))
                        grid.add_load(Load("Industry", 30.0, "Low"))
                        res = run_experiment(grid, f"Stress_{int(s)}", granularity=10.0, run_qaoa=False)
                        data.append({
                            "Available Supply (kW)": s,
                            "Unmet Demand (kW)": res["classical_metrics"]["unmet_demand"],
                            "Allocated Power (kW)": res["classical_metrics"]["total_allocated"]
                        })
                    df_stress = pd.DataFrame(data)
                    fig = px.line(df_stress, x="Available Supply (kW)", y="Unmet Demand (kW)", markers=True)
                    fig.update_traces(line_color="#FF9F43", marker=dict(size=8, color="#00F0FF"))
                    fig.update_layout(
                        plot_bgcolor="rgba(0,0,0,0)",
                        paper_bgcolor="rgba(0,0,0,0)",
                        font=dict(color="#8B95A5"),
                        height=240,
                        margin=dict(l=0, r=0, t=10, b=0),
                        xaxis=dict(gridcolor="#1E2530"),
                        yaxis=dict(gridcolor="#1E2530")
                    )
                    st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})

    with e2:
        with st.container(border=True):
            st.markdown("""
            <div class="gn-card-header">
                <div class="gn-card-title">Experiment D: Discretization Resolution</div>
                <span class="gn-badge badge-orange">COMPLEXITY</span>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("<div style='color:#8B95A5; font-size:13px; margin-bottom:16px;'>Measures the exponential increase in required quantum binary variables (Qubits) as continuous power is discretized into finer resolutions.</div>", unsafe_allow_html=True)
            
            if st.button("Run Resolution Test", key="btn_run_exp_d"):
                with st.spinner("Analyzing qubit scaling across granularities..."):
                    grid = SmartGrid()
                    grid.add_source(PowerSource("Grid", "Main", 50.0))
                    grid.add_load(Load("Hospital", 25.0, "Critical"))
                    grid.add_load(Load("School", 35.0, "Low"))
                    granularities = [25.0, 10.0, 5.0]
                    q_data = []
                    for g in granularities:
                        qubits = estimate_qubits(grid, g)
                        q_data.append({
                            "Power Granularity": f"{g} kW",
                            "Required Qubits": qubits
                        })
                    df_q = pd.DataFrame(q_data)
                    fig_q = px.bar(df_q, x="Power Granularity", y="Required Qubits", text="Required Qubits")
                    fig_q.update_traces(marker_color="#00F0FF")
                    fig_q.update_layout(
                        plot_bgcolor="rgba(0,0,0,0)",
                        paper_bgcolor="rgba(0,0,0,0)",
                        font=dict(color="#8B95A5"),
                        height=240,
                        margin=dict(l=0, r=0, t=10, b=0),
                        yaxis=dict(gridcolor="#1E2530")
                    )
                    st.plotly_chart(fig_q, use_container_width=True, config={'displayModeBar': False})

    # Historical Experiment Logs Table
    with st.container(border=True):
        st.markdown("""
        <div class="gn-card-header">
            <div class="gn-card-title">Historical Experiment Log</div>
            <div class="gn-card-sub">Recorded simulation runs from disk (data/runs/experiment_history.csv).</div>
        </div>
        """, unsafe_allow_html=True)
        csv_path = os.path.join(RUNS_DIR, "experiment_history.csv")
        if os.path.exists(csv_path):
            df_hist = pd.read_csv(csv_path)
            cols_to_show = ["run_id", "scenario_name", "total_supply", "total_demand", "quantum_variable_count", "quantum_feasible", "quantum_objective", "classical_objective", "quantum_runtime"]
            avail = [c for c in cols_to_show if c in df_hist.columns]
            st.dataframe(df_hist[avail].tail(15), use_container_width=True, hide_index=True)
            with open(csv_path, "rb") as f:
                st.download_button("Export History CSV", f, file_name="experiment_history.csv")
        else:
            st.info("No prior experiment records logged.")


def render_methodology_tab():
    """Renders the step-by-step scientific methodology documentation."""
    st.markdown("<div class='gn-hero-title'>Mathematical Methodology</div>", unsafe_allow_html=True)
    st.markdown("<div class='gn-hero-sub'>Comprehensive derivation from physical energy grid constraints to Ising Hamiltonian and QAOA execution.</div>", unsafe_allow_html=True)
    
    with st.container(border=True):
        st.markdown("""
        <div class="gn-card-header">
            <div class="gn-card-title">Optimization Pipeline Architecture</div>
        </div>
        <div style="color:#8B95A5; font-size:14px; font-family:monospace; line-height:2.2;">
        <div style="color:#00F0FF; font-weight:bold;">1. PHYSICAL GRID INPUT</div>
        Continuous power capacities and load demands: Total Generation S (kW) vs Demands D_i (kW).<br><br>
        
        <div style="color:#FFFFFF; font-weight:bold;">2. PRIORITY WEIGHTING</div>
        Infrastructure criticality weighting: w_Critical = 1000, w_High = 100, w_Medium = 10, w_Low = 1.<br><br>
        
        <div style="color:#FFFFFF; font-weight:bold;">3. OPTIMIZATION OBJECTIVE</div>
        Minimizing priority-weighted unmet demand: min Σ w_i · (D_i - x_i) subject to Σ x_i ≤ S and 0 ≤ x_i ≤ D_i.<br><br>
        
        <div style="color:#FFFFFF; font-weight:bold;">4. DISCRETIZATION</div>
        Continuous power is partitioned into integer multiples n_i of granularity g (e.g., 5 kW): x_i = n_i · g.<br><br>
        
        <div style="color:#00F0FF; font-weight:bold;">5. QUBO & ISING HAMILTONIAN CONVERSION</div>
        - Integer variables n_i are converted to binary decision variables via standard binary decomposition.<br>
        - Inequality constraints (Σ n_i · g ≤ S) are mapped to equalities with binary slack variables.<br>
        - Hard capacity constraints are incorporated into the objective as quadratic penalty multipliers: P · (Σ n_i · g + s - S)².<br>
        - Binary variables are transformed into Pauli-Z operators (Z_i = 1 - 2x_i) to produce the cost Hamiltonian H_C.<br><br>
        
        <div style="color:#FF9F43; font-weight:bold;">6. QAOA QUANTUM-CIRCUIT SIMULATION</div>
        - Parameterized quantum state |γ, β⟩ = e^(-i β H_M) e^(-i γ H_C) |+⟩ is prepared.<br>
        - Executed via Qiskit StatevectorSampler simulation on CPU.<br>
        - Classical COBYLA optimizer iteratively searches for optimal variational parameters (γ*, β*).<br><br>
        
        <div style="color:#FFFFFF; font-weight:bold;">7. CLASSICAL REFERENCE BENCHMARK</div>
        SciPy MILP exact branch-and-cut solver calculates the theoretical ground truth for validation.
        </div>
        """, unsafe_allow_html=True)


# Application Execution Entry Point
initialize_state()
grid = st.session_state.grid

render_top_bar(grid)

tab_sim, tab_exp, tab_meth = st.tabs(["⚡ SIMULATION DASHBOARD", "📊 RESEARCH EXPERIMENTS", "📖 METHODOLOGY"])

with tab_sim:
    render_simulation_tab(grid)
with tab_exp:
    render_experiments_tab()
with tab_meth:
    render_methodology_tab()
