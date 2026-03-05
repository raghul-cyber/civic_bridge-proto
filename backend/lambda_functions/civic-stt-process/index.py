"""
civic-stt-process — Lambda handler
Trigger: S3 Event on civic-bridge-media-842533680239, prefix audio/uploads/
Auto-starts Transcribe job, polls with backoff, stores transcript in DynamoDB,
cleans up source audio.
"""

import json
import os
import time
import logging
import urllib.parse
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
transcribe = boto3.client("transcribe")
dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ.get("DYNAMO_TABLE_ISSUES", "civic_issues")

# Map filename suffix to Transcribe language code
LANG_MAP = {
    ".en.wav": "en-US", ".en.mp3": "en-US", ".en.webm": "en-US",
    ".es.wav": "es-US", ".es.mp3": "es-US", ".es.webm": "es-US",
    ".hi.wav": "hi-IN", ".hi.mp3": "hi-IN", ".hi.webm": "hi-IN",
    ".fr.wav": "fr-FR", ".fr.mp3": "fr-FR", ".fr.webm": "fr-FR",
    ".pt.wav": "pt-BR", ".pt.mp3": "pt-BR", ".pt.webm": "pt-BR",
}


def detect_language(key: str) -> str:
    """Detect language code from filename suffix. Default en-US."""
    lower = key.lower()
    for suffix, lang in LANG_MAP.items():
        if suffix in lower:
            return lang
    return "en-US"


def extract_issue_id(key: str) -> str | None:
    """
    Try to extract issue_id from key pattern:
    audio/uploads/{issue_id}/filename.wav
    """
    parts = key.split("/")
    if len(parts) >= 3:
        return parts[2]
    return None


def handler(event, context):
    """Lambda entry-point — triggered by S3 PutObject event."""
    logger.info(f"Event: {json.dumps(event)}")

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        logger.info(f"Processing: s3://{bucket}/{key}")

        # ── 1. Determine language ──
        language_code = detect_language(key)
        logger.info(f"Detected language: {language_code}")

        # ── 2. Start Transcribe job ──
        job_name = f"civic-{key.replace('/', '-').replace('.', '-')}"
        # Truncate to max 200 chars (Transcribe limit)
        job_name = job_name[:200]

        media_uri = f"s3://{bucket}/{key}"

        # Determine media format
        media_format = "wav"
        if key.endswith(".mp3"):
            media_format = "mp3"
        elif key.endswith(".webm"):
            media_format = "webm"
        elif key.endswith(".flac"):
            media_format = "flac"

        try:
            transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                LanguageCode=language_code,
                MediaFormat=media_format,
                Media={"MediaFileUri": media_uri},
                OutputBucketName=bucket,
                OutputKey=f"audio/transcripts/{job_name}.json",
            )
            logger.info(f"Transcribe job started: {job_name}")
        except transcribe.exceptions.ConflictException:
            logger.warning(f"Job {job_name} already exists — skipping")
            continue
        except Exception as e:
            logger.error(f"Failed to start Transcribe job: {e}")
            continue

        # ── 3. Poll with exponential backoff ──
        transcript_text = _poll_transcription(job_name)

        if transcript_text is None:
            logger.error(f"Transcription failed for job {job_name}")
            continue

        logger.info(f"Transcript ({len(transcript_text)} chars): {transcript_text[:200]}...")

        # ── 4. Store transcript in DynamoDB ──
        issue_id = extract_issue_id(key)
        if issue_id:
            _update_issue_transcript(issue_id, transcript_text, language_code)

        # ── 5. Delete source audio ──
        try:
            s3.delete_object(Bucket=bucket, Key=key)
            logger.info(f"Deleted source audio: {key}")
        except Exception as e:
            logger.warning(f"Failed to delete source audio: {e}")

        # ── 6. Cleanup Transcribe job ──
        try:
            transcribe.delete_transcription_job(TranscriptionJobName=job_name)
        except Exception:
            pass

    return {"statusCode": 200, "body": "Processing complete"}


def _poll_transcription(job_name: str, max_attempts: int = 20) -> str | None:
    """Poll Transcribe job with exponential backoff. Returns transcript or None."""
    delay = 3
    for attempt in range(max_attempts):
        response = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = response["TranscriptionJob"]["TranscriptionJobStatus"]

        if status == "COMPLETED":
            transcript_uri = response["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            return _fetch_transcript(transcript_uri)
        elif status == "FAILED":
            reason = response["TranscriptionJob"].get("FailureReason", "Unknown")
            logger.error(f"Transcribe job failed: {reason}")
            return None

        logger.info(f"Attempt {attempt+1}: status={status}, waiting {delay}s...")
        time.sleep(delay)
        delay = min(delay * 1.5, 30)  # Cap at 30s

    logger.error(f"Transcription timed out after {max_attempts} attempts")
    return None


def _fetch_transcript(uri: str) -> str:
    """Download and parse the Transcribe output JSON."""
    import urllib.request
    try:
        with urllib.request.urlopen(uri) as resp:
            data = json.loads(resp.read())
            return data["results"]["transcripts"][0]["transcript"]
    except Exception as e:
        logger.error(f"Failed to fetch transcript: {e}")
        return ""


def _update_issue_transcript(issue_id: str, transcript: str, lang: str):
    """Update civic_issues item with ai_transcript field."""
    table = dynamodb.Table(TABLE_NAME)
    try:
        # Query to find the item's sort key
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("issue_id").eq(issue_id),
            Limit=1,
        )
        items = response.get("Items", [])
        if not items:
            logger.warning(f"Issue {issue_id} not found in DynamoDB")
            return

        reported_date = items[0]["reported_date"]
        table.update_item(
            Key={"issue_id": issue_id, "reported_date": reported_date},
            UpdateExpression="SET ai_transcript = :t, transcript_language = :l",
            ExpressionAttributeValues={":t": transcript, ":l": lang},
        )
        logger.info(f"Transcript stored for issue {issue_id}")
    except Exception as e:
        logger.error(f"Failed to update issue {issue_id}: {e}")
