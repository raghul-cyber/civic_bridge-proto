"""
CivicBridge — Pytest configuration
Adds the backend/ directory to sys.path so that bare imports
like `from services.x import ...` and `from api.x import ...` work.
"""

import sys
import os

# Insert backend/ at the front of sys.path
backend_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.insert(0, os.path.abspath(backend_dir))
