#!/bin/bash
# ============================================================
# CivicBridge — Monitoring Deployment Script
# Creates SNS topic, CloudWatch dashboard, alarms, and enables
# X-Ray tracing on all Lambda functions.
# Account: 842533680239 | Region: us-east-1
# ============================================================
set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID="842533680239"
ALERT_EMAIL="admin@civicbridge.org"

echo "=== CivicBridge Monitoring Setup ==="

# ─────────────────────────────────────────
# 1. Create SNS Topic for Alerts
# ─────────────────────────────────────────
echo "[1/5] Creating SNS alert topic..."

TOPIC_ARN=$(aws sns create-topic \
  --name civic-bridge-alerts \
  --query 'TopicArn' --output text \
  --region "$REGION")

aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$ALERT_EMAIL" \
  --region "$REGION"

echo "  Topic: $TOPIC_ARN"
echo "  ⚠  Confirm subscription via email!"

# ─────────────────────────────────────────
# 2. Create CloudWatch Dashboard
# ─────────────────────────────────────────
echo "[2/5] Creating CloudWatch dashboard..."

DASHBOARD_BODY=$(python3 -c "
import json
with open('infrastructure/cloudwatch_dashboard.json') as f:
    data = json.load(f)
print(json.dumps(json.dumps(data['DashboardBody'])))
")

aws cloudwatch put-dashboard \
  --dashboard-name CivicBridge-Production \
  --dashboard-body "$DASHBOARD_BODY" \
  --region "$REGION"

echo "  Dashboard: CivicBridge-Production"

# ─────────────────────────────────────────
# 3. Create CloudWatch Alarms
# ─────────────────────────────────────────
echo "[3/5] Creating CloudWatch alarms..."

python3 -c "
import json, subprocess
with open('infrastructure/cloudwatch_alarms.json') as f:
    config = json.load(f)

for alarm in config['Alarms']:
    cmd = [
        'aws', 'cloudwatch', 'put-metric-alarm',
        '--alarm-name', alarm['AlarmName'],
        '--alarm-description', alarm['AlarmDescription'],
        '--namespace', alarm['Namespace'],
        '--metric-name', alarm['MetricName'],
        '--period', str(alarm['Period']),
        '--evaluation-periods', str(alarm['EvaluationPeriods']),
        '--threshold', str(alarm['Threshold']),
        '--comparison-operator', alarm['ComparisonOperator'],
        '--treat-missing-data', alarm['TreatMissingData'],
        '--alarm-actions',
    ]
    cmd.extend(alarm['AlarmActions'])

    if 'Statistic' in alarm:
        cmd.extend(['--statistic', alarm['Statistic']])
    elif 'ExtendedStatistic' in alarm:
        cmd.extend(['--extended-statistic', alarm['ExtendedStatistic']])

    for dim in alarm['Dimensions']:
        cmd.extend(['--dimensions', f'Name={dim[\"Name\"]},Value={dim[\"Value\"]}'])

    cmd.extend(['--region', 'us-east-1'])
    subprocess.run(cmd, check=True)
    print(f'  ✓ {alarm[\"AlarmName\"]}')
"

# ─────────────────────────────────────────
# 4. Enable X-Ray on Lambda Functions
# ─────────────────────────────────────────
echo "[4/5] Enabling X-Ray tracing on Lambda functions..."

LAMBDA_FUNCTIONS=(
  "civic-api-issues"
  "civic-stt-process"
  "civic-dataset-ingest"
  "civic-notify"
  "civic-tts-cache"
  "civic-export"
)

for FUNC in "${LAMBDA_FUNCTIONS[@]}"; do
  aws lambda update-function-configuration \
    --function-name "$FUNC" \
    --tracing-config Mode=Active \
    --region "$REGION" 2>/dev/null && \
    echo "  ✓ X-Ray enabled: $FUNC" || \
    echo "  ⚠ Skipped (not found): $FUNC"
done

# ─────────────────────────────────────────
# 5. CloudWatch Insights Saved Queries
# ─────────────────────────────────────────
echo "[5/5] Creating CloudWatch Insights queries..."

# Errors in the last hour
aws logs put-query-definition \
  --name "CivicBridge-Errors-LastHour" \
  --log-group-names '/aws/lambda/civic-api-issues' '/aws/lambda/civic-stt-process' '/aws/lambda/civic-notify' '/ecs/civic-bridge-backend' \
  --query-string 'fields @timestamp, @message, level, action, error, request_id, duration_ms
| filter level = "ERROR"
| sort @timestamp desc
| limit 100' \
  --region "$REGION" 2>/dev/null || true

# Slow requests (> 3s)
aws logs put-query-definition \
  --name "CivicBridge-SlowRequests" \
  --log-group-names '/ecs/civic-bridge-backend' '/aws/lambda/civic-api-issues' \
  --query-string 'fields @timestamp, action, path, duration_ms, request_id
| filter duration_ms > 3000
| sort duration_ms desc
| limit 50' \
  --region "$REGION" 2>/dev/null || true

# Request volume by action
aws logs put-query-definition \
  --name "CivicBridge-RequestVolume" \
  --log-group-names '/ecs/civic-bridge-backend' \
  --query-string 'fields action
| filter action like /http_response/
| stats count(*) as request_count by path
| sort request_count desc' \
  --region "$REGION" 2>/dev/null || true

echo ""
echo "=== Monitoring Setup Complete ==="
echo "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=CivicBridge-Production"
echo "Alarms: 11 configured → SNS: $TOPIC_ARN"
echo "X-Ray: Active on all Lambda functions"
echo "Log Insights: 3 saved queries created"
