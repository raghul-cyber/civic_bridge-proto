# CivicBridge EC2 Deployment Guide

## Prerequisites

- AWS CLI v2 configured with account **842533680239**
- Key pair `civic-bridge-key` created: `aws ec2 create-key-pair --key-name civic-bridge-key --query KeyMaterial --output text > civic-bridge-key.pem && chmod 400 civic-bridge-key.pem`

---

## Step 1 — Create Security Group

```bash
# Create the security group
SG_ID=$(aws ec2 create-security-group \
  --group-name civic-bridge-sg \
  --description "CivicBridge EC2 - HTTPS + SSH" \
  --query 'GroupId' --output text)

# HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0

# HTTP (for redirect / certbot)
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0

# SSH from your IP only (replace YOUR_IP)
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" --protocol tcp --port 22 --cidr YOUR_IP/32

echo "Security Group: $SG_ID"
```

## Step 2 — Create IAM Role + Instance Profile

```bash
# Create the role
aws iam create-role \
  --role-name CivicBridgeEC2Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach the custom policy
aws iam put-role-policy \
  --role-name CivicBridgeEC2Role \
  --policy-name CivicBridgeEC2Policy \
  --policy-document file://infrastructure/ec2_iam_policy.json

# Create instance profile and attach role
aws iam create-instance-profile --instance-profile-name CivicBridgeEC2Profile
aws iam add-role-to-instance-profile \
  --instance-profile-name CivicBridgeEC2Profile \
  --role-name CivicBridgeEC2Role

# Wait for propagation
sleep 10
```

## Step 3 — Store Secrets in Secrets Manager

```bash
aws secretsmanager create-secret \
  --name civicbridge/env \
  --secret-string '{
    "AWS_REGION": "us-east-1",
    "AWS_ACCOUNT_ID": "842533680239",
    "DYNAMO_TABLE_ISSUES": "civic_issues",
    "DYNAMO_TABLE_USERS": "civic_users",
    "S3_BUCKET_MEDIA": "civic-bridge-media-842533680239",
    "S3_BUCKET_DATASETS": "civic-bridge-datasets-842533680239",
    "WHISPER_MODEL": "base",
    "AWS_POLLY_VOICE": "Joanna",
    "ANTHROPIC_API_KEY": "YOUR_KEY_HERE"
  }'
```

## Step 4 — Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.medium \
  --key-name civic-bridge-key \
  --security-group-ids "$SG_ID" \
  --iam-instance-profile Name=CivicBridgeEC2Profile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=civic-bridge-api}]' \
  --user-data file://infrastructure/ec2_userdata.sh \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --count 1
```

## Step 5 — Verify

```bash
# Get public IP
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=civic-bridge-api" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo "Instance: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"

# SSH in to check
ssh -i civic-bridge-key.pem ubuntu@$PUBLIC_IP

# On the instance — verify services
sudo systemctl status civicbridge
sudo journalctl -u civicbridge -f
curl http://localhost:8000/health
```

## Step 6 — SSL Certificate (after DNS is pointed)

```bash
# On the EC2 instance:
sudo certbot --nginx -d api.civicbridge.org \
  --non-interactive --agree-tos -m admin@civicbridge.org
```

---

## Useful Commands

| Action | Command |
|---|---|
| View logs | `sudo journalctl -u civicbridge -f` |
| Restart backend | `sudo systemctl restart civicbridge` |
| Pull latest code | `cd ~/civic_bridge-proto && git pull && sudo systemctl restart civicbridge` |
| Nginx logs | `sudo tail -f /var/log/nginx/access.log` |
| Check disk | `df -h` |
