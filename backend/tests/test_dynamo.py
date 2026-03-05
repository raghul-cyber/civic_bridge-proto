import pytest
import boto3
from moto import mock_aws
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.dynamo_service import DynamoService
from api.issues_router import router

# ═══════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════

TABLE_NAME = "civic_issues"

@pytest.fixture
def aws_env(monkeypatch):
    """Set dummy AWS creds for moto."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("AWS_REGION", "us-east-1")


@pytest.fixture
def dynamo_table(aws_env):
    """Create a mocked civic_issues table."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        dynamodb.create_table(
            TableName=TABLE_NAME,
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
        yield dynamodb


@pytest.fixture
def service(dynamo_table):
    """Return a DynamoService wired to the mocked table."""
    svc = DynamoService()
    svc.dynamodb = dynamo_table
    return svc


@pytest.fixture
def sample_issue():
    return {
        "issue_id": "ISS-TEST001",
        "reported_date": "2024-06-15T10:30:00",
        "title": "Broken streetlight",
        "description": "Streetlight on Main St has been out for 3 days",
        "category": "streetlight",
        "ward": "ward-5",
        "status": "open",
        "severity": "high",
        "reporter_id": "USR-001",
        "photos": [],
        "ai_extracted": {},
        "upvotes": 0,
    }


# ═══════════════════════════════════════════════════════════════
# DynamoService Unit Tests
# ═══════════════════════════════════════════════════════════════

class TestDynamoServicePutGet:
    def test_put_and_get_item(self, service, sample_issue):
        result = service.put_item(TABLE_NAME, sample_issue)
        assert result is True

        item = service.get_item(
            TABLE_NAME,
            pk={"issue_id": "ISS-TEST001"},
            sk={"reported_date": "2024-06-15T10:30:00"},
        )
        assert item is not None
        assert item["title"] == "Broken streetlight"

    def test_get_nonexistent_item(self, service):
        item = service.get_item(
            TABLE_NAME,
            pk={"issue_id": "NOPE"},
            sk={"reported_date": "2024-01-01"},
        )
        assert item is None


class TestDynamoServiceUpdate:
    def test_update_item(self, service, sample_issue):
        service.put_item(TABLE_NAME, sample_issue)
        result = service.update_item(
            TABLE_NAME,
            pk={"issue_id": "ISS-TEST001"},
            sk={"reported_date": "2024-06-15T10:30:00"},
            updates={"status": "in_progress", "severity": "critical"},
        )
        assert result is True

        item = service.get_item(
            TABLE_NAME,
            pk={"issue_id": "ISS-TEST001"},
            sk={"reported_date": "2024-06-15T10:30:00"},
        )
        assert item["status"] == "in_progress"
        assert item["severity"] == "critical"


class TestDynamoServiceDelete:
    def test_delete_item(self, service, sample_issue):
        service.put_item(TABLE_NAME, sample_issue)
        result = service.delete_item(
            TABLE_NAME,
            pk={"issue_id": "ISS-TEST001"},
            sk={"reported_date": "2024-06-15T10:30:00"},
        )
        assert result is True

        item = service.get_item(
            TABLE_NAME,
            pk={"issue_id": "ISS-TEST001"},
            sk={"reported_date": "2024-06-15T10:30:00"},
        )
        assert item is None


class TestDynamoServiceQuery:
    def test_query_by_pk(self, service, sample_issue):
        service.put_item(TABLE_NAME, sample_issue)
        items = service.query_by_pk(TABLE_NAME, "issue_id", "ISS-TEST001")
        assert len(items) == 1
        assert items[0]["issue_id"] == "ISS-TEST001"

    def test_query_by_pk_no_results(self, service):
        items = service.query_by_pk(TABLE_NAME, "issue_id", "NOPE")
        assert items == []

    def test_query_by_gsi(self, service, sample_issue):
        service.put_item(TABLE_NAME, sample_issue)
        items = service.query_by_gsi(
            TABLE_NAME, "ward-status-index", "ward", "ward-5"
        )
        assert len(items) >= 1
        assert items[0]["ward"] == "ward-5"

    def test_query_by_category_gsi(self, service, sample_issue):
        service.put_item(TABLE_NAME, sample_issue)
        items = service.query_by_gsi(
            TABLE_NAME, "category-date-index", "category", "streetlight"
        )
        assert len(items) >= 1


class TestDynamoServiceBatchAndScan:
    def test_batch_write(self, service):
        items = [
            {
                "issue_id": f"ISS-BATCH{i}",
                "reported_date": f"2024-07-0{i}",
                "title": f"Issue {i}",
                "category": "pothole",
                "ward": "ward-3",
                "status": "open",
                "upvotes": 0,
            }
            for i in range(1, 6)
        ]
        count = service.batch_write(TABLE_NAME, items)
        assert count == 5

    def test_scan_table(self, service, sample_issue):
        service.put_item(TABLE_NAME, sample_issue)
        items = service.scan_table(TABLE_NAME, limit=100)
        assert len(items) >= 1


# ═══════════════════════════════════════════════════════════════
# Issues Router Integration Tests
# ═══════════════════════════════════════════════════════════════

@pytest.fixture
def client(dynamo_table):
    """FastAPI test client with mocked DynamoDB."""
    from services import dynamo_service as ds_module
    ds_module.dynamo_service.dynamodb = dynamo_table

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


class TestIssuesRouter:
    def test_create_issue(self, client):
        res = client.post("/issues", json={
            "title": "Pothole on 5th Ave",
            "description": "Large pothole near crosswalk",
            "category": "pothole",
            "ward": "ward-2",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["issue"]["title"] == "Pothole on 5th Ave"
        assert data["issue"]["status"] == "open"

    def test_get_issue(self, client):
        # Create first
        create_res = client.post("/issues", json={
            "title": "Test Issue",
            "description": "Test",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        res = client.get(f"/issues/{issue_id}")
        assert res.status_code == 200
        assert res.json()["issue"]["title"] == "Test Issue"

    def test_get_issue_not_found(self, client):
        res = client.get("/issues/NOPE")
        assert res.status_code == 404

    def test_update_issue(self, client):
        create_res = client.post("/issues", json={
            "title": "Update Test",
            "description": "Will update",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        res = client.put(f"/issues/{issue_id}", json={"status": "resolved"})
        assert res.status_code == 200
        assert res.json()["updates"]["status"] == "resolved"

    def test_delete_issue_no_auth(self, client):
        create_res = client.post("/issues", json={
            "title": "Del Test",
            "description": "Delete me",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        res = client.delete(f"/issues/{issue_id}")
        assert res.status_code == 403

    def test_delete_issue_with_auth(self, client):
        create_res = client.post("/issues", json={
            "title": "Del Auth Test",
            "description": "Delete with auth",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        res = client.delete(
            f"/issues/{issue_id}",
            headers={"Authorization": "Bearer admin-secret-token"},
        )
        assert res.status_code == 200

    def test_upvote_issue(self, client):
        create_res = client.post("/issues", json={
            "title": "Upvote Test",
            "description": "Upvote me",
        })
        issue_id = create_res.json()["issue"]["issue_id"]

        res = client.post(f"/issues/{issue_id}/upvote")
        assert res.status_code == 200
        assert res.json()["upvotes"] == 1

    def test_list_issues(self, client):
        client.post("/issues", json={"title": "A", "description": "a"})
        client.post("/issues", json={"title": "B", "description": "b"})

        res = client.get("/issues")
        assert res.status_code == 200
        assert res.json()["count"] >= 2
