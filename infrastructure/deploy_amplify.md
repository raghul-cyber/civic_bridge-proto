# CivicBridge — Cognito & Amplify Deployment Guide

## Step 1 — Create Cognito User Pool

```bash
# Create User Pool with email verification, custom attributes, and password policy
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name CivicBridgeUsers \
  --auto-verified-attributes email \
  --username-attributes email \
  --mfa-configuration OPTIONAL \
  --software-token-mfa-configuration Enabled=true \
  --schema \
    Name=email,AttributeDataType=String,Required=true,Mutable=true \
    Name=name,AttributeDataType=String,Required=false,Mutable=true \
    Name=role,AttributeDataType=String,Required=false,Mutable=true,DeveloperOnlyAttribute=false,StringAttributeConstraints=\{MinLength=1,MaxLength=20\} \
    Name=ward,AttributeDataType=String,Required=false,Mutable=true,StringAttributeConstraints=\{MinLength=0,MaxLength=50\} \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false,
      "TemporaryPasswordValidityDays": 7
    }
  }' \
  --account-recovery-setting '{
    "RecoveryMechanisms": [{"Name": "verified_email", "Priority": 1}]
  }' \
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT \
  --query 'UserPool.Id' --output text)

echo "User Pool ID: $USER_POOL_ID"
```

## Step 2 — Create App Client

```bash
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name CivicBridgeWeb \
  --no-generate-secret \
  --explicit-auth-flows \
    ALLOW_USER_SRP_AUTH \
    ALLOW_REFRESH_TOKEN_AUTH \
    ALLOW_USER_PASSWORD_AUTH \
  --supported-identity-providers COGNITO \
  --callback-urls '["http://localhost:3000/","https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com/"]' \
  --logout-urls '["http://localhost:3000/auth/signin","https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com/auth/signin"]' \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client \
  --read-attributes email name custom:role custom:ward \
  --write-attributes email name custom:role custom:ward \
  --query 'UserPoolClient.ClientId' --output text)

echo "Client ID: $CLIENT_ID"
```

## Step 3 — Configure Google OAuth (Optional)

```bash
# Create identity provider
aws cognito-idp create-identity-provider \
  --user-pool-id "$USER_POOL_ID" \
  --provider-name Google \
  --provider-type Google \
  --provider-details '{
    "client_id": "YOUR_GOOGLE_CLIENT_ID",
    "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
    "authorize_scopes": "email profile openid"
  }' \
  --attribute-mapping email=email,name=name

# Create domain
aws cognito-idp create-user-pool-domain \
  --user-pool-id "$USER_POOL_ID" \
  --domain civicbridge
```

## Step 4 — Amplify Deployment

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize (run from frontend/)
cd frontend
amplify init \
  --name civicbridge \
  --envName prod \
  --defaultEditor code

# Add existing auth (skip if using manual Cognito above)
amplify import auth

# Add S3 storage
amplify add storage
# Select: Content (Images, audio, video, etc.)
# Bucket: civic-bridge-media-842533680239
# Auth users: create/update, read, delete
# Guest users: read

# Add REST API
amplify add api
# Select: REST
# Path: /api
# Restrict to auth users

# Push cloud resources
amplify push --yes

# Deploy frontend
amplify publish --yes
```

## Step 5 — Update aws-exports.js

After `amplify push`, update `frontend/src/aws-exports.js` with the generated values:

```bash
echo "Update these values in aws-exports.js:"
echo "  aws_user_pools_id: $USER_POOL_ID"
echo "  aws_user_pools_web_client_id: $CLIENT_ID"
```

## Step 6 — Set Amplify Environment Variables

```bash
AMPLIFY_APP_ID="YOUR_AMPLIFY_APP_ID"  # from amplify init

aws amplify update-branch \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name main \
  --environment-variables '{
    "NEXT_PUBLIC_API_URL": "https://api.civicbridge.org",
    "NEXT_PUBLIC_AMPLIFY_APP_ID": "'$AMPLIFY_APP_ID'",
    "NEXT_PUBLIC_USER_POOL_ID": "'$USER_POOL_ID'",
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID": "'$CLIENT_ID'",
    "NEXT_PUBLIC_S3_BUCKET": "civic-bridge-media-842533680239",
    "NEXT_PUBLIC_REGION": "us-east-1"
  }'
```

## Usage Example — Protected Page

```jsx
import withAuth from '../components/withAuth';

function AdminDashboard({ user }) {
    return <h1>Welcome, {user.name} ({user.role})</h1>;
}

// Only 'admin' role can access this page
export default withAuth(AdminDashboard, { requiredRole: 'admin' });
```
