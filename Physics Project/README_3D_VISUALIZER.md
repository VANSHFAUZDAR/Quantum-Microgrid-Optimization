# ⚛️ Quantum Computing Optimization Engine — 3D Isometric Microgrid Digital Twin

An interactive, high-tech, multi-themed 3D environment representing a **Quantum Computing Optimization Engine** for a rural microgrid. Powered by **Three.js**, custom WebGL post-processing shaders (UnrealBloom, Volumetric Sunrays/God Rays), procedural Web Audio synthesis, full 360° orbital navigation, precision smart zoom, and dynamic Qubit infrastructure customization.

---

## 🚀 Quick Start Guide

### Option 1: Python Launcher (Recommended)
From the project root directory, run:
```bash
python run_visualizer.py
```
This automatically starts a local server at `http://localhost:8080` and opens your default web browser.

### Option 2: Windows Batch File
Double-click `run_microgrid_3d.bat` in the project folder.

### Option 3: Direct Browser Launch
Open `microgrid_3d/index.html` or the root `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Brave). All Three.js libraries are locally bundled in `microgrid_3d/libs/` with CDN fallback for 100% offline support.

---

## 🎮 Key Features & Upgrades

### 1. 🔄 Full 360-Degree Navigation & Precision Smart Zoom
- **Full 360° Orbit Controls**: Click and drag anywhere to smoothly rotate around the entire microgrid model city in 3D space with zero angular lock. Pitch down to eye-level or up to overhead view.
- **Smart Precision Zoom**: 
  - When hovering your cursor over any specific qubit (Hospital, School, Commercial, Residential, or custom added nodes) and scrolling the mouse wheel or pinching the trackpad, the camera **smoothly and precisely glides its orbit center directly onto that exact qubit**, zooming right into the facility!
  - When scrolling out from a close-up, the camera gently centers back onto the whole microgrid landscape.

### 2. ☀️/🌙 Dynamic UI Theming (Cinematic Day/Night Cycle)
- **Daytime State (Light Theme)**:
  - Toggling to **Day Mode** triggers the cinematic sunrise animation (golden sun rising over the isometric horizon with dynamic volumetric sunrays/god rays sweeping across the city).
  - *Simultaneously*, the entire UI transitions to a clean, high-visibility **Light Theme** (frosted white glassmorphic panels, deep dark slate typography, clean light-mode cards and telemetry chips).
  - **High-Visibility Daylight Power Lines**: The glowing power lines automatically adapt their saturation, opacity, and contrast tones (electric crimson, vibrant amber, deep cobalt blue) so they pop boldly against the bright daylight ground and sky.
- **Nighttime State (Dark Theme)**:
  - Toggling to **Night Mode** triggers the sunset and moonrise, casting warm orange and purple hues before falling into deep obsidian night with 1,400 twinkling stars.
  - The UI seamlessly transitions back to the sleek, neon-glowing **Dark Mode** aesthetic with cyber cyan, orange, and red neon accents.

### 3. 🛠️ Qubit Customization & Dynamic Node Addition
- **`+ Add Qubit` Button**:
  - Located in both the top navigation bar and bottom dock.
  - Click to deploy a new infrastructure node into the microgrid environment.
  - Choose from facility archetypes:
    - 🏭 **Industrial Smart Factory** (25.0 kW | High Priority | 07:00–17:00)
    - 💻 **Quantum AI Data Center** (35.0 kW | High Priority | 24/7)
    - ⚡ **EV Fast-Charging Hub** (25.0 kW | Medium Priority | 06:00–22:00)
    - 💧 **Water Purification Plant** (18.0 kW | Very High Priority | 24/7)
    - 🛠️ **Custom Node** (User-specified parameters)
  - Automatically drops a detailed 3D building model onto an open island slot, wires a glowing neon power line from the central hub (with micro-pylons and flowing photon particles), registers a new Qubit ($Q_4, Q_5\dots$), and re-optimizes power routing!
- **Click-to-Edit (All Qubits)**:
  - Click on **any qubit node** in the 3D scene (Hospital, School, Commercial, Houses, or any custom added node) to open the **Qubit Configuration / Inspector Modal**.
  - **Editable Parameters**:
    - **Facility Name & Label**
    - **Priority Level (Qubit Weight)**: Very High (100), High (50), Medium (30), Low (10)
    - **Required Power (kW)**: Interactive range slider + precise number input
    - **Working Hours**: Text input (e.g., `08:00 - 16:00` or `24/7`) + quick preset chips (`24/7 Continuous`, `Day: 08:00–16:00`, `Night: 19:00–05:00`, `Evening Peak: 17:00–23:00`)
    - Option to remove/delete custom nodes.
  - **Dynamic Backend Logic & Visual Power Line Response**:
    - Changing required power dynamically scales the power line's thickness, glow aura, and photon flow speed in real-time!
    - Changing working hours evaluates the node's curfew state against current Day vs Night mode:
      - If working hours end, the line automatically dims to dark cinder and diverts power to higher-priority active infrastructure!
      - If set to `24/7`, power lines remain energized around the clock!
    - Power balance gauges (Generation vs Demand, battery flow, satisfaction %) and the Quantum Register HUD update instantaneously.

### 4. ⚛️ Centerpiece: Microgrid Control Center
- Click the central building to trigger an expanding 3D holographic quantum shockwave ripple, play a resonant chime, and launch the external Python/Qiskit simulation dashboard (`http://localhost:8501`), with a fallback/config modal.

---

## 🗺️ Microgrid Infrastructure Map

| Asset | Type / Qubit | Default Demand | Operating Timing | Power Line Color |
| :--- | :--- | :--- | :--- | :--- |
| **Microgrid Control Center** | Central QPU Hub | Master Dispatcher | 24/7 Coherent | Cyan Conduits |
| **Hospital** | Qubit 0 (Life-Critical) | 30.0 kW | 24/7 Continuous | Glowing **RED** |
| **School** | Qubit 1 (Education) | 20.0 kW | 08:00 - 15:00 | Glowing **ORANGE** |
| **Commercial Complex** | Qubit 2 (Commercial) | 15.0 kW | 09:00 - 21:00 | Glowing **CYAN/BLUE** |
| **Residential Village** | Qubit 3 (Residential) | 10.0 kW | 17:00 - 23:00 | Glowing **CYAN/BLUE** |
| **Wind Turbine** | Generation Resource | 15–20 kW Output | 24/7 Variable | Electric Green Inflow |
| **PV Solar Farm** | Generation Resource | 35 kW Peak (Day) | Daylight (06:00–18:00) | Amber Inflow |
| **Hydro Generator** | Generation Resource | 25 kW Continuous | 24/7 Base Load | Sky Blue Inflow |
| **Battery Storage (BESS)** | Grid Storage | 120 kWh Capacity | Day: +15kW | Night: -25kW | Green/Amber Busway |

---

## 🔗 Integrated Python / Qiskit Workflow

- The 3D digital twin is configured to communicate with `http://localhost:8501` (the Streamlit dashboard in `QuantumV1-main`).
- In `QuantumV1-main/app.py`, a **"🌐 3D Digital Twin"** button links back to `http://localhost:8080`.
- To run both simultaneously:
  1. Terminal 1: `python run_visualizer.py` (3D Environment on `:8080`)
  2. Terminal 2: `cd QuantumV1-main && streamlit run app.py` (Qiskit Dashboard on `:8501`)
