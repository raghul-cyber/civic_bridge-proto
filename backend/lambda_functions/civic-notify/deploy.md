# civic-notify — Deployment & Test

## CLI Deployment

```bash
# 1. Create IAM role
aws iam create-role \
  --role-name civic-notify-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }'

# 2. Attach policy
aws iam put-role-policy \
  --role-name civic-notify-role \
  --policy-name civic-notify-policy \
  --policy-document file://iam_policy.json

# 3. Package
cd backend/lambda_functions/civic-notify
pip install -r requirements.txt -t package/
cp index.py package/
cd package && zip -r ../civic-notify.zip . && cd ..

# 4. Create Lambda
aws lambda create-function \
  --function-name civic-notify \
  --runtime python3.12 \
  --role arn:aws:iam::842533680239:role/civic-notify-role \
  --handler index.handler \
  --zip-file fileb://civic-notify.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables="{DYNAMO_TABLE_USERS=civic_users,S3_BUCKET_MEDIA=civic-bridge-media-842533680239,SES_SENDER_EMAIL=noreply@civicbridge.org}"

# 5. Enable DynamoDB Streams on civic_issues
aws dynamodb update-table \
  --table-name civic_issues \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# 6. Get Stream ARN
STREAM_ARN=$(aws dynamodb describe-table --table-name civic_issues \
  --query 'Table.LatestStreamArn' --output text)

# 7. Create event source mapping
aws lambda create-event-source-mapping \
  --function-name civic-notify \
  --event-source-arn "$STREAM_ARN" \
  --batch-size 10 \
  --starting-position LATEST

# 8. Verify SES sender email
aws ses verify-email-identity --email-address noreply@civicbridge.org
```

## Test Event

```json
{
  "Records": [
    {
      "eventName": "MODIFY",
      "dynamodb": {
        "OldImage": {
          "issue_id": {"S": "ISS-A1B2C3D4"},
          "reported_date": {"S": "2024-06-15T10:30:00"},
          "title": {"S": "Broken streetlight on Main St"},
          "status": {"S": "open"},
          "reporter_id": {"S": "USR-001"}
        },
        "NewImage": {
          "issue_id": {"S": "ISS-A1B2C3D4"},
          "reported_date": {"S": "2024-06-15T10:30:00"},
          "title": {"S": "Broken streetlight on Main St"},
          "status": {"S": "in_progress"},
          "reporter_id": {"S": "USR-001"}
        }
      }
    }
  ]
}
```
