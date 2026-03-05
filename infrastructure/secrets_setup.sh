#!/bin/bash
# ============================================================
# CivicBridge — Secrets Manager Setup
# Account: 842533680239 | Region: us-east-1
# Creates and manages all application secrets.
# ============================================================
set -euo pipefail

REGION="us-east-1"
SECRET_ID="civic-bridge/prod"

echo "=== CivicBridge Secrets Manager Setup ==="

# ─────────────────────────────────────────
# 1. Create the main application secret
# ─────────────────────────────────────────
echo "[1/3] Creating application secret..."

aws secretsmanager create-secret \
  --name "$SECRET_ID" \
  --description "CivicBridge production environment secrets" \
  --secret-string '{
    "AWS_REGION": "us-east-1",
    "AWS_ACCOUNT_ID": "842533680239",
    "DYNAMO_TABLE_ISSUES": "civic_issues",
    "DYNAMO_TABLE_USERS": "civic_users",
    "DYNAMO_TABLE_SERVICES": "civic_services",
    "DYNAMO_TABLE_DATASETS": "civic_datasets",
    "DYNAMO_TABLE_DEMOGRAPHICS": "civic_demographics",
    "DYNAMO_TABLE_BUDGET": "civic_budget",
    "DYNAMO_TABLE_ENVIRONMENT": "civic_environment",
    "DYNAMO_TABLE_HAZARDS": "civic_hazards",
    "DYNAMO_TABLE_FEEDBACK": "civic_feedback",
    "S3_BUCKET_MEDIA": "civic-bridge-media-842533680239",
    "S3_BUCKET_DATASETS": "civic-bridge-datasets-842533680239",
    "CENSUS_API_KEY": "",
    "OPENAQ_API_KEY": "",
    "ANTHROPIC_API_KEY": "",
    "WHISPER_MODEL": "base",
    "AWS_POLLY_VOICE": "Joanna",
    "AWS_TRANSCRIBE_LANG": "en-US",
    "SES_SENDER_EMAIL": "noreply@civicbridge.org",
    "LOG_LEVEL": "INFO"
  }' \
  --region "$REGION" 2>/dev/null && echo "  ✓ Secret created" || echo "  Secret already exists — updating..."

# ─────────────────────────────────────────
# 2. Update existing secret (if already exists)
# ─────────────────────────────────────────
echo "[2/3] Verifying secret is readable..."

aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --query 'SecretString' \
  --output text \
  --region "$REGION" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  Keys loaded: {len(data)}')
for key in sorted(data.keys()):
    val = data[key]
    masked = val[:4] + '***' if len(val) > 4 else ('(empty)' if not val else '***')
    print(f'    {key} = {masked}')
"

# ─────────────────────────────────────────
# 3. Enable automatic rotation (optional)
# ─────────────────────────────────────────
echo "[3/3] Secret rotation info..."
echo "  To enable 30-day auto-rotation:"
echo "  aws secretsmanager rotate-secret \\"
echo "    --secret-id $SECRET_ID \\"
echo "    --rotation-lambda-arn arn:aws:lambda:$REGION:842533680239:function:civic-secret-rotator \\"
echo "    --rotation-rules AutomaticallyAfterDays=30"

echo ""
echo "=== Secrets Manager Setup Complete ==="
echo "Secret ID: $SECRET_ID"
echo ""
echo "To update a single key:"
echo "  aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | \\"
echo "    python3 -c 'import sys,json; d=json.load(sys.stdin); d[\"KEY\"]=\"VALUE\"; print(json.dumps(d))' | \\"
echo "    aws secretsmanager put-secret-value --secret-id $SECRET_ID --secret-string file:///dev/stdin"
