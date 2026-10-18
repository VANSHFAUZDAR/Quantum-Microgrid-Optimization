# ⚡ Quantum Computing Optimization Engine & 3D Microgrid Digital Twin

An integrated research prototype and interactive digital twin demonstrating **Quantum Computing Optimization (QAOA & QUBO)** applied to smart microgrid energy distribution.

---

## 🌟 Key Components

### 1. 🌐 3D Isometric Microgrid Digital Twin (`http://localhost:8080`)
- Built with **Three.js** and WebGL post-processing (UnrealBloom, Volumetric Sunrays).
- Procedural Web Audio sound effects.
- Full 360° orbital navigation and precision smart zoom.
- Dynamic Day/Night lighting and theming cycle.
- Interactive Qubit node addition and parameter inspection (Hospital, School, Commercial, Residential, Data Center, EV Hub, Water Treatment).
- Visual power lines with photon particle flow reacting dynamically to grid power allocation.

### 2. ⚛️ Quantum Optimization Dashboard (`http://localhost:8501`)
- Built with **Qiskit** and **Streamlit**.
- Formulates microgrid energy routing as a **Quadratic Unconstrained Binary Optimization (QUBO)** problem.
- Solves energy dispatch using **QAOA (Quantum Approximate Optimization Algorithm)** and compares directly against classical reference solvers (COBYLA, SLSQP).
- Real-time power balance telemetry, priority-weighted deficit minimization, and quantum circuit diagnostics.

---

## 🚀 Quick Start

### One-Click Launch (All Systems)

#### Windows Batch Launcher:
Double-click:
```bash
launch_all.bat
```

#### Or via Python:
```bash
python launch_all.py
```
This automatically launches:
- **3D Microgrid Digital Twin** on `http://localhost:8080`
- **Streamlit Quantum Dashboard** on `http://localhost:8501`

---

## 📁 Repository Structure

```text
├── microgrid_3d/                 # 3D Three.js WebGL digital twin assets & code
│   ├── index.html                # 3D canvas viewport & UI overlay
│   ├── app.js                    # Three.js scene, camera, lights, simulation logic
│   ├── styles.css                # Glassmorphism styling and themes
│   ├── godrays.js                # Custom volumetric sunray shaders
│   ├── audio.js                  # Procedural Web Audio synthesis
│   └── libs/                     # Local Three.js and postprocessing libraries
├── QuantumV1-main/               # Qiskit quantum optimization engine & dashboard
│   ├── app.py                    # Streamlit interactive application
│   ├── requirements.txt          # Python dependencies
│   ├── diagnose.py               # Quantum solver diagnostic script
│   ├── dispatch_app.py           # Time-based multi-period dispatch dashboard
│   └── quantum_energy_optimizer/ # Core mathematical QUBO, QAOA, and classical solvers
├── launch_all.py                 # Dual launcher script
├── launch_all.bat                # Windows batch launcher
├── run_visualizer.py             # Standalone 3D visualizer server launcher
└── README.md                     # Project documentation
```

---

## 🛠️ Requirements & Installation

1. **Python 3.10 - 3.14**
2. Install dependencies:
   ```bash
   cd QuantumV1-main
   pip install -r requirements.txt
   ```
3. A modern web browser supporting WebGL (Chrome, Edge, Firefox, Brave).
