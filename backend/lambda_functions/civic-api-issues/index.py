"""
civic-api-issues — Lambda handler
Trigger: API Gateway POST /issues
Creates & validates civic issues, stores in DynamoDB, returns presigned S3 upload URLs.
"""

import json
import os
import uuid
import logging
from datetime import datetime
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")

TABLE_NAME = os.environ.get("DYNAMO_TABLE_ISSUES", "civic_issues")
S3_BUCKET = os.environ.get("S3_BUCKET_MEDIA", "civic-bridge-media-842533680239")

REQUIRED_FIELDS = ["title", "description"]
VALID_CATEGORIES = [
    "pothole", "streetlight", "water", "sanitation", "road",
    "electricity", "noise", "illegal_dumping", "traffic", "other"
]
VALID_SEVERITIES = ["low", "medium", "high", "critical"]


def validate_body(body: dict) -> list[str]:
    """Validates the request body, returns list of error messages."""
    errors = []
    for field in REQUIRED_FIELDS:
        if not body.get(field, "").strip():
            errors.append(f"'{field}' is required and cannot be empty.")

    if body.get("category") and body["category"] not in VALID_CATEGORIES:
        errors.append(f"Invalid category. Must be one of: {VALID_CATEGORIES}")

    if body.get("severity") and body["severity"] not in VALID_SEVERITIES:
        errors.append(f"Invalid severity. Must be one of: {VALID_SEVERITIES}")

    return errors


def generate_presigned_urls(issue_id: str, filenames: list[str]) -> list[dict]:
    """Generate presigned PUT URLs for photo uploads."""
    urls = []
    for fname in filenames:
        safe = fname.replace(" ", "_")
        key = f"uploads/issues/{issue_id}/{uuid.uuid4().hex[:8]}_{safe}"
        url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": key,
                "ContentType": "image/jpeg",
            },
            ExpiresIn=3600,
        )
        urls.append({"filename": fname, "key": key, "upload_url": url})
    return urls


def handler(event, context):
    """Lambda entry-point."""
    logger.info(f"Event: {json.dumps(event)}")

    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON body"})

    # ── Validate ──
    errors = validate_body(body)
    if errors:
        return _response(400, {"errors": errors})

    # ── Build item ──
    issue_id = f"ISS-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow().isoformat()

    location = body.get("location", {})
    item = {
        "issue_id": issue_id,
        "reported_date": now,
        "title": body["title"],
        "description": body["description"],
        "category": body.get("category", "other"),
        "severity": body.get("severity", "medium"),
        "ward": body.get("ward", ""),
        "status": "open",
        "reporter_id": body.get("reporter_id", "anonymous"),
        "location": {
            "lat": str(location.get("lat", 0)),
            "lng": str(location.get("lng", 0)),
            "address": location.get("address", ""),
        },
        "photos": [],
        "ai_extracted": body.get("ai_extracted", {}),
        "upvotes": 0,
        "created_at": now,
    }

    # ── Store in DynamoDB ──
    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item=item)
    logger.info(f"Issue created: {issue_id}")

    # ── Generate presigned upload URLs if photos requested ──
    upload_urls = []
    photo_filenames = body.get("photos", [])
    if photo_filenames:
        upload_urls = generate_presigned_urls(issue_id, photo_filenames)

    return _response(201, {
        "issue_id": issue_id,
        "status": "created",
        "upload_urls": upload_urls,
        "issue": item,
    })


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, default=str),
    }
