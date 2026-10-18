QuantumV1 Time-Aware Dispatch Add-on
===================================

What this adds
--------------
1. quantum_energy_optimizer/time_dispatch.py
   A classical 24-hour linear-programming dispatch model that includes:
   - time-varying solar availability and electricity price
   - hourly energy balance and grid import limit
   - battery charging/discharging, efficiency, state of charge and power limits
   - a flexible factory energy requirement schedulable during a permitted window
   - differentiated penalties for unmet critical, residential and commercial loads
   - operating cost, unmet energy, solar utilization, estimated emissions and schedule outputs

2. dispatch_app.py
   A separate Streamlit dashboard to test and inspect the dispatch optimizer. It does NOT alter app.py,
   the existing snapshot classical optimizer, or the existing QAOA model.

Install / run in Windows PowerShell
-----------------------------------
From D:\WebDev\QuantumV1, extract the ZIP so that the folder structure merges into the project.
Then run:

    python -m streamlit run dispatch_app.py

If the terminal does not have the project's virtual environment activated:

    .\.venv\Scripts\Activate.ps1
    python -m streamlit run dispatch_app.py

This uses the project's existing SciPy, pandas and Streamlit dependencies. If one is missing:

    python -m pip install scipy pandas streamlit

Notes
-----
- This is a classical baseline, not a quantum speedup claim.
- The original app.py remains unchanged. Once the new model is tested, it can be integrated into the main UI.
- Inputs are illustrative sample data; replace with validated forecasts, real tariffs and engineering limits before
  drawing conclusions about an actual power system.
- The factory energy requirement must fit inside its available operating window. If not, the optimizer reports
  infeasibility rather than quietly dropping that requirement.
