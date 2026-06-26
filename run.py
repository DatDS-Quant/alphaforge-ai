import os
import socket
import subprocess
import sys
import threading
import time
import webbrowser


def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def run_cmd(cmd, cwd=None):
    print(f"Executing: {cmd} in {cwd or '.'}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Command failed with exit code {res.returncode}")
        return False
    return True


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    # 1. Check if Node is installed
    try:
        subprocess.run(
            "node -v", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True
        )
        has_node = True
    except (subprocess.SubprocessError, FileNotFoundError):
        print(
            "Node.js is not detected in PATH. Static server will fallback to serving pre-compiled files."
        )
        has_node = False

    if has_node:
        node_modules = os.path.join(frontend_dir, "node_modules")
        if not os.path.exists(node_modules):
            print("Installing frontend dependencies...")
            run_cmd("npm install", cwd=frontend_dir)

        print("Compiling React frontend...")
        run_cmd("npm run build", cwd=frontend_dir)

    # Check if frontend/dist exists
    dist_dir = os.path.join(frontend_dir, "dist")
    if not os.path.exists(dist_dir):
        print("WARNING: frontend/dist does not exist and Node.js was not available to compile it.")
        print("Please install Node.js and run 'npm run build' inside 'frontend' directory.")

    # 2. Check port 8000
    if is_port_in_use(8000):
        print("Port 8000 is already in use. Please close the other process or free the port.")
        sys.exit(1)

    # 3. Open browser after startup
    url = "http://127.0.0.1:8000"
    print(f"Starting AlphaForge Research Terminal on {url}...")

    def open_browser():
        time.sleep(1.5)
        print(f"Launching web browser at {url}...")
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    # 4. Start FastAPI server
    try:
        import uvicorn

        uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
    except ImportError:
        subprocess.run(
            f"{sys.executable} -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
            shell=True,
            cwd=root_dir,
        )


if __name__ == "__main__":
    main()
