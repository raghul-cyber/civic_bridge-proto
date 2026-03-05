"""
CivicBridge — Structured JSON Logger
Produces CloudWatch Insights-compatible JSON logs with:
  timestamp, request_id, user_id, action, duration_ms, status, level, message

Usage:
    from backend.utils.logger import get_logger, log_request

    logger = get_logger("civic-api-issues")
    logger.info("Issue created", extra={"action": "create_issue", "issue_id": "ISS-123"})

    # Or with request context:
    with log_request(request_id="abc-123", user_id="USR-001"):
        logger.info("Processing request")
"""

import os
import json
import time
import logging
import uuid
from datetime import datetime, timezone
from contextvars import ContextVar
from functools import wraps

# ── Context variables (async-safe) ──
_request_id: ContextVar[str] = ContextVar("request_id", default="")
_user_id: ContextVar[str] = ContextVar("user_id", default="anonymous")
_start_time: ContextVar[float] = ContextVar("start_time", default=0.0)


class JSONFormatter(logging.Formatter):
    """
    Formats log records as single-line JSON for CloudWatch Insights.

    Example output:
    {"timestamp":"2024-06-15T12:30:45.123Z","level":"INFO","logger":"civic-api-issues",
     "request_id":"abc-123","user_id":"USR-001","action":"create_issue","message":"Issue created",
     "duration_ms":42,"status":"success"}
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "level": record.levelname,
            "logger": record.name,
            "request_id": _request_id.get(""),
            "user_id": _user_id.get("anonymous"),
            "message": record.getMessage(),
        }

        # Optional fields from extra={}
        for key in ("action", "status", "duration_ms", "issue_id", "dataset",
                     "error", "function_name", "method", "path", "http_status"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        # Compute duration if start_time is set
        start = _start_time.get(0.0)
        if start > 0 and "duration_ms" not in log_entry:
            log_entry["duration_ms"] = round((time.time() - start) * 1000, 2)

        # Exception info
        if record.exc_info and record.exc_info[1]:
            log_entry["error"] = str(record.exc_info[1])
            log_entry["error_type"] = record.exc_info[0].__name__ if record.exc_info[0] else "Unknown"

        return json.dumps(log_entry, default=str)


def get_logger(name: str = "civicbridge", level: str = None) -> logging.Logger:
    """
    Create a JSON-formatted logger.

    Args:
        name:  Logger name (appears in 'logger' field)
        level: Override log level (default: from LOG_LEVEL env or INFO)

    Returns:
        Configured logging.Logger
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    log_level = level or os.environ.get("LOG_LEVEL", "INFO")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    logger.propagate = False

    return logger


class log_request:
    """
    Context manager that sets request context for structured logging.

    Usage:
        with log_request(request_id="abc", user_id="USR-001"):
            logger.info("Processing")
    """

    def __init__(self, request_id: str = None, user_id: str = "anonymous"):
        self.request_id = request_id or str(uuid.uuid4())[:8]
        self.user_id = user_id
        self._tokens = []

    def __enter__(self):
        self._tokens.append(_request_id.set(self.request_id))
        self._tokens.append(_user_id.set(self.user_id))
        self._tokens.append(_start_time.set(time.time()))
        return self

    def __exit__(self, *args):
        for token in self._tokens:
            try:
                token.var.reset(token)
            except ValueError:
                pass


def log_lambda_handler(logger: logging.Logger):
    """
    Decorator for Lambda handlers — auto-logs invocation, duration, errors.

    Usage:
        logger = get_logger("civic-api-issues")

        @log_lambda_handler(logger)
        def handler(event, context):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(event, context):
            request_id = (
                context.aws_request_id
                if hasattr(context, "aws_request_id")
                else str(uuid.uuid4())[:8]
            )
            function_name = (
                context.function_name
                if hasattr(context, "function_name")
                else func.__name__
            )

            with log_request(request_id=request_id):
                logger.info(
                    f"Lambda invoked: {function_name}",
                    extra={
                        "action": "lambda_invoke",
                        "function_name": function_name,
                        "status": "started",
                    },
                )
                start = time.time()

                try:
                    result = func(event, context)
                    duration = round((time.time() - start) * 1000, 2)
                    logger.info(
                        f"Lambda completed: {function_name}",
                        extra={
                            "action": "lambda_complete",
                            "function_name": function_name,
                            "duration_ms": duration,
                            "status": "success",
                        },
                    )
                    return result

                except Exception as e:
                    duration = round((time.time() - start) * 1000, 2)
                    logger.error(
                        f"Lambda failed: {function_name} — {e}",
                        extra={
                            "action": "lambda_error",
                            "function_name": function_name,
                            "duration_ms": duration,
                            "status": "error",
                            "error": str(e),
                        },
                        exc_info=True,
                    )
                    raise

        return wrapper
    return decorator


def log_fastapi_middleware(logger: logging.Logger):
    """
    FastAPI middleware factory for request/response logging.

    Usage in main.py:
        from backend.utils.logger import get_logger, log_fastapi_middleware
        logger = get_logger("civicbridge-api")
        app.middleware("http")(log_fastapi_middleware(logger))
    """
    async def middleware(request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4())[:8])
        user_id = request.headers.get("x-user-id", "anonymous")

        with log_request(request_id=request_id, user_id=user_id):
            start = time.time()
            logger.info(
                f"{request.method} {request.url.path}",
                extra={
                    "action": "http_request",
                    "method": request.method,
                    "path": str(request.url.path),
                    "status": "started",
                },
            )

            try:
                response = await call_next(request)
                duration = round((time.time() - start) * 1000, 2)

                logger.info(
                    f"{request.method} {request.url.path} → {response.status_code}",
                    extra={
                        "action": "http_response",
                        "method": request.method,
                        "path": str(request.url.path),
                        "http_status": response.status_code,
                        "duration_ms": duration,
                        "status": "success" if response.status_code < 400 else "error",
                    },
                )

                response.headers["X-Request-ID"] = request_id
                return response

            except Exception as e:
                duration = round((time.time() - start) * 1000, 2)
                logger.error(
                    f"{request.method} {request.url.path} — {e}",
                    extra={
                        "action": "http_error",
                        "method": request.method,
                        "path": str(request.url.path),
                        "duration_ms": duration,
                        "status": "error",
                        "error": str(e),
                    },
                    exc_info=True,
                )
                raise

    return middleware
