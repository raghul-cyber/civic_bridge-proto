#!/bin/bash
# ============================================================
# CivicBridge — API Gateway Setup Script
# Account: 842533680239 | Region: us-east-1
# Creates REST API, imports OpenAPI spec, configures Cognito
# authorizer, CORS, throttling, logging, usage plans.
# ============================================================
set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID="842533680239"
API_NAME="civic-bridge-api"
STAGE="prod"
COGNITO_POOL_ARN="arn:aws:cognito-idp:us-east-1:842533680239:userpool/us-east-1_XXXXXXXXX"  # ← update
AMPLIFY_DOMAIN="https://*.amplifyapp.com"

echo "=== CivicBridge API Gateway Setup ==="

# ─────────────────────────────────────────
# 1. Create REST API by importing OpenAPI
# ─────────────────────────────────────────
echo "[1/8] Creating REST API from OpenAPI spec..."

API_ID=$(aws apigateway import-rest-api \
  --body fileb://infrastructure/openapi.yaml \
  --fail-on-warnings \
  --query 'id' --output text \
  --region "$REGION")

echo "  API ID: $API_ID"

# ─────────────────────────────────────────
# 2. Create Cognito Authorizer
# ─────────────────────────────────────────
echo "[2/8] Creating Cognito authorizer..."

AUTH_ID=$(aws apigateway create-authorizer \
  --rest-api-id "$API_ID" \
  --name CivicBridgeCognitoAuth \
  --type COGNITO_USER_POOLS \
  --provider-arns "$COGNITO_POOL_ARN" \
  --identity-source "method.request.header.Authorization" \
  --query 'id' --output text \
  --region "$REGION")

echo "  Authorizer ID: $AUTH_ID"

# ─────────────────────────────────────────
# 3. Enable CORS for all routes
# ─────────────────────────────────────────
echo "[3/8] Configuring CORS..."

# Get all resources
RESOURCES=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --query 'items[].id' --output text \
  --region "$REGION")

for RESOURCE_ID in $RESOURCES; do
  # Add OPTIONS method for CORS preflight
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" 2>/dev/null || true

  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --region "$REGION" 2>/dev/null || true

  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Origin": false
    }' \
    --region "$REGION" 2>/dev/null || true

  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "{
      \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,Authorization,X-Api-Key,X-Request-ID'\",
      \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,PUT,DELETE,OPTIONS'\",
      \"method.response.header.Access-Control-Allow-Origin\": \"'$AMPLIFY_DOMAIN'\"
    }" \
    --region "$REGION" 2>/dev/null || true
done

echo "  CORS configured for all resources"

# ─────────────────────────────────────────
# 4. Enable CloudWatch Access Logging
# ─────────────────────────────────────────
echo "[4/8] Setting up CloudWatch logging..."

# Create log group
aws logs create-log-group \
  --log-group-name "/aws/apigateway/civic-bridge-api" \
  --region "$REGION" 2>/dev/null || true

# Ensure API Gateway has CloudWatch role
APIGW_ROLE_ARN=$(aws iam get-role --role-name AmazonAPIGatewayPushToCloudWatchLogs \
  --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$APIGW_ROLE_ARN" ]; then
  aws iam create-role \
    --role-name AmazonAPIGatewayPushToCloudWatchLogs \
    --assume-role-policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Principal":{"Service":"apigateway.amazonaws.com"},"Action":"sts:AssumeRole"}]
    }'
  aws iam attach-role-policy \
    --role-name AmazonAPIGatewayPushToCloudWatchLogs \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
  APIGW_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/AmazonAPIGatewayPushToCloudWatchLogs"
  sleep 10
fi

aws apigateway update-account \
  --patch-operations "op=replace,path=/cloudwatchRoleArn,value=$APIGW_ROLE_ARN" \
  --region "$REGION"

# ─────────────────────────────────────────
# 5. Deploy to prod stage
# ─────────────────────────────────────────
echo "[5/8] Deploying to stage: $STAGE..."

DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --stage-description "Production deployment" \
  --description "Initial deployment" \
  --query 'id' --output text \
  --region "$REGION")

# Enable access logging on stage
LOG_GROUP_ARN="arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/apigateway/civic-bridge-api"
aws apigateway update-stage \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --patch-operations \
    "op=replace,path=/accessLogSettings/destinationArn,value=$LOG_GROUP_ARN" \
    "op=replace,path=/accessLogSettings/format,value='{\"requestId\":\"\$context.requestId\",\"ip\":\"\$context.identity.sourceIp\",\"method\":\"\$context.httpMethod\",\"path\":\"\$context.resourcePath\",\"status\":\"\$context.status\",\"latency\":\"\$context.responseLatency\"}'" \
  --region "$REGION"

echo "  Deployed: https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

# ─────────────────────────────────────────
# 6. Set Throttling
# ─────────────────────────────────────────
echo "[6/8] Configuring throttling..."

aws apigateway update-stage \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --patch-operations \
    "op=replace,path=/*/*/throttling/burstLimit,value=1000" \
    "op=replace,path=/*/*/throttling/rateLimit,value=500" \
  --region "$REGION"

echo "  Throttle: 1000 burst / 500 steady req/s"

# ─────────────────────────────────────────
# 7. Usage Plan + API Key (admin endpoints)
# ─────────────────────────────────────────
echo "[7/8] Creating usage plan and API key..."

USAGE_PLAN_ID=$(aws apigateway create-usage-plan \
  --name CivicBridgeAdminPlan \
  --description "Admin access with higher limits" \
  --api-stages "apiId=$API_ID,stage=$STAGE" \
  --throttle burstLimit=2000,rateLimit=1000 \
  --quota limit=100000,period=MONTH \
  --query 'id' --output text \
  --region "$REGION")

API_KEY_ID=$(aws apigateway create-api-key \
  --name civic-bridge-admin-key \
  --enabled \
  --query 'id' --output text \
  --region "$REGION")

aws apigateway create-usage-plan-key \
  --usage-plan-id "$USAGE_PLAN_ID" \
  --key-id "$API_KEY_ID" \
  --key-type API_KEY \
  --region "$REGION"

API_KEY_VALUE=$(aws apigateway get-api-key \
  --api-key "$API_KEY_ID" \
  --include-value \
  --query 'value' --output text \
  --region "$REGION")

echo "  Admin API Key: $API_KEY_VALUE"
echo "  ⚠  Store this key securely!"

# ─────────────────────────────────────────
# 8. Lambda Permissions
# ─────────────────────────────────────────
echo "[8/8] Granting API Gateway → Lambda invoke permissions..."

LAMBDA_FUNCTIONS=(
  "civic-api-issues"
  "civic-api-services"
  "civic-stt-process"
  "civic-tts-cache"
  "civic-export"
  "civic-auth"
)

for FUNC in "${LAMBDA_FUNCTIONS[@]}"; do
  aws lambda add-permission \
    --function-name "$FUNC" \
    --statement-id "apigw-invoke-${FUNC}" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region "$REGION" 2>/dev/null || echo "  Permission for $FUNC already exists"
done

echo ""
echo "=== API Gateway Setup Complete ==="
echo "API URL:  https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
echo "API ID:   $API_ID"
echo "Stage:    $STAGE"
