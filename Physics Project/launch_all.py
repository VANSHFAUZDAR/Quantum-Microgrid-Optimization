"""
Quantum Computing Optimization Engine - Dual System Launcher
Launches both:
  1. 3D Isometric Microgrid Digital Twin (http://localhost:8080)
  2. Streamlit / Qiskit Quantum Optimization Dashboard (http://localhost:8501)
"""

import os
import sys
import subprocess
import time

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
QUANTUM_DIR = os.path.join(PROJECT_ROOT, "QuantumV1-main")

def get_streamlit_command():
    venv314_py = os.path.join(QUANTUM_DIR, ".venv314", "Scripts", "python.exe")
    if os.path.exists(venv314_py):
        return [venv314_py, "-m", "streamlit"]
    venv_py = os.path.join(QUANTUM_DIR, ".venv", "Scripts", "python.exe")
    if os.path.exists(venv_py):
        return [venv_py, "-m", "streamlit"]
    return [sys.executable, "-m", "streamlit"]

def main():
    print("=" * 70)
    print("⚡ LAUNCHING QUANTUM MICROGRID & OPTIMIZATION ENGINE")
    print("=" * 70)

    # 1. Start 3D Visualizer
    print("\n[1/2] Starting 3D Digital Twin server (Port 8080)...")
    vis_script = os.path.join(PROJECT_ROOT, "run_visualizer.py")
    vis_proc = subprocess.Popen([sys.executable, vis_script], cwd=PROJECT_ROOT)

    # 2. Start Streamlit Quantum Dashboard
    print("[2/2] Starting Quantum Optimization Dashboard (Port 8501)...")
    st_cmd = get_streamlit_command()
    app_script = os.path.join(QUANTUM_DIR, "app.py")
    st_proc = subprocess.Popen(st_cmd + ["run", app_script], cwd=QUANTUM_DIR)

    print("\n" + "=" * 70)
    print("✅ BOTH SYSTEMS RUNNING:")
    print("   🌐 3D Digital Twin:       http://localhost:8080")
    print("   ⚛️  Quantum Dashboard:     http://localhost:8501")
    print("=" * 70)
    print("Press Ctrl+C in this terminal to terminate both servers.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping all services...")
        try:
            vis_proc.terminate()
        except Exception:
            pass
        try:
            st_proc.terminate()
        except Exception:
            pass
        print("All servers stopped.")

if __name__ == "__main__":
    main()
