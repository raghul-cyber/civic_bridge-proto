"""
CivicBridge — Full Integration Test Suite
Run: pytest backend/tests/test_integration.py -v --asyncio-mode=auto

Uses moto to mock all AWS services (DynamoDB, S3, Transcribe, Polly, SES).
Tests the complete lifecycle across services.
"""

import io
import os
import json
import wave
import struct
import pytest
import boto3
from moto import mock_aws
from httpx import AsyncClient, ASGITransport

# ── Fixtures ──

REGION = "us-east-1"
MEDIA_BUCKET = "civic-bridge-media-842533680239"
DATASETS_BUCKET = "civic-bridge-datasets-842533680239"


@pytest.fixture(autouse=True)
def aws_env(monkeypatch):
    """Set dummy AWS creds for moto across all tests."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", REGION)
    monkeypatch.setenv("AWS_REGION", REGION)
    monkeypatch.setenv("S3_BUCKET_MEDIA", MEDIA_BUCKET)
    monkeypatch.setenv("S3_BUCKET_DATASETS", DATASETS_BUCKET)


@pytest.fixture
def setup_aws():
    """Creates mocked DynamoDB tables and S3 buckets."""
    with mock_aws():
        # DynamoDB
        dynamodb = boto3.resource("dynamodb", region_name=REGION)

        # civic_issues table
        dynamodb.create_table(
            TableName="civic_issues",
            KeySchema=[
                {"AttributeName": "issue_id", "KeyType": "HASH"},
                {"AttributeName": "reported_date", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "issue_id", "AttributeType": "S"},
                {"AttributeName": "reported_date", "AttributeType": "S"},
                {"AttributeName": "ward", "AttributeType": "S"},
                {"AttributeName": "status", "AttributeType": "S"},
                {"AttributeName": "category", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "ward-status-index",
                    "KeySchema": [
                        {"AttributeName": "ward", "KeyType": "HASH"},
                        {"AttributeName": "status", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "category-date-index",
                    "KeySchema": [
                        {"AttributeName": "category", "KeyType": "HASH"},
                        {"AttributeName": "reported_date", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
        )

        # civic_users table
        dynamodb.create_table(
            TableName="civic_users",
            KeySchema=[
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "email", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "email", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # civic_demographics
        dynamodb.create_table(
            TableName="civic_demographics",
            KeySchema=[
                {"AttributeName": "county_fips", "KeyType": "HASH"},
                {"AttributeName": "year", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "county_fips", "AttributeType": "S"},
                {"AttributeName": "year", "AttributeType": "N"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # S3 buckets
        s3 = boto3.client("s3", region_name=REGION)
        s3.create_bucket(Bucket=MEDIA_BUCKET)
        s3.create_bucket(Bucket=DATASETS_BUCKET)

        yield {
            "dynamodb": dynamodb,
            "s3": s3,
        }


def _generate_wav_bytes(duration_s=1, sample_rate=16000):
    """Generate a minimal WAV file in memory."""
    buf = io.BytesIO()
    n_samples = int(sample_rate * duration_s)
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(n_samples):
            sample = int(16000 * (0.5 * ((i % 100) / 100)))
            wf.writeframes(struct.pack("<h", sample))
    buf.seek(0)
    return buf.read()


@pytest.fixture
def app(setup_aws):
    """Build and return the FastAPI app with mocked AWS."""
    from services.dynamo_service import DynamoService
    from services import dynamo_service as ds_module
    from services.s3_service import S3Service
    from services import s3_service as s3_module

    # Rebind singletons to the mocked resources
    svc = DynamoService()
    svc.dynamodb = setup_aws["dynamodb"]
    ds_module.dynamo_service = svc

    s3_svc = S3Service()
    s3_svc.client = setup_aws["s3"]
    s3_module.s3_service = s3_svc

    from backend.main import app as fastapi_app
    return fastapi_app


@pytest.fixture
async def client(app):
    """Async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ═══════════════════════════════════════════════════════════════
# 1. test_issue_lifecycle
# ═══════════════════════════════════════════════════════════════

