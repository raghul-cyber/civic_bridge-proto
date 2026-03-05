"""
civic-notify — Lambda handler
Trigger: DynamoDB Stream on civic_issues table
On status change: sends SES email and pre-caches TTS audio notification.
"""

import os
import json
import logging
import hashlib
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
ses = boto3.client("ses")
polly = boto3.client("polly")
s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")

USERS_TABLE = os.environ.get("DYNAMO_TABLE_USERS", "civic_users")
S3_BUCKET = os.environ.get("S3_BUCKET_MEDIA", "civic-bridge-media-842533680239")
SES_SENDER = os.environ.get("SES_SENDER_EMAIL", "noreply@civicbridge.org")
TTS_CACHE_PREFIX = "tts/cache/"


def handler(event, context):
    """Lambda entry-point — receives DynamoDB Stream records."""
    logger.info(f"Received {len(event.get('Records', []))} stream records")

    for record in event.get("Records", []):
        event_name = record.get("eventName")

        # Only process MODIFY events (status updates)
        if event_name != "MODIFY":
            continue

        new_image = _deserialize(record["dynamodb"].get("NewImage", {}))
        old_image = _deserialize(record["dynamodb"].get("OldImage", {}))

        old_status = old_image.get("status", "")
        new_status = new_image.get("status", "")

        # Skip if status hasn't changed
        if old_status == new_status:
            continue

        issue_id = new_image.get("issue_id", "unknown")
        reporter_id = new_image.get("reporter_id", "")
        title = new_image.get("title", "Civic Issue")

        logger.info(f"Status change: {issue_id} {old_status} → {new_status}")

        # ── 1. Fetch reporter email ──
        email = _get_reporter_email(reporter_id)
        if not email:
            logger.warning(f"No email found for reporter {reporter_id}")
            continue

        # ── 2. Send SES email ──
        _send_notification_email(email, issue_id, title, old_status, new_status)

        # ── 3. Pre-cache TTS audio notification ──
        _cache_tts_notification(issue_id, title, new_status)

    return {"statusCode": 200, "body": "Stream processed"}


def _deserialize(dynamo_image: dict) -> dict:
    """
    Flatten DynamoDB typed attributes → plain dict.
    e.g. {"issue_id": {"S": "ISS-123"}} → {"issue_id": "ISS-123"}
    """
    result = {}
    for key, val in dynamo_image.items():
        if "S" in val:
            result[key] = val["S"]
        elif "N" in val:
            result[key] = val["N"]
        elif "BOOL" in val:
            result[key] = val["BOOL"]
        elif "M" in val:
            result[key] = _deserialize(val["M"])
        elif "L" in val:
            result[key] = [list(v.values())[0] for v in val["L"]]
        elif "NULL" in val:
            result[key] = None
    return result


def _get_reporter_email(reporter_id: str) -> str | None:
    """Look up reporter email from civic_users table."""
    if not reporter_id or reporter_id == "anonymous":
        return None

    table = dynamodb.Table(USERS_TABLE)
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("user_id").eq(reporter_id),
            Limit=1,
        )
        items = response.get("Items", [])
        if items:
            return items[0].get("email")
    except Exception as e:
        logger.error(f"Failed to fetch reporter {reporter_id}: {e}")

    return None


def _send_notification_email(
    to_email: str, issue_id: str, title: str,
    old_status: str, new_status: str
):
    """Send status-change notification via Amazon SES."""
    subject = f"CivicBridge — Issue #{issue_id} Status Update"

    status_display = new_status.replace("_", " ").title()
    body_html = f"""
    <html>
    <body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">🏛️ CivicBridge</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0;">Issue Status Update</p>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b; font-size: 18px;">Issue #{issue_id}</h2>
            <p style="color: #475569;"><strong>{title}</strong></p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0; color: #64748b;">
                    Status changed from <strong>{old_status}</strong>
                    to <span style="color: #16a34a; font-weight: bold;">{status_display}</span>
                </p>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">
                You're receiving this because you reported this issue on CivicBridge.
            </p>
        </div>
    </body>
    </html>
    """

    body_text = (
        f"CivicBridge — Issue #{issue_id} Status Update\n\n"
        f"{title}\n"
        f"Status changed from {old_status} to {status_display}\n\n"
        f"You're receiving this because you reported this issue on CivicBridge."
    )

    try:
        ses.send_email(
            Source=SES_SENDER,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                },
            },
        )
        logger.info(f"Email sent to {to_email} for issue {issue_id}")
    except ClientError as e:
        logger.error(f"SES send failed: {e}")


def _cache_tts_notification(issue_id: str, title: str, new_status: str):
    """Pre-cache an audio notification using Polly → S3."""
    status_display = new_status.replace("_", " ")
    text = f"Your issue {issue_id}, {title}, has been updated to {status_display}."

    # MD5 cache key
    digest = hashlib.md5(f"{text}|Joanna".encode()).hexdigest()
    cache_key = f"{TTS_CACHE_PREFIX}Joanna/{digest}.mp3"

    # Check if already cached
    try:
        s3.head_object(Bucket=S3_BUCKET, Key=cache_key)
        logger.info(f"TTS already cached: {cache_key}")
        return
    except ClientError:
        pass  # Not cached — synthesize

    try:
        response = polly.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId="Joanna",
            Engine="neural",
        )
        audio_bytes = response["AudioStream"].read()
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=cache_key,
            Body=audio_bytes,
            ContentType="audio/mpeg",
        )
        logger.info(f"TTS notification cached: {cache_key} ({len(audio_bytes)} bytes)")
    except Exception as e:
        logger.error(f"TTS caching failed: {e}")
