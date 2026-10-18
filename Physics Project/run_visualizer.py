"""
Quantum Computing Optimization Engine - 3D Isometric Microgrid Launcher
Starts a local web server and opens the interactive 3D visualizer in your default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "microgrid_3d")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Concise logging
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    os.chdir(DIRECTORY)
    port = PORT
    server = None
    
    # Try finding an open port starting at 8080
    for p in range(PORT, PORT + 20):
        try:
            server = socketserver.TCPServer(("", p), Handler)
            port = p
            break
        except OSError:
            continue

    if not server:
        print("Error: Could not bind to any port between 8080 and 8100.")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 70)
    print("⚡ QUANTUM COMPUTING OPTIMIZATION ENGINE — 3D ISOMETRIC MICROGRID")
    print("=" * 70)
    print(f"Local Server running at: {url}")
    print(f"Serving assets from:    {DIRECTORY}")
    print("Opening browser...")
    print("Press Ctrl+C to terminate.")
    print("=" * 70)

    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print(f"Please open your browser manually and navigate to: {url}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down 3D Microgrid server.")
        server.server_close()

if __name__ == "__main__":
    main()
