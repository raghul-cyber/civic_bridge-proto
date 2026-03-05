# civic-stt-process — Deployment & Test

## CLI Deployment

```bash
# 1. Create IAM role
aws iam create-role \
  --role-name civic-stt-process-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }'

# 2. Attach policy
aws iam put-role-policy \
  --role-name civic-stt-process-role \
  --policy-name civic-stt-process-policy \
  --policy-document file://iam_policy.json

# 3. Package
cd backend/lambda_functions/civic-stt-process
pip install -r requirements.txt -t package/
cp index.py package/
cd package && zip -r ../civic-stt-process.zip . && cd ..

# 4. Create Lambda (timeout 300s for Transcribe polling)
aws lambda create-function \
  --function-name civic-stt-process \
  --runtime python3.12 \
  --role arn:aws:iam::842533680239:role/civic-stt-process-role \
  --handler index.handler \
  --zip-file fileb://civic-stt-process.zip \
  --timeout 300 \
  --memory-size 256 \
  --environment Variables="{DYNAMO_TABLE_ISSUES=civic_issues}"

# 5. Add S3 trigger
aws s3api put-bucket-notification-configuration \
  --bucket civic-bridge-media-842533680239 \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:842533680239:function:civic-stt-process",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {"Key": {"FilterRules": [{"Name": "prefix", "Value": "audio/uploads/"}]}}
    }]
  }'

# 6. Grant S3 permission to invoke Lambda
aws lambda add-permission \
  --function-name civic-stt-process \
  --statement-id s3-trigger \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::civic-bridge-media-842533680239
```

## Test Event

```json
{
  "Records": [
    {
      "s3": {
        "bucket": { "name": "civic-bridge-media-842533680239" },
        "object": { "key": "audio/uploads/ISS-A1B2C3D4/recording.en.wav" }
      }
    }
  ]
}
```
