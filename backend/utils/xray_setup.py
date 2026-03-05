"""
CivicBridge — AWS X-Ray Tracing Setup
Instruments FastAPI, boto3, and HTTP requests for distributed tracing.

Trace path: API Gateway → FastAPI/Lambda → DynamoDB → S3

Usage in main.py:
    from backend.utils.xray_setup import setup_xray
    setup_xray(app)

For Lambda functions:
    from backend.utils.xray_setup import setup_xray_lambda
    setup_xray_lambda()
"""

import os
import logging

logger = logging.getLogger(__name__)

# Disable X-Ray in local dev / testing
XRAY_ENABLED = os.environ.get("XRAY_ENABLED", "true").lower() == "true"


def setup_xray(app=None):
    """
    Set up X-Ray tracing for the FastAPI application.

    Patches: boto3 (DynamoDB, S3, Polly, Transcribe), httplib, requests.
    Adds ASGI middleware to FastAPI for per-request segment creation.

    Args:
        app: FastAPI application instance (optional — middleware added if provided)
    """
    if not XRAY_ENABLED:
        logger.info("X-Ray tracing disabled (XRAY_ENABLED=false)")
        return

    try:
        from aws_xray_sdk.core import xray_recorder, patch_all
        from aws_xray_sdk.ext.fastapi.middleware import XRayMiddleware

        # Configure the recorder
        xray_recorder.configure(
            service="CivicBridge-API",
            sampling=True,
            context_missing="LOG_ERROR",
            daemon_address=os.environ.get("XRAY_DAEMON_ADDRESS", "127.0.0.1:2000"),
            dynamic_naming="*civicbridge*",
        )

        # Patch all supported libraries (boto3, httplib, requests, sqlite3)
        patch_all()

        # Add FastAPI middleware
        if app:
            XRayMiddleware(app, recorder=xray_recorder)
            logger.info("X-Ray middleware added to FastAPI")

        logger.info("X-Ray tracing initialized — patched boto3, httplib, requests")

    except ImportError:
        logger.warning("aws-xray-sdk not installed — X-Ray tracing disabled. "
                       "Install with: pip install aws-xray-sdk")
    except Exception as e:
        logger.error(f"X-Ray setup failed: {e}")


def setup_xray_lambda():
    """
    Set up X-Ray tracing for Lambda functions.
    Call this at the top of each Lambda handler file.

    Lambda functions have X-Ray built-in when enabled via config,
    but we still need to patch boto3 for downstream tracing.
    """
    if not XRAY_ENABLED:
        return

    try:
        from aws_xray_sdk.core import patch
        # Patch only what Lambda functions use
        patch(["boto3", "requests"])
        logger.info("X-Ray Lambda patches applied (boto3, requests)")

    except ImportError:
        logger.warning("aws-xray-sdk not installed — skipping Lambda patches")
    except Exception as e:
        logger.error(f"X-Ray Lambda setup failed: {e}")


def trace_subsegment(name: str):
    """
    Decorator to wrap a function call in an X-Ray subsegment.

    Usage:
        @trace_subsegment("process_audio")
        def process_audio(file_path):
            ...
    """
    def decorator(func):
        if not XRAY_ENABLED:
            return func

        try:
            from aws_xray_sdk.core import xray_recorder
            from functools import wraps

            @wraps(func)
            def wrapper(*args, **kwargs):
                with xray_recorder.in_subsegment(name) as subsegment:
                    try:
                        result = func(*args, **kwargs)
                        subsegment.put_metadata("result_type", type(result).__name__)
                        return result
                    except Exception as e:
                        subsegment.add_exception(e, stack=True)
                        raise

            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                with xray_recorder.in_subsegment(name) as subsegment:
                    try:
                        result = await func(*args, **kwargs)
                        subsegment.put_metadata("result_type", type(result).__name__)
                        return result
                    except Exception as e:
                        subsegment.add_exception(e, stack=True)
                        raise

            import asyncio
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return wrapper

        except ImportError:
            return func

    return decorator
