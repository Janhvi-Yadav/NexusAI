import subprocess
import signal
import sys
import time
import os
import webbrowser
from pathlib import Path


ROOT     = Path(__file__).parent
BACKEND  = ROOT / "backend"
FRONTEND = ROOT / "frontend"
ENV_FILE = BACKEND / ".env"

backend_proc  = None
frontend_proc = None

GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def log(symbol, color, message):
    print(f"  {color}{symbol}{RESET}  {message}")


def check_api_key():
    if os.environ.get("GROQ_API_KEY"):
        log("✓", GREEN, "Groq API key found in environment.")
        return
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                if line.startswith("GROQ_API_KEY="):
                    key = line.strip().split("=", 1)[1]
                    os.environ["GROQ_API_KEY"] = key
                    log("✓", GREEN, "Groq API key loaded from .env file.")
                    return
    print(f"\n  {YELLOW}No API key found!{RESET}")
    print(f"  Get your FREE key from: {CYAN}https://console.groq.com/keys{RESET}\n")
    key = input("  Paste your Groq API key here: ").strip()
    if not key:
        print(f"\n  {RED}No key entered. Exiting.{RESET}")
        sys.exit(1)
    with open(ENV_FILE, "w") as f:
        f.write(f"GROQ_API_KEY={key}\n")
    os.environ["GROQ_API_KEY"] = key
    log("✓", GREEN, "API key saved to backend/.env")

def check_requirements():
    try:
        subprocess.run(["node", "--version"], capture_output=True, text=True)
    except FileNotFoundError:
        log("✗", RED, "Node.js not found! Install from https://nodejs.org")
        sys.exit(1)

def python_packages_ok():
    try:
        import importlib.metadata
        req_file = BACKEND / "requirements.txt"
        with open(req_file) as f:
            packages = [l.strip().split("==")[0] for l in f if l.strip() and not l.startswith("#")]
        for pkg in packages:
            importlib.metadata.version(pkg)
        return True
    except Exception:
        return False


def node_modules_ok():
    node_modules = FRONTEND / "node_modules"
    return node_modules.exists() and any(node_modules.iterdir())

def install_dependencies():
    print()
    if not python_packages_ok():
        log("→", CYAN, "Installing Python packages ...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"], cwd=BACKEND, check=True)
        log("✓", GREEN, "Python packages installed.")
    if not node_modules_ok():
        log("→", CYAN, "Installing Node packages (first time only)...")
        subprocess.run("npm install --silent", cwd=FRONTEND, shell=True, check=True)
        log("✓", GREEN, "Node packages installed.")
    print()

def start_servers():
    global backend_proc, frontend_proc
    log("→", CYAN, "Starting Backend  →  http://localhost:8000")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=BACKEND, env={**os.environ},
    )
    time.sleep(3)
    log("→", CYAN, "Starting Frontend →  http://localhost:5173")
    frontend_proc = subprocess.Popen("npm run dev", cwd=FRONTEND, shell=True)
    time.sleep(4)
    webbrowser.open("http://localhost:5173")

def stop_all(signum=None, frame=None):
    print(f"\n\n  {YELLOW}Stopping NexusAI...{RESET}\n")
    if backend_proc:
        backend_proc.terminate()
        log("✓", GREEN, "Backend stopped.")
    if frontend_proc:
        frontend_proc.terminate()
        log("✓", GREEN, "Frontend stopped.")
    if sys.platform == "win32":
        os.system("taskkill /f /im uvicorn.exe >nul 2>&1")
        os.system("taskkill /f /im node.exe >nul 2>&1")
    print(f"\n  {BOLD}Goodbye! 👋{RESET}\n")
    sys.exit(0)

signal.signal(signal.SIGINT,  stop_all)
signal.signal(signal.SIGTERM, stop_all)

if __name__ == "__main__":
    check_api_key()
    check_requirements()
    install_dependencies()
    start_servers()
    try:
        while True:
            if backend_proc.poll() is not None:
                log("!", YELLOW, "Backend stopped unexpectedly. Restarting...")
                backend_proc = subprocess.Popen(
                    [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
                    cwd=BACKEND, env={**os.environ},
                )
            if frontend_proc.poll() is not None:
                log("!", YELLOW, "Frontend stopped unexpectedly.")
            time.sleep(3)
    except KeyboardInterrupt:
        stop_all()
