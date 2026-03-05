import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

def get_boto3_client(service_name: str):
    """
    Returns a connected Boto3 client for a given AWS service.
    """
    return boto3.client(
        service_name,
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

def get_dynamodb_resource():
    """
    Returns a connected Boto3 resource for DynamoDB.
    """
    return boto3.resource(
        "dynamodb",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

# DynamoDB Tables Configuration
DYNAMO_TABLE_ISSUES = os.getenv("DYNAMO_TABLE_ISSUES", "civic_issues")
DYNAMO_TABLE_USERS = os.getenv("DYNAMO_TABLE_USERS", "civic_users")
DYNAMO_TABLE_SERVICES = os.getenv("DYNAMO_TABLE_SERVICES", "civic_services")
DYNAMO_TABLE_DATASETS = os.getenv("DYNAMO_TABLE_DATASETS", "civic_datasets")

# S3 Buckets Configuration
S3_BUCKET_MEDIA = os.getenv("S3_BUCKET_MEDIA")
S3_BUCKET_DATASETS = os.getenv("S3_BUCKET_DATASETS")
