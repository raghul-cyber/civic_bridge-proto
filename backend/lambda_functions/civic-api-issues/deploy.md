# civic-api-issues — Deployment & Test

## CLI Deployment

```bash
# 1. Create IAM execution role
aws iam create-role \
  --role-name civic-api-issues-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }'

# 2. Attach custom policy
aws iam put-role-policy \
  --role-name civic-api-issues-role \
  --policy-name civic-api-issues-policy \
  --policy-document file://iam_policy.json

# 3. Package
cd backend/lambda_functions/civic-api-issues
pip install -r requirements.txt -t package/
cp index.py package/
cd package && zip -r ../civic-api-issues.zip . && cd ..

# 4. Create Lambda
aws lambda create-function \
  --function-name civic-api-issues \
  --runtime python3.12 \
  --role arn:aws:iam::842533680239:role/civic-api-issues-role \
  --handler index.handler \
  --zip-file fileb://civic-api-issues.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{DYNAMO_TABLE_ISSUES=civic_issues,S3_BUCKET_MEDIA=civic-bridge-media-842533680239}"

# 5. Create API Gateway trigger
aws apigatewayv2 create-api \
  --name civic-issues-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:842533680239:function:civic-api-issues
```

## Test Event

```json
{
  "body": "{\"title\":\"Broken streetlight\",\"description\":\"Light out on Main St for 3 days\",\"category\":\"streetlight\",\"severity\":\"high\",\"ward\":\"ward-5\",\"location\":{\"lat\":41.8781,\"lng\":-87.6298,\"address\":\"123 Main St\"},\"reporter_id\":\"USR-001\",\"photos\":[\"photo1.jpg\",\"photo2.jpg\"]}"
}
```
