# civic-dataset-ingest — Deployment & Test

## CLI Deployment

```bash
# 1. Create IAM role
aws iam create-role \
  --role-name civic-dataset-ingest-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }'

# 2. Attach policy
aws iam put-role-policy \
  --role-name civic-dataset-ingest-role \
  --policy-name civic-dataset-ingest-policy \
  --policy-document file://iam_policy.json

# 3. Package (pandas is large — use Lambda layer or Docker image)
cd backend/lambda_functions/civic-dataset-ingest
pip install -r requirements.txt -t package/
cp index.py package/
cd package && zip -r ../civic-dataset-ingest.zip . && cd ..

# 4. Create Lambda (timeout 900s = 15 min max, 512 MB for pandas)
aws lambda create-function \
  --function-name civic-dataset-ingest \
  --runtime python3.12 \
  --role arn:aws:iam::842533680239:role/civic-dataset-ingest-role \
  --handler index.handler \
  --zip-file fileb://civic-dataset-ingest.zip \
  --timeout 900 \
  --memory-size 512 \
  --environment Variables="{S3_BUCKET_DATASETS=civic-bridge-datasets-842533680239}"

# 5. Create EventBridge daily schedule (2 AM UTC)
aws scheduler create-schedule \
  --name civic-dataset-daily-ingest \
  --schedule-expression "cron(0 2 * * ? *)" \
  --flexible-time-window '{"Mode":"OFF"}' \
  --target '{
    "Arn": "arn:aws:lambda:us-east-1:842533680239:function:civic-dataset-ingest",
    "RoleArn": "arn:aws:iam::842533680239:role/civic-dataset-ingest-role"
  }'
```

## Test Event

```json
{
  "source": "aws.scheduler",
  "detail-type": "Scheduled Event",
  "detail": {}
}
```
