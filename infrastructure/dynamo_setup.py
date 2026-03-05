import os
import logging
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

dynamodb = boto3.client("dynamodb", region_name=AWS_REGION)

# ═══════════════════════════════════════════════════════════════
# Table Definitions
# ═══════════════════════════════════════════════════════════════

TABLE_DEFINITIONS = [
    # ── civic_users ──
    {
        "TableName": "civic_users",
        "KeySchema": [
            {"AttributeName": "user_id", "KeyType": "HASH"},
            {"AttributeName": "email", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "email", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "email-index",
                "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    },
    # ── civic_issues ──
    {
        "TableName": "civic_issues",
        "KeySchema": [
            {"AttributeName": "issue_id", "KeyType": "HASH"},
            {"AttributeName": "reported_date", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "issue_id", "AttributeType": "S"},
            {"AttributeName": "reported_date", "AttributeType": "S"},
            {"AttributeName": "ward", "AttributeType": "S"},
            {"AttributeName": "status", "AttributeType": "S"},
            {"AttributeName": "category", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
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
    },
    # ── civic_services ──
    {
        "TableName": "civic_services",
        "KeySchema": [
            {"AttributeName": "service_id", "KeyType": "HASH"},
            {"AttributeName": "category", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "service_id", "AttributeType": "S"},
            {"AttributeName": "category", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "category-index",
                "KeySchema": [{"AttributeName": "category", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    },
    # ── civic_datasets ──
    {
        "TableName": "civic_datasets",
        "KeySchema": [
            {"AttributeName": "dataset_name", "KeyType": "HASH"},
            {"AttributeName": "version", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "dataset_name", "AttributeType": "S"},
            {"AttributeName": "version", "AttributeType": "S"},
        ],
    },
    # ── civic_demographics ──
    {
        "TableName": "civic_demographics",
        "KeySchema": [
            {"AttributeName": "county_fips", "KeyType": "HASH"},
            {"AttributeName": "year", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "county_fips", "AttributeType": "S"},
            {"AttributeName": "year", "AttributeType": "N"},
        ],
    },
    # ── civic_budget ──
    {
        "TableName": "civic_budget",
        "KeySchema": [
            {"AttributeName": "award_id", "KeyType": "HASH"},
            {"AttributeName": "fiscal_year", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "award_id", "AttributeType": "S"},
            {"AttributeName": "fiscal_year", "AttributeType": "N"},
        ],
    },
    # ── civic_environment ──
    {
        "TableName": "civic_environment",
        "KeySchema": [
            {"AttributeName": "location_id", "KeyType": "HASH"},
            {"AttributeName": "timestamp", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "location_id", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
    },
    # ── civic_hazards ──
    {
        "TableName": "civic_hazards",
        "KeySchema": [
            {"AttributeName": "zone_id", "KeyType": "HASH"},
            {"AttributeName": "state", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "zone_id", "AttributeType": "S"},
            {"AttributeName": "state", "AttributeType": "S"},
        ],
    },
    # ── civic_feedback ──
    {
        "TableName": "civic_feedback",
        "KeySchema": [
            {"AttributeName": "feedback_id", "KeyType": "HASH"},
            {"AttributeName": "created_at", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "feedback_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
    },
]


def _table_exists(table_name: str) -> bool:
    """Check if a DynamoDB table already exists."""
    try:
        dynamodb.describe_table(TableName=table_name)
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            return False
        raise


def _enable_pitr(table_name: str):
    """Enable Point-in-Time Recovery on a table."""
    try:
        dynamodb.update_continuous_backups(
            TableName=table_name,
            PointInTimeRecoverySpecification={"PointInTimeRecoveryEnabled": True},
        )
        logger.info(f"  PITR enabled for {table_name}")
    except Exception as e:
        logger.warning(f"  Could not enable PITR for {table_name}: {e}")


def create_all_tables():
    """
    Creates all CivicBridge DynamoDB tables if they don't already exist.
    Uses PAY_PER_REQUEST billing and enables PITR on every table.
    """
    results = {}

    for defn in TABLE_DEFINITIONS:
        table_name = defn["TableName"]

        if _table_exists(table_name):
            logger.info(f"[SKIP] {table_name} already exists.")
            results[table_name] = "already_exists"
            continue

        create_params = {
            "TableName": table_name,
            "KeySchema": defn["KeySchema"],
            "AttributeDefinitions": defn["AttributeDefinitions"],
            "BillingMode": "PAY_PER_REQUEST",
        }

        if "GlobalSecondaryIndexes" in defn:
            create_params["GlobalSecondaryIndexes"] = defn["GlobalSecondaryIndexes"]

        try:
            dynamodb.create_table(**create_params)
            logger.info(f"[CREATED] {table_name}")

            # Wait until table is active before enabling PITR
            waiter = dynamodb.get_waiter("table_exists")
            waiter.wait(TableName=table_name)

            _enable_pitr(table_name)
            results[table_name] = "created"

        except Exception as e:
            logger.error(f"[ERROR] Failed to create {table_name}: {e}")
            results[table_name] = f"error: {e}"

    return results


if __name__ == "__main__":
    print("Creating all CivicBridge DynamoDB tables...")
    summary = create_all_tables()
    print("\nSummary:")
    for table, status in summary.items():
        print(f"  {table}: {status}")
