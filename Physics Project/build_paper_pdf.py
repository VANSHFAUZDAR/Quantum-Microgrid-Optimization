import os
import re
import base64
import subprocess
import markdown

PROJECT_DIR = r"c:\Users\vfauz\OneDrive\Desktop\Physics Project"
MD_PATH = os.path.join(PROJECT_DIR, "RESEARCH_PAPER.md")
HTML_PATH = os.path.join(PROJECT_DIR, "research_paper_render.html")
PDF_PATH = os.path.join(PROJECT_DIR, "research_paper.pdf")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def image_to_base64(img_path):
    with open(img_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def main():
    print(f"Reading markdown from: {MD_PATH}")
    with open(MD_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace local figures with embedded base64 data URIs
    fig_map = {
        "figures/fig_twin_3d_night.png": os.path.join(PROJECT_DIR, "figures", "fig_twin_3d_night.png"),
        "figures/fig_dashboard_config.png": os.path.join(PROJECT_DIR, "figures", "fig_dashboard_config.png"),
        "figures/fig_dashboard_kpis.png": os.path.join(PROJECT_DIR, "figures", "fig_dashboard_kpis.png"),
    }

    for rel_path, abs_path in fig_map.items():
        if os.path.exists(abs_path):
            b64_data = image_to_base64(abs_path)
            content = content.replace(f"({rel_path})", f"(data:image/png;base64,{b64_data})")
            print(f"Embedded image: {rel_path} ({len(b64_data)} bytes base64)")
        else:
            print(f"WARNING: Image not found: {abs_path}")

    # Remove mermaid diagram code blocks and replace with a clean schematic card
    mermaid_pattern = re.compile(r'```mermaid[\s\S]*?```', re.MULTILINE)
    mermaid_replacement = """
<div class="architecture-diagram">
  <div class="arch-box box-twin">
    <strong>Module 1: 3D Spatial Digital Twin</strong><br>
    <small>Three.js / WebGL @ 60 FPS (Port 8080)<br>• Catmull-Rom Power Splines<br>• Volumetric God-Rays & Shaders<br>• 5-Phase Energy Animation Sequence</small>
  </div>
  <div class="arch-bus">
    <strong>⇄ Bidirectional REST / Telemetry Bus ⇄</strong><br>
    <small>JSON State Payloads (Δt ≤ 16.7 ms)<br>Topological State S<sub>grid</sub> → Feeder Vector b*</small>
  </div>
  <div class="arch-box box-dash">
    <strong>Module 2: Analytical Quantum Dashboard</strong><br>
    <small>Streamlit / Qiskit Aer / HiGHS (Port 8501)<br>• QUBO Dyadic Slack Builder<br>• QAOA Variational Execution (p=1..5)<br>• Candidate Pool & Register Audit (f² ≥ 10⁻⁶)</small>
  </div>
</div>
"""
    content = mermaid_pattern.sub(mermaid_replacement, content)

    # Convert Markdown to HTML
    md = markdown.Markdown(
        extensions=[
            'extra',
            'tables',
            'fenced_code',
            'codehilite',
            'toc',
            'sane_lists'
        ]
    )
    body_html = md.convert(content)

    # Wrap in academic layout HTML template
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quantum-Classical Microgrid Optimization and 3D Digital Twin</title>

<!-- KaTeX for high-performance math rendering -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {{
        delimiters: [
            {{left: '$$', right: '$$', display: true}},
            {{left: '$', right: '$', display: false}},
            {{left: '\\\\[', right: '\\\\]', display: true}},
            {{left: '\\\\(', right: '\\\\)', display: false}}
        ],
        throwOnError: false
    }});"></script>

<style>
  @page {{
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
    @bottom-center {{
      content: counter(page);
      font-size: 10pt;
      font-family: 'Latin Modern Roman', 'Times New Roman', serif;
    }}
  }}

  body {{
    font-family: 'Latin Modern Roman', 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.52;
    color: #111111;
    background: #FFFFFF;
    margin: 0;
    padding: 0;
    text-align: justify;
    text-justify: inter-word;
  }}

  /* Paper Header */
  .paper-header {{
    text-align: center;
    margin-bottom: 26px;
    padding-bottom: 18px;
    border-bottom: 1.5px solid #222222;
  }}

  h1 {{
    font-size: 20pt;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 14px 0;
    color: #000000;
    text-align: center;
  }}

  .authors {{
    font-size: 11pt;
    margin-bottom: 6px;
    font-weight: 600;
  }}

  .affiliations {{
    font-size: 9.5pt;
    color: #444444;
    font-style: italic;
    margin-bottom: 14px;
  }}

  /* Headings Hierarchy */
  h2 {{
    font-size: 14pt;
    font-weight: 700;
    color: #0B2545;
    border-bottom: 1px solid #C8D3E0;
    padding-bottom: 4px;
    margin-top: 26px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 12pt;
    font-weight: 600;
    color: #133C55;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 11pt;
    font-weight: 600;
    color: #222222;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }}

  p {{
    margin: 0 0 10px 0;
    text-indent: 0;
  }}

  /* Academic Blockquotes & Callouts */
  blockquote {{
    border-left: 3.5px solid #133C55;
    background-color: #F4F7FA;
    margin: 14px 0;
    padding: 10px 16px;
    font-size: 10.2pt;
    color: #222222;
  }}

  /* Figures & Images */
  img {{
    max-width: 98%;
    height: auto;
    display: block;
    margin: 16px auto 8px auto;
    border: 1px solid #D0D7DE;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    page-break-inside: avoid;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}

  table th, table td {{
    padding: 7px 10px;
    text-align: left;
    border-top: 1px solid #DDDDDD;
    border-bottom: 1px solid #DDDDDD;
  }}

  table th {{
    border-top: 2px solid #222222;
    border-bottom: 1.5px solid #222222;
    font-weight: 700;
    background-color: #F8F9FA;
  }}

  table tr:last-child td {{
    border-bottom: 2px solid #222222;
  }}

  /* Code & Algorithms */
  pre {{
    background-color: #F7F9FB;
    border: 1px solid #D1D9E0;
    border-left: 3.5px solid #1D4E89;
    padding: 10px 14px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.2pt;
    line-height: 1.4;
    overflow-x: auto;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  code {{
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    background-color: #F0F3F6;
    padding: 1px 4px;
    border-radius: 3px;
  }}

  pre code {{
    background-color: transparent;
    padding: 0;
  }}

  /* Architecture Diagram Box */
  .architecture-diagram {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F8FAFC;
    border: 1.5px solid #CBD5E1;
    border-radius: 8px;
    padding: 14px;
    margin: 18px 0;
    page-break-inside: avoid;
  }}

  .arch-box {{
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #94A3B8;
    border-radius: 6px;
    padding: 10px;
    text-align: center;
  }}

  .box-twin {{
    border-top: 3.5px solid #0284C7;
  }}

  .box-dash {{
    border-top: 3.5px solid #0D9488;
  }}

  .arch-bus {{
    flex: 0.8;
    text-align: center;
    padding: 0 10px;
    color: #475569;
  }}

  /* Lists */
  ul, ol {{
    margin: 6px 0 12px 20px;
    padding: 0;
  }}

  li {{
    margin-bottom: 4px;
  }}

  hr {{
    border: 0;
    border-top: 1px solid #E2E8F0;
    margin: 22px 0;
  }}
</style>
</head>
<body>

{body_html}

</body>
</html>
"""

    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"Written HTML render template to: {HTML_PATH} ({len(full_html)} bytes)")

    # Execute Chrome headless to generate the PDF
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=8000",
        f"--print-to-pdf={PDF_PATH}",
        "--no-pdf-header-footer",
        HTML_PATH
    ]
    print("Executing Chrome headless PDF conversion...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Chrome exit code:", res.returncode)
    if res.stdout:
        print("Stdout:", res.stdout)
    if res.stderr:
        print("Stderr:", res.stderr)

    if os.path.exists(PDF_PATH):
        size_kb = os.path.getsize(PDF_PATH) / 1024
        print(f"SUCCESS: Generated PDF at {PDF_PATH} ({size_kb:.1f} KB)")
    else:
        print("ERROR: PDF was not generated.")

if __name__ == "__main__":
    main()