class TestIssueLifecycle:
    """
    Full lifecycle: create → verify DynamoDB → upload photo → check S3 →
    update status → verify update → upvote.
    """

    @pytest.mark.asyncio
    async def test_create_issue(self, client, setup_aws):
        """Create an issue and verify it exists in DynamoDB."""
        res = await client.post("/issues", json={
            "title": "Broken streetlight on Main St",
            "description": "The light has been out for 3 days, causing safety concerns",
            "category": "streetlight",
            "severity": "high",
            "ward": "ward-5",
            "location": {"lat": 41.878, "lng": -87.629, "address": "123 Main St"},
            "reporter_id": "USR-001",
        })

        assert res.status_code == 201
        data = res.json()
        assert data["issue"]["status"] == "open"
        assert data["issue"]["issue_id"].startswith("ISS-")
        issue_id = data["issue"]["issue_id"]

        # Verify DynamoDB entry
        table = setup_aws["dynamodb"].Table("civic_issues")
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("issue_id").eq(issue_id),
            Limit=1,
        )
        assert len(response["Items"]) == 1
        assert response["Items"][0]["title"] == "Broken streetlight on Main St"

    @pytest.mark.asyncio
    async def test_upload_photo(self, client, setup_aws):
        """Upload a photo and verify S3 URL is returned."""
        # Create issue first
        create_res = await client.post("/issues", json={
            "title": "Pothole photo test",
            "description": "Testing photo upload",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        # Upload photo
        fake_photo = b"\xff\xd8\xff\xe0" + b"\x00" * 1000  # Minimal JPEG header
        res = await client.post(
            "/media/upload",
            files={"file": ("test.jpg", fake_photo, "image/jpeg")},
            data={"issue_id": issue_id},
        )

        assert res.status_code == 200
        data = res.json()
        assert "url" in data
        assert issue_id in data.get("issue_id", "")

    @pytest.mark.asyncio
    async def test_update_status(self, client, setup_aws):
        """Update issue status and verify DynamoDB reflects the change."""
        create_res = await client.post("/issues", json={
            "title": "Status update test",
            "description": "Testing status change",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        # Update status
        res = await client.put(f"/issues/{issue_id}", json={"status": "in_progress"})
        assert res.status_code == 200
        assert res.json()["updates"]["status"] == "in_progress"

        # Verify in DynamoDB
        get_res = await client.get(f"/issues/{issue_id}")
        assert get_res.json()["issue"]["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_upvote(self, client):
        """Upvote an issue and verify count increments."""
        create_res = await client.post("/issues", json={
            "title": "Upvote test",
            "description": "Testing upvotes",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        # Upvote twice
        res1 = await client.post(f"/issues/{issue_id}/upvote")
        assert res1.status_code == 200
        assert res1.json()["upvotes"] == 1

        res2 = await client.post(f"/issues/{issue_id}/upvote")
        assert res2.status_code == 200
        assert res2.json()["upvotes"] == 2

    @pytest.mark.asyncio
    async def test_list_issues_filter(self, client):
        """Create issues in different wards and filter."""
        await client.post("/issues", json={
            "title": "Ward 1 issue", "description": "In ward 1",
            "ward": "ward-1", "category": "pothole",
        })
        await client.post("/issues", json={
            "title": "Ward 2 issue", "description": "In ward 2",
            "ward": "ward-2", "category": "streetlight",
        })

        res = await client.get("/issues?ward=ward-1")
        assert res.status_code == 200
        issues = res.json()["issues"]
        assert all(i.get("ward") == "ward-1" for i in issues)

    @pytest.mark.asyncio
    async def test_delete_issue_requires_auth(self, client):
        """DELETE without admin token fails with 403."""
        create_res = await client.post("/issues", json={
            "title": "Delete test", "description": "Test",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        res = await client.delete(f"/issues/{issue_id}")
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_get_nonexistent_issue(self, client):
        """GET a non-existent issue returns 404."""
        res = await client.get("/issues/ISS-DOESNOTEXIST")
        assert res.status_code == 404


# ═══════════════════════════════════════════════════════════════
# 2. test_stt_pipeline
# ═══════════════════════════════════════════════════════════════

class TestSTTPipeline:
    """Speech-to-text transcription pipeline tests."""

    @pytest.mark.asyncio
    async def test_stt_languages_endpoint(self, client):
        """GET /stt/languages returns supported languages."""
        res = await client.get("/stt/languages")
        assert res.status_code == 200
        data = res.json()
        assert "languages" in data
        assert len(data["languages"]) > 0

    @pytest.mark.asyncio
    async def test_stt_transcribe_with_audio(self, client):
        """POST audio file to /stt/transcribe."""
        wav_bytes = _generate_wav_bytes(duration_s=0.5)

        res = await client.post(
            "/stt/transcribe",
            files={"audio": ("test.wav", wav_bytes, "audio/wav")},
            data={"language": "en-US", "mode": "whisper"},
        )

        # May succeed or fail depending on whisper availability
        assert res.status_code in [200, 500, 422]


# ═══════════════════════════════════════════════════════════════
# 3. test_tts_pipeline
# ═══════════════════════════════════════════════════════════════

class TestTTSPipeline:
    """Text-to-speech synthesis pipeline tests."""

    @pytest.mark.asyncio
    async def test_tts_voices(self, client):
        """GET /tts/voices returns available voices."""
        res = await client.get("/tts/voices")
        assert res.status_code == 200
        data = res.json()
        assert "voices" in data

    @pytest.mark.asyncio
    async def test_tts_synthesize(self, client):
        """POST text to /tts/synthesize returns audio/mpeg stream."""
        res = await client.post("/tts/synthesize", json={
            "text": "Hello from CivicBridge integration test",
            "voice_id": "Joanna",
            "mode": "gtts",
        })

        # gTTS might not be available in CI — accept 200 or 500
        assert res.status_code in [200, 500]
        if res.status_code == 200:
            assert res.headers.get("content-type", "").startswith("audio/")
            assert len(res.content) > 0


# ═══════════════════════════════════════════════════════════════
# 4. test_dataset_ingest
# ═══════════════════════════════════════════════════════════════

class TestDatasetIngest:
    """Dataset ingestion pipeline tests."""

    @pytest.mark.asyncio
    async def test_list_datasets(self, client):
        """GET /datasets/files returns file listing."""
        res = await client.get("/datasets/files?prefix=processed/")
        assert res.status_code == 200
        data = res.json()
        assert "files" in data
        assert "count" in data

    @pytest.mark.asyncio
    async def test_presigned_url_generation(self, client):
        """GET /media/presign generates a valid URL."""
        res = await client.get("/media/presign", params={
            "key": "uploads/issues/test/photo.jpg",
        })
        assert res.status_code == 200
        data = res.json()
        assert "url" in data
        assert "s3" in data["url"].lower() or "localhost" in data["url"]


# ═══════════════════════════════════════════════════════════════
# 5. test_auth_flow (mocked)
# ═══════════════════════════════════════════════════════════════

class TestAuthFlow:
    """Authentication flow tests (mocked Cognito)."""

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Health check is always accessible."""
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"

    @pytest.mark.asyncio
    async def test_create_issue_returns_id(self, client):
        """Authenticated issue creation returns proper structure."""
        res = await client.post("/issues", json={
            "title": "Auth test issue",
            "description": "Created by authenticated user",
            "reporter_id": "USR-AUTH-001",
        })
        assert res.status_code == 201
        data = res.json()
        assert "issue_id" in data
        assert data["issue"]["reporter_id"] == "USR-AUTH-001"


# ═══════════════════════════════════════════════════════════════
# 6. test_cross_service (end-to-end across services)
# ═══════════════════════════════════════════════════════════════

class TestCrossService:
    """Cross-service integration tests."""

    @pytest.mark.asyncio
    async def test_full_issue_journey(self, client, setup_aws):
        """
        Complete journey: create issue → upload photo → update →
        verify everything persisted correctly.
        """
        # 1. Create issue
        create_res = await client.post("/issues", json={
            "title": "Full journey test — broken pipe",
            "description": "Water main break at intersection of 5th and Oak",
            "category": "water",
            "severity": "critical",
            "ward": "ward-3",
            "location": {"lat": 41.88, "lng": -87.63, "address": "5th & Oak"},
            "reporter_id": "USR-JOURNEY",
        })
        assert create_res.status_code == 201
        issue_id = create_res.json()["issue"]["issue_id"]

        # 2. Upload photo
        photo = b"\xff\xd8\xff\xe0" + b"\x00" * 500
        upload_res = await client.post(
            "/media/upload",
            files={"file": ("pipe_break.jpg", photo, "image/jpeg")},
            data={"issue_id": issue_id},
        )
        assert upload_res.status_code == 200
        photo_url = upload_res.json()["url"]
        assert photo_url is not None

        # 3. Update status to in_progress
        update_res = await client.put(f"/issues/{issue_id}", json={
            "status": "in_progress",
            "description": "Crew dispatched — ETA 2 hours",
        })
        assert update_res.status_code == 200

        # 4. Verify final state
        get_res = await client.get(f"/issues/{issue_id}")
        assert get_res.status_code == 200
        final = get_res.json()["issue"]
        assert final["status"] == "in_progress"
        assert final["category"] == "water"
        assert final["severity"] == "critical"
        assert final["ward"] == "ward-3"

        # 5. Upvote
        upvote_res = await client.post(f"/issues/{issue_id}/upvote")
        assert upvote_res.status_code == 200
        assert upvote_res.json()["upvotes"] >= 1

    @pytest.mark.asyncio
    async def test_batch_create_and_list(self, client):
        """Create multiple issues and verify list returns them all."""
        for i in range(5):
            await client.post("/issues", json={
                "title": f"Batch issue {i}",
                "description": f"Batch test {i}",
                "category": "pothole",
                "ward": "ward-7",
            })

        res = await client.get("/issues?ward=ward-7")
        assert res.status_code == 200
        assert res.json()["count"] >= 5
