#!/bin/bash
# ============================================================
# CivicBridge EC2 User-Data Bootstrap Script
# Instance: t3.medium · Ubuntu 22.04 · us-east-1
# ============================================================
set -euo pipefail

LOG="/var/log/civicbridge-setup.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== CivicBridge EC2 setup started at $(date -u) ==="

# ── 1. System updates ──
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# ── 2. Install core packages ──
apt-get install -y \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    git nginx certbot python3-certbot-nginx \
    ffmpeg curl unzip jq

# Make python3.11 the default
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install AWS CLI v2
curl -sL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -qo /tmp/awscliv2.zip -d /tmp
/tmp/aws/install --update
rm -rf /tmp/aws /tmp/awscliv2.zip

# ── 3. Clone repository ──
REPO_DIR="/home/ubuntu/civic_bridge-proto"
if [ ! -d "$REPO_DIR" ]; then
    git clone https://github.com/raghul-cyber/civic_bridge-proto.git "$REPO_DIR"
fi
chown -R ubuntu:ubuntu "$REPO_DIR"

# ── 4. Create .env from AWS Secrets Manager ──
SECRET_ARN="arn:aws:secretsmanager:us-east-1:842533680239:secret:civicbridge/env"
aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ARN" \
    --query 'SecretString' \
    --output text \
    --region us-east-1 > "$REPO_DIR/.env" 2>/dev/null || {
        echo "WARNING: Could not fetch secret — creating skeleton .env"
        cat > "$REPO_DIR/.env" <<'ENVEOF'
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=842533680239
DYNAMO_TABLE_ISSUES=civic_issues
DYNAMO_TABLE_USERS=civic_users
DYNAMO_TABLE_SERVICES=civic_services
DYNAMO_TABLE_DATASETS=civic_datasets
S3_BUCKET_MEDIA=civic-bridge-media-842533680239
S3_BUCKET_DATASETS=civic-bridge-datasets-842533680239
WHISPER_MODEL=base
AWS_POLLY_VOICE=Joanna
AWS_TRANSCRIBE_LANG=en-US
ENVEOF
    }
chown ubuntu:ubuntu "$REPO_DIR/.env"

# ── 5. Python virtual environment + dependencies ──
sudo -u ubuntu python3 -m venv "$REPO_DIR/venv"
sudo -u ubuntu "$REPO_DIR/venv/bin/pip" install --upgrade pip setuptools wheel
sudo -u ubuntu "$REPO_DIR/venv/bin/pip" install -r "$REPO_DIR/backend/requirements.txt"

# ── 6. Install systemd service ──
cp "$REPO_DIR/infrastructure/civicbridge.service" /etc/systemd/system/civicbridge.service
systemctl daemon-reload
systemctl enable civicbridge.service
systemctl start civicbridge.service

# ── 7. Configure Nginx ──
cp "$REPO_DIR/infrastructure/nginx_civicbridge.conf" /etc/nginx/sites-available/civicbridge
ln -sf /etc/nginx/sites-available/civicbridge /etc/nginx/sites-enabled/civicbridge
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx

# ── 8. SSL with Let's Encrypt (optional — requires domain) ──
# Uncomment and set your domain:
# DOMAIN="api.civicbridge.org"
# certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@civicbridge.org

# ── 9. CloudWatch Agent (optional) ──
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
# dpkg -i amazon-cloudwatch-agent.deb

echo "=== CivicBridge EC2 setup complete at $(date -u) ==="
echo "Backend running on http://localhost:8000"
echo "Nginx proxy on http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
