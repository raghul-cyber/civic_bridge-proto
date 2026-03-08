#!/bin/bash
# ============================================================
# CivicBridge — ECS Fargate Setup Script
# Account: 842533680239 | Region: us-east-1
# Creates ECR repos, builds/pushes images, provisions ECS
# cluster, ALB, services, and auto-scaling.
# ============================================================
set -euo pipefail

# Disable AWS CLI pagination so bash script does not freeze on JSON outputs
export AWS_PAGER=""
REGION="us-east-1"
ACCOUNT_ID="842533680239"
CLUSTER="civic-bridge-cluster"
BACKEND_REPO="civic-bridge-backend"
FRONTEND_REPO="civic-bridge-frontend"
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
VPC_ID="vpc-0b14d198c5bba6711"
SUBNET_1="subnet-06c7ce3ec8cfd9e09"
SUBNET_2="subnet-0835a6d9e30ed3912"
SG_ID="sg-0eccd4fc26d3d35a7"

echo "=== CivicBridge ECS Setup ==="

# ─────────────────────────────────────────
# Step 1: Create ECR Repositories
# ─────────────────────────────────────────
echo "[1/7] Creating ECR repositories..."

aws ecr create-repository \
  --repository-name "$BACKEND_REPO" \
  --image-scanning-configuration scanOnPush=true \
  --region "$REGION" 2>/dev/null || echo "  $BACKEND_REPO already exists"



# ─────────────────────────────────────────
# Step 2: Authenticate Docker to ECR
# ─────────────────────────────────────────
echo "[2/7] Authenticating Docker to ECR..."

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ECR_URI"

# ─────────────────────────────────────────
# Step 3: Build & Push Docker Images
# ─────────────────────────────────────────
echo "[3/7] Building and pushing images..."

# Backend
echo "  Building backend..."
docker build -t "$BACKEND_REPO:latest" ./backend
docker tag "$BACKEND_REPO:latest" "$ECR_URI/$BACKEND_REPO:latest"
docker push "$ECR_URI/$BACKEND_REPO:latest"
echo "  ✓ Backend pushed"



# ─────────────────────────────────────────
# Step 4: Create ECS Cluster (Fargate)
# ─────────────────────────────────────────
echo "[4/7] Creating ECS cluster..."

aws ecs create-cluster \
  --cluster-name "$CLUSTER" \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
      capacityProvider=FARGATE,weight=1 \
      capacityProvider=FARGATE_SPOT,weight=2 \
  --region "$REGION" 2>/dev/null || echo "  Cluster already exists"

# ─────────────────────────────────────────
# Step 5: Create Task Execution Role
# ─────────────────────────────────────────
echo "[5/7] Creating ECS task execution role..."

aws iam create-role \
  --role-name CivicBridgeECSTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "  Role already exists"

# Attach managed policies
aws iam attach-role-policy \
  --role-name CivicBridgeECSTaskRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Attach custom policy for DynamoDB, S3, Polly, Transcribe, Secrets Manager
aws iam put-role-policy \
  --role-name CivicBridgeECSTaskRole \
  --policy-name CivicBridgeTaskPolicy \
  --policy-document file://infrastructure/ec2_iam_policy.json

# ─────────────────────────────────────────
# Step 6: Register Task Definitions
# ─────────────────────────────────────────
echo "[6/7] Registering task definitions..."

# Backend task definition
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/task_def_backend.json \
  --region "$REGION"



# Create CloudWatch log groups
aws logs create-log-group --log-group-name /ecs/civic-bridge-backend --region "$REGION" 2>/dev/null || true


# ─────────────────────────────────────────
# Step 7: Create ALB + Target Groups + Services
# ─────────────────────────────────────────
echo "[7/7] Creating ALB, target groups, and ECS services..."

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name civic-bridge-alb \
  --subnets "$SUBNET_1" "$SUBNET_2" \
  --security-groups "$SG_ID" \
  --scheme internet-facing \
  --type application \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text --region "$REGION")

echo "  ALB ARN: $ALB_ARN"

# Backend target group
BACKEND_TG=$(aws elbv2 create-target-group \
  --name civic-backend-tg \
  --protocol HTTP --port 8000 \
  --vpc-id "$VPC_ID" \
  --target-type ip \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text --region "$REGION")



# Create HTTP listener (port 80) — direct to backend
LISTENER_ARN=$(aws elbv2 create-listener \
  --load-balancer-arn "$ALB_ARN" \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn="$BACKEND_TG" \
  --query 'Listeners[0].ListenerArn' \
  --output text --region "$REGION")

# Add rule: /api/* → backend target group
aws elbv2 create-rule \
  --listener-arn "$LISTENER_ARN" \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn="$BACKEND_TG" \
  --region "$REGION"

# Create ECS services
aws ecs create-service \
  --cluster "$CLUSTER" \
  --service-name civic-backend-service \
  --task-definition civic-bridge-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$BACKEND_TG,containerName=backend,containerPort=8000" \
  --region "$REGION"



echo "  ✓ ECS services created"

# ─────────────────────────────────────────
# Auto Scaling
# ─────────────────────────────────────────
echo "Configuring auto-scaling..."

# Register scalable targets
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id "service/$CLUSTER/civic-backend-service" \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 6



# Scale OUT when CPU > 70%
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id "service/$CLUSTER/civic-backend-service" \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name civic-backend-scale-out \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {"PredefinedMetricType": "ECSServiceAverageCPUUtilization"},
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 120
  }'



echo ""
echo "=== ECS Setup Complete ==="
echo "ALB DNS: $(aws elbv2 describe-load-balancers --names civic-bridge-alb --query 'LoadBalancers[0].DNSName' --output text --region $REGION)"
echo "Cluster: $CLUSTER | Backend tasks: 2"
echo "Auto-scaling: CPU > 70% scale out, target-tracking scale in"
