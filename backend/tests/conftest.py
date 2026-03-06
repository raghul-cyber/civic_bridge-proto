"""
CivicBridge — Pytest Configuration & AWS Mock Fixtures

This conftest.py ensures:
  1. backend/ is on sys.path so bare imports work (from services.x, from api.x)
  2. Mock AWS credentials are injected for ALL tests (moto requirement)
  3. Common fixtures for DynamoDB, S3, etc. are available globally
"""

import os
import sys
import pytest

# ── Path Setup ──
# Add backend/ to sys.path so `from services.x` and `from api.x` resolve
backend_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.insert(0, os.path.abspath(backend_dir))


# ── AWS Mock Credentials (session-scoped, auto-applied) ──
@pytest.fixture(scope="session", autouse=True)
def aws_credentials():
    """
    Mock AWS credentials for moto.

    moto requires these env vars to be set BEFORE any boto3 client
    is created. scope='session' + autouse=True ensures they're set
    once at the start and persist for all tests.

    These are fake credentials — no real AWS calls will be made.
    """
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    os.environ["AWS_REGION"] = "us-east-1"

    # Prevent any real Secrets Manager or external service calls
    os.environ["USE_SECRETS_MANAGER"] = "false"
