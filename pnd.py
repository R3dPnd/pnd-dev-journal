#!/usr/bin/env python3
import subprocess
import threading
import sys
import os
import signal

ROOT = os.path.dirname(os.path.abspath(__file__))

processes = []


def stream(proc, prefix):
    for line in iter(proc.stdout.readline, b""):
        sys.stdout.write(f"[{prefix}] {line.decode(errors='replace')}")
        sys.stdout.flush()


def start(name, cwd, cmd, env_extra=None):
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    proc = subprocess.Popen(
        cmd,
        cwd=os.path.join(ROOT, cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        env=env,
    )
    processes.append(proc)
    t = threading.Thread(target=stream, args=(proc, name), daemon=True)
    t.start()
    return proc


def shutdown(sig=None, frame=None):
    print("\nShutting down...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

print("Starting backend  (server/)  ...")
start("server", "server", "npm run dev")

print("Starting frontend (client-app/) ...")
start("client", "client-app", "npm start", {"HOST": "0.0.0.0", "BROWSER": "none"})

print("Both running. Press Ctrl+C to stop.\n")

for p in processes:
    p.wait()
