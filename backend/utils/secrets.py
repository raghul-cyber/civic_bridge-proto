"""
CivicBridge — AWS Secrets Manager Integration
Loads secrets from Secrets Manager in production, falls back to .env locally.

Usage:
    from backend.utils.secrets import get_config

    config = get_config()
    bucket = config["S3_BUCKET_MEDIA"]

    # Or get a single value:
    from backend.utils.secrets import get_secret
    api_key = get_secret("CENSUS_API_KEY")
"""

import os
import json
import logging
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

SECRET_ID = os.environ.get("SECRET_ID", "civic-bridge/prod")
REGION = os.environ.get("AWS_REGION", "us-east-1")
USE_SECRETS_MANAGER = os.environ.get("USE_SECRETS_MANAGER", "false").lower() == "true"

# ── Default values (non-sensitive) ──
DEFAULTS = {
    "AWS_REGION": "us-east-1",
    "AWS_ACCOUNT_ID": "842533680239",
    "DYNAMO_TABLE_ISSUES": "civic_issues",
    "DYNAMO_TABLE_USERS": "civic_users",
    "DYNAMO_TABLE_SERVICES": "civic_services",
    "DYNAMO_TABLE_DATASETS": "civic_datasets",
    "DYNAMO_TABLE_DEMOGRAPHICS": "civic_demographics",
    "DYNAMO_TABLE_BUDGET": "civic_budget",
    "DYNAMO_TABLE_ENVIRONMENT": "civic_environment",
    "DYNAMO_TABLE_HAZARDS": "civic_hazards",
    "DYNAMO_TABLE_FEEDBACK": "civic_feedback",
    "S3_BUCKET_MEDIA": "civic-bridge-media-842533680239",
    "S3_BUCKET_DATASETS": "civic-bridge-datasets-842533680239",
    "WHISPER_MODEL": "base",
    "AWS_POLLY_VOICE": "Joanna",
    "AWS_TRANSCRIBE_LANG": "en-US",
    "LOG_LEVEL": "INFO",
}


@lru_cache(maxsize=1)
def _fetch_secrets() -> dict:
    """
    Fetch secrets from AWS Secrets Manager.
    Results are cached for the lifetime of the process.
    """
    try:
        client = boto3.client("secretsmanager", region_name=REGION)
        response = client.get_secret_value(SecretId=SECRET_ID)
        secret_data = json.loads(response["SecretString"])
        logger.info(f"Loaded {len(secret_data)} keys from Secrets Manager ({SECRET_ID})")
        return secret_data
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "ResourceNotFoundException":
            logger.warning(f"Secret '{SECRET_ID}' not found — using env vars / defaults")
        elif error_code == "AccessDeniedException":
            logger.warning("Access denied to Secrets Manager — check IAM role")
        else:
            logger.error(f"Secrets Manager error: {e}")
        return {}
    except Exception as e:
        logger.error(f"Failed to fetch secrets: {e}")
        return {}


def get_config() -> dict:
    """
    Returns the full configuration dict.
    Priority: Secrets Manager > env vars > defaults.
    """
    config = dict(DEFAULTS)

    # Layer 1: Secrets Manager (production)
    if USE_SECRETS_MANAGER:
        secrets = _fetch_secrets()
        config.update(secrets)

    # Layer 2: Environment variables override everything
    for key in config:
        env_val = os.environ.get(key)
        if env_val is not None:
            config[key] = env_val

    return config


def get_secret(key: str, default: str = None) -> str | None:
    """
    Get a single config value.

    Args:
        key:     Config key (e.g. "CENSUS_API_KEY")
        default: Fallback if not found anywhere
    """
    config = get_config()
    return config.get(key, default)


def refresh_secrets():
    """Force-refresh secrets from Secrets Manager (clears cache)."""
    _fetch_secrets.cache_clear()
    logger.info("Secrets cache cleared — will re-fetch on next access")


def get_database_table(table_key: str) -> str:
    """
    Convenience: get a DynamoDB table name.
    e.g. get_database_table("issues") → "civic_issues"
    """
    key = f"DYNAMO_TABLE_{table_key.upper()}"
    return get_secret(key, f"civic_{table_key.lower()}")


def get_s3_bucket(bucket_key: str) -> str:
    """
    Convenience: get an S3 bucket name.
    e.g. get_s3_bucket("media") → "civic-bridge-media-842533680239"
    """
    key = f"S3_BUCKET_{bucket_key.upper()}"
    return get_secret(key, f"civic-bridge-{bucket_key.lower()}-842533680239")
