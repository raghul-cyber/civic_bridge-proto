import os
import sys
import pytest
import boto3
from moto import mock_aws

# Add backend directory to sys.path so tests can import from 'services.x', etc.
backend_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.insert(0, os.path.abspath(backend_dir))

@pytest.fixture(scope='session', autouse=True)
def aws_credentials():
    os.environ.update({
        'AWS_ACCESS_KEY_ID': 'testing',
        'AWS_SECRET_ACCESS_KEY': 'testing',
        'AWS_SECURITY_TOKEN': 'testing',
        'AWS_SESSION_TOKEN': 'testing',
        'AWS_DEFAULT_REGION': 'us-east-1',
        'AWS_REGION': 'us-east-1',
        'DYNAMO_TABLE_ISSUES': 'test_civic_issues',
        'DYNAMO_TABLE_USERS': 'test_civic_users',
        'S3_BUCKET_MEDIA': 'test-civic-media',
        'S3_BUCKET_DATASETS': 'test-civic-datasets',
        'WHISPER_MODEL': 'base',
        'AWS_POLLY_VOICE': 'Joanna',
        'USE_SECRETS_MANAGER': 'false'
    })

@pytest.fixture
def dynamo_tables(aws_credentials):
    with mock_aws():
        client = boto3.resource('dynamodb', region_name='us-east-1')
        
        # Create test_civic_issues table
        client.create_table(
            TableName='test_civic_issues',
            KeySchema=[
                {'AttributeName': 'issue_id', 'KeyType': 'HASH'},
                {'AttributeName': 'reported_date', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'issue_id', 'AttributeType': 'S'},
                {'AttributeName': 'reported_date', 'AttributeType': 'S'},
                {'AttributeName': 'ward', 'AttributeType': 'S'},
                {'AttributeName': 'status', 'AttributeType': 'S'},
                {'AttributeName': 'category', 'AttributeType': 'S'},
            ],
            BillingMode='PAY_PER_REQUEST',
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
            ]
        )
        
        # Create test_civic_users table
        client.create_table(
            TableName='test_civic_users',
            KeySchema=[
                {'AttributeName': 'user_id', 'KeyType': 'HASH'},
                {'AttributeName': 'email', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'user_id', 'AttributeType': 'S'},
                {'AttributeName': 'email', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        yield client

@pytest.fixture
def s3_buckets(aws_credentials):
    with mock_aws():
        s3 = boto3.client('s3', region_name='us-east-1')
        s3.create_bucket(Bucket='test-civic-media')
        s3.create_bucket(Bucket='test-civic-datasets')
        yield s3
