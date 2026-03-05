import os
import logging
from decimal import Decimal
from typing import Any
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")


def _get_dynamodb_resource():
    """Returns a configured DynamoDB resource."""
    kwargs = {"region_name": AWS_REGION}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
    return boto3.resource("dynamodb", **kwargs)


class DynamoService:
    """
    Generic DynamoDB CRUD service for CivicBridge.

    Every method accepts the table name as the first argument so a single
    instance can operate across all nine CivicBridge tables.
    """

    def __init__(self):
        self.dynamodb = _get_dynamodb_resource()

    def _table(self, table_name: str):
        return self.dynamodb.Table(table_name)

    # ─────────────────────────────────────────
    # Single-item operations
    # ─────────────────────────────────────────

    def get_item(self, table: str, pk: dict, sk: dict) -> dict | None:
        """
        Fetches a single item by composite key.

        Args:
            table: Table name.
            pk:    Partition key dict, e.g. {"issue_id": "ISS-001"}.
            sk:    Sort key dict, e.g. {"reported_date": "2024-06-01"}.

        Returns:
            Item dict or None if not found.
        """
        try:
            key = {**pk, **sk}
            response = self._table(table).get_item(Key=key)
            return response.get("Item")
        except ClientError as e:
            logger.error(f"get_item failed on {table}: {e}")
            return None

    def put_item(self, table: str, item: dict) -> bool:
        """Writes a single item. Returns True on success."""
        try:
            # Convert floats to Decimal (DynamoDB requirement)
            cleaned = _sanitize_item(item)
            self._table(table).put_item(Item=cleaned)
            return True
        except ClientError as e:
            logger.error(f"put_item failed on {table}: {e}")
            return False

    def update_item(self, table: str, pk: dict, sk: dict, updates: dict) -> bool:
        """
        Updates specific attributes on an existing item.

        Args:
            updates: dict of attribute_name -> new_value.
        """
        if not updates:
            return True

        expr_parts = []
        expr_names = {}
        expr_values = {}

        for i, (attr, val) in enumerate(updates.items()):
            placeholder_name = f"#attr{i}"
            placeholder_val = f":val{i}"
            expr_parts.append(f"{placeholder_name} = {placeholder_val}")
            expr_names[placeholder_name] = attr
            expr_values[placeholder_val] = _sanitize_value(val)

        update_expr = "SET " + ", ".join(expr_parts)
        key = {**pk, **sk}

        try:
            self._table(table).update_item(
                Key=key,
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
            )
            return True
        except ClientError as e:
            logger.error(f"update_item failed on {table}: {e}")
            return False

    def delete_item(self, table: str, pk: dict, sk: dict) -> bool:
        """Deletes a single item. Returns True on success."""
        try:
            key = {**pk, **sk}
            self._table(table).delete_item(Key=key)
            return True
        except ClientError as e:
            logger.error(f"delete_item failed on {table}: {e}")
            return False

    # ─────────────────────────────────────────
    # Query operations
    # ─────────────────────────────────────────

    def query_by_pk(
        self, table: str, pk_name: str, pk_value: str,
        sk_name: str = None, sk_prefix: str = None, limit: int = 50
    ) -> list:
        """
        Queries items by partition key, with optional sort-key prefix.
        """
        try:
            key_condition = Key(pk_name).eq(pk_value)
            if sk_name and sk_prefix:
                key_condition = key_condition & Key(sk_name).begins_with(sk_prefix)

            response = self._table(table).query(
                KeyConditionExpression=key_condition,
                Limit=limit,
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"query_by_pk failed on {table}: {e}")
            return []

    def query_by_gsi(
        self, table: str, gsi_name: str,
        key_name: str, key_value: str, limit: int = 50
    ) -> list:
        """
        Queries items via a Global Secondary Index.
        """
        try:
            response = self._table(table).query(
                IndexName=gsi_name,
                KeyConditionExpression=Key(key_name).eq(key_value),
                Limit=limit,
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"query_by_gsi failed on {table}: {e}")
            return []

    # ─────────────────────────────────────────
    # Batch / Scan
    # ─────────────────────────────────────────

    def batch_write(self, table: str, items: list[dict]) -> int:
        """
        Batch-writes items in chunks of 25.
        Returns the number of items successfully queued.
        """
        tbl = self._table(table)
        written = 0
        try:
            with tbl.batch_writer() as batch:
                for item in items:
                    batch.put_item(Item=_sanitize_item(item))
                    written += 1
            return written
        except ClientError as e:
            logger.error(f"batch_write failed on {table}: {e}")
            return written

    def scan_table(
        self, table: str, filter_expr=None, limit: int = 100
    ) -> list:
        """
        Scans the table (expensive — use sparingly).

        Args:
            filter_expr: A boto3 Attr condition, e.g. Attr("status").eq("open").
        """
        try:
            params: dict[str, Any] = {"Limit": limit}
            if filter_expr is not None:
                params["FilterExpression"] = filter_expr

            response = self._table(table).scan(**params)
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"scan_table failed on {table}: {e}")
            return []


# ── Helpers ──

def _sanitize_value(val):
    """Convert Python float → Decimal for DynamoDB."""
    if isinstance(val, float):
        return Decimal(str(val))
    if isinstance(val, dict):
        return {k: _sanitize_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_sanitize_value(v) for v in val]
    return val


def _sanitize_item(item: dict) -> dict:
    """Recursively convert floats and strip empty strings."""
    return {
        k: _sanitize_value(v)
        for k, v in item.items()
        if v != "" and v is not None
    }


# Singleton
dynamo_service = DynamoService()
