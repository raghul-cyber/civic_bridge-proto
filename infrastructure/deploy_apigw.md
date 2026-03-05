# CivicBridge — Custom Domain & ACM Certificate Setup

## Step 1 — Request ACM Certificate

```bash
# Request certificate (must be in us-east-1 for API Gateway edge-optimized)
CERT_ARN=$(aws acm request-certificate \
  --domain-name api.civicbridge.app \
  --subject-alternative-names "*.civicbridge.app" \
  --validation-method DNS \
  --query 'CertificateArn' --output text \
  --region us-east-1)

echo "Certificate ARN: $CERT_ARN"

# Get DNS validation records
aws acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord' \
  --output table --region us-east-1

# → Add the CNAME records to your DNS provider, then wait for validation:
aws acm wait certificate-validated \
  --certificate-arn "$CERT_ARN" \
  --region us-east-1
echo "Certificate validated ✓"
```

## Step 2 — Create Custom Domain

```bash
aws apigateway create-domain-name \
  --domain-name api.civicbridge.app \
  --regional-certificate-arn "$CERT_ARN" \
  --endpoint-configuration types=REGIONAL \
  --security-policy TLS_1_2 \
  --region us-east-1

# Get the target domain for DNS
TARGET=$(aws apigateway get-domain-name \
  --domain-name api.civicbridge.app \
  --query 'regionalDomainName' --output text \
  --region us-east-1)

echo "Point DNS CNAME: api.civicbridge.app → $TARGET"
```

## Step 3 — Map Base Path to API Stage

```bash
API_ID="YOUR_API_ID"  # from apigw_setup.sh output

aws apigateway create-base-path-mapping \
  --domain-name api.civicbridge.app \
  --rest-api-id "$API_ID" \
  --stage prod \
  --region us-east-1
```

## Step 4 — DNS Configuration

Add these records to your DNS provider (Route 53, Cloudflare, etc.):

| Type  | Name                 | Value                                        |
|-------|----------------------|----------------------------------------------|
| CNAME | api.civicbridge.app  | `{regionalDomainName}` from Step 2           |
| CNAME | `_validation_record` | ACM validation value from Step 1             |

## Step 5 — Verify

```bash
# Wait for DNS propagation, then test
curl https://api.civicbridge.app/prod/health
# Expected: {"status":"ok","service":"civic-bridge-api"}
```

## Summary of All API Endpoints

| Method | Path                     | Auth       | Backend              |
|--------|--------------------------|------------|----------------------|
| GET    | /health                  | None       | Mock integration     |
| POST   | /auth/signup             | None       | civic-auth Lambda    |
| POST   | /auth/signin             | None       | civic-auth Lambda    |
| GET    | /issues                  | Cognito    | civic-api-issues     |
| POST   | /issues                  | Cognito    | civic-api-issues     |
| GET    | /issues/{id}             | Cognito    | civic-api-issues     |
| PUT    | /issues/{id}             | Cognito    | civic-api-issues     |
| DELETE | /issues/{id}             | Cognito+Key| civic-api-issues     |
| POST   | /issues/{id}/upvote      | Cognito    | civic-api-issues     |
| GET    | /services                | None       | civic-api-services   |
| GET    | /datasets/list           | Cognito    | FastAPI (VPC Link)   |
| GET    | /datasets/{name}         | Cognito    | FastAPI (VPC Link)   |
| POST   | /stt/transcribe          | Cognito    | FastAPI (VPC Link)   |
| POST   | /tts/synthesize          | Cognito    | civic-tts-cache      |
| POST   | /media/upload            | Cognito    | FastAPI (VPC Link)   |
| GET    | /export                  | Cognito    | civic-export Lambda  |
