@echo off
title Quantum Computing Optimization Engine - Dual System Launcher
echo ======================================================================
echo    QUANTUM COMPUTING OPTIMIZATION ENGINE - DUAL SYSTEM LAUNCHER
echo ======================================================================
echo.
echo [1/2] Launching 3D Isometric Microgrid Digital Twin on http://localhost:8080...
start "3D Microgrid Visualizer (Port 8080)" cmd /k "python run_visualizer.py"

echo.
echo [2/2] Launching Streamlit Quantum Optimization Dashboard on http://localhost:8501...
cd /d "%~dp0QuantumV1-main"
if exist ".venv314\Scripts\python.exe" (
    start "Quantum Streamlit Dashboard (Port 8501)" cmd /k ".venv314\Scripts\python.exe -m streamlit run app.py"
) else if exist ".venv\Scripts\python.exe" (
    start "Quantum Streamlit Dashboard (Port 8501)" cmd /k ".venv\Scripts\python.exe -m streamlit run app.py"
) else (
    start "Quantum Streamlit Dashboard (Port 8501)" cmd /k "streamlit run app.py"
)

echo.
echo ======================================================================
echo  Both systems are starting up!
echo   - 3D Digital Twin:       http://localhost:8080
echo   - Quantum Dashboard:     http://localhost:8501
echo.
echo  Tip: Double-clicking the Central Hub in the 3D twin will open the
echo       Quantum Dashboard directly in your browser.
echo ======================================================================
pause
