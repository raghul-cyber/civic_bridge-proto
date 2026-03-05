# CivicBridge Pipeline: AWS Lambda Deployment Instructions

The following AWS CLI commands will help deploy the `backend/lambda_functions/seed_dynamo.py` function and attach the appropriate IAM policies for executing S3-to-DynamoDB batches.

### Step 1: Create the IAM Execution Role
Create a new role allowing Lambda to execute:

```bash
aws iam create-role --role-name CivicBridgeLambdaSeedRole --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}'
```

### Step 2: Create and Attach the Pipeline IAM Permissions
Create the specific execution policies mapped to your datasets and attach them to the execution role:
```bash
# Register the strict policy document
aws iam put-role-policy \
    --role-name CivicBridgeLambdaSeedRole \
    --policy-name CivicBridgeDynamoSeedPolicy \
    --policy-document file://backend/lambda_functions/lambda_iam_policy.json
```

### Step 3: Package the Lambda Function
Package the lambda script for deployment:
```bash
cd backend/lambda_functions
zip seed_dynamo.zip seed_dynamo.py
```

### Step 4: Deploy the Function
*Wait ~10 seconds after Step 2 to ensure IAM policy propagation before running this step.*
```bash
aws lambda create-function \
    --function-name civic-bridge-seed-dynamodb \
    --zip-file fileb://seed_dynamo.zip \
    --handler seed_dynamo.lambda_handler \
    --runtime python3.11 \
    --role arn:aws:iam::842533680239:role/CivicBridgeLambdaSeedRole \
    --timeout 300 \
    --memory-size 256
```

### Step 5: (Optional) Invoke the Function
You can manually test ingestion processing a single table, for instance, `chicago_311`:
```bash
aws lambda invoke \
    --function-name civic-bridge-seed-dynamodb \
    --payload '{"dataset": "chicago_311"}' \
    --cli-binary-format raw-in-base64-out \
    response.json
    
cat response.json
```
