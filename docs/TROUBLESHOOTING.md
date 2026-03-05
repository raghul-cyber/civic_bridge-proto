# CivicBridge — Troubleshooting & FAQ

## Common Issues

### Lambda timeout on Whisper transcription
Whisper `base` model needs ~30s for 1-min audio. Lambda max timeout is 15 min.
```bash
aws lambda update-function-configuration \
  --function-name civic-stt-process \
  --timeout 900
```
**Better solution**: Route Whisper to EC2/ECS (`mode=whisper`), use Lambda only for AWS Transcribe (`mode=aws`).

---

### DynamoDB `ProvisionedThroughputExceededException`
All CivicBridge tables are `PAY_PER_REQUEST` — this shouldn't occur. If it does:
1. Check for **hot partitions** — add a random suffix to PK
2. Review write patterns in CloudWatch → DynamoDB → ThrottledRequests
3. Enable DAX caching for read-heavy tables:
```bash
aws dynamodb describe-table --table-name civic_issues \
  --query "Table.BillingModeSummary"
```

---

### Amplify build fails on Next.js export
Ensure `next.config.js` has:
```js
module.exports = { output: 'export', images: { unoptimized: true } }
```
Remove any server-side only APIs (`getServerSideProps`) from pages. Use `getStaticProps` or client-side fetching instead.

---

### CORS errors calling API Gateway
1. Add `OPTIONS` method to each resource in API Gateway
2. Run: `infrastructure/apigw_setup.sh` (Step 3 handles CORS)
3. Redeploy the stage:
```bash
aws apigateway create-deployment --rest-api-id API_ID --stage-name prod
```

---

### Polly returns `InternalFailure`
Text too long — max **3000 characters** per call. Split text:
```python
def chunk_text(text, max_len=2900):
    sentences = text.split('. ')
    chunks, current = [], ""
    for s in sentences:
        if len(current) + len(s) > max_len:
            chunks.append(current)
            current = s
        else:
            current += ". " + s if current else s
    if current: chunks.append(current)
    return chunks
```

---

### S3 upload 403 Forbidden
1. Check IAM role has `s3:PutObject` on the **exact bucket ARN**:
   ```
   arn:aws:s3:::civic-bridge-media-842533680239/*
   ```
2. Check bucket policy doesn't have explicit `Deny`
3. Verify CORS is configured on the bucket

---

### ECS tasks keep restarting
1. Check CloudWatch logs: `/ecs/civic-bridge-backend`
2. Common causes: missing env vars, health check failure, port mismatch
3. Add grace period:
```bash
aws ecs update-service --cluster civic-bridge-cluster \
  --service civic-backend-service \
  --health-check-grace-period-seconds 60
```

---

### Census API returns 400
Get a **free API key** from [api.census.gov](https://api.census.gov/data/key_signup.html), then:
```bash
aws secretsmanager get-secret-value --secret-id civic-bridge/prod \
  --query SecretString --output text | \
  python3 -c 'import sys,json; d=json.load(sys.stdin); d["CENSUS_API_KEY"]="YOUR_KEY"; print(json.dumps(d))' | \
  aws secretsmanager put-secret-value --secret-id civic-bridge/prod --secret-string file:///dev/stdin
```

---

### STT transcript returns empty string
Audio must be **WAV or FLAC** for AWS Transcribe. Convert MP3:
```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```
For Whisper, all common formats (mp3, wav, flac, m4a, ogg) are supported.

---

### Antigravity prompt too long
Split at each dashed line (`------`) and paste each sub-section separately.

---

## Quick Reference — AWS CLI Commands

```bash
# ── Logs ──
aws logs tail /aws/lambda/civic-api-issues --follow
aws logs tail /ecs/civic-bridge-backend --follow --since 1h

# ── Lambda ──
aws lambda invoke --function-name civic-dataset-ingest \
  --payload '{"dataset":"311"}' response.json && cat response.json

aws lambda invoke --function-name civic-api-issues \
  --payload file://test_event.json response.json

# ── DynamoDB ──
aws dynamodb describe-table --table-name civic_issues \
  --query "Table.ItemCount"

aws dynamodb scan --table-name civic_issues \
  --select COUNT

aws dynamodb query --table-name civic_issues \
  --key-condition-expression "issue_id = :id" \
  --expression-attribute-values '{":id":{"S":"ISS-ABC123"}}'

# ── S3 ──
aws s3 ls s3://civic-bridge-datasets-842533680239/processed/ --recursive
aws s3 ls s3://civic-bridge-media-842533680239/uploads/ --recursive --human-readable

# ── ECS ──
aws ecs describe-services --cluster civic-bridge-cluster \
  --services civic-backend-service \
  --query "services[0].{status:status,running:runningCount,desired:desiredCount}"

aws ecs list-tasks --cluster civic-bridge-cluster \
  --service-name civic-backend-service

# ── EC2 ──
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=civic-bridge-api" \
  --query "Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress]" \
  --output table

# ── Amplify ──
aws amplify list-jobs --app-id APP_ID --branch-name main \
  --query "jobSummaries[:5].[jobId,status,commitMessage]" --output table

# ── API Gateway ──
aws apigateway get-rest-apis --query "items[?name=='civic-bridge-api'].id" --output text

# ── Secrets ──
aws secretsmanager get-secret-value --secret-id civic-bridge/prod \
  --query SecretString --output text | python3 -m json.tool

# ── CloudWatch Alarms ──
aws cloudwatch describe-alarms --alarm-name-prefix civic- \
  --query "MetricAlarms[].[AlarmName,StateValue]" --output table
```

---

**CivicBridge Implementation Guide** | AWS Account `842533680239` | All prompts are copy-paste ready
