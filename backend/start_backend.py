#!/usr/bin/env python3

print("--- Script Start ---")

import sys
print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")

print("Attempting to import FastAPI...")
try:
    from fastapi import FastAPI
    print("✓ FastAPI imported successfully.")
except ImportError as e:
    print(f"✗ FastAPI import failed: {e}")
    # Handle installation if needed

print("Attempting to import Uvicorn...")
try:
    import uvicorn
    print("✓ Uvicorn imported successfully.")
except ImportError as e:
    print(f"✗ Uvicorn import failed: {e}")
    # Handle installation if needed

print("Attempting to import the FastAPI app...")
try:
    from app.main import app
    print("✓ FastAPI app imported successfully.")
except Exception as e:
    print(f"✗ Failed to import FastAPI app: {e}")
    app = None

if __name__ == "__main__":
    print("--- Starting Server ---")
    if app:
        print("Starting Uvicorn server on http://localhost:8000...")
        # Use subprocess to run uvicorn for better reload support
        import subprocess
        subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])
    else:
        print("✗ Cannot start server because the app failed to import.")

print("--- Script End ---")
