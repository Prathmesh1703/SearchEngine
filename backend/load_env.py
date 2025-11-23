"""
Universal environment loader for all backend modules.
Loads .env (backend/.env) before ANY provider initializes.

Supports: EXA, Brave, Gemini, SerpAPI, and future providers.
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Resolve backend/.env correctly
ENV_PATH = Path(__file__).resolve().parent / ".env"

# Load .env only once
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=False)
else:
    raise FileNotFoundError(f".env not found at: {ENV_PATH}")

# Dynamically detect all API_* keys in .env
REQUIRED_KEYS = [
    "EXA_API_KEY",
    "GEMINI_API_KEY",
    "SERPAPI_KEY",
    "BRAVE_API_KEY",   # Optional: Only if you add Brave later
]

missing = [key for key in REQUIRED_KEYS if not os.getenv(key)]

if missing:
    # Show a warning but don’t crash server
    print(f"[WARN] Missing API keys: {', '.join(missing)}")
else:
    print("[ENV] All required API keys loaded successfully.")
