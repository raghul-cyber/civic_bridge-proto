/* eslint-disable */
// ============================================================
// CivicBridge — AWS Amplify Configuration
// Auto-generated values — update after `amplify push`
// ============================================================

const awsExports = {
    // ── Region ──
    aws_project_region: process.env.NEXT_PUBLIC_REGION || "us-east-1",

    // ── Cognito Auth ──
    aws_cognito_region: process.env.NEXT_PUBLIC_REGION || "us-east-1",
    aws_user_pools_id: process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_XXXXXXXXX",
    aws_user_pools_web_client_id: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "xxxxxxxxxxxxxxxxxxxxxxxxx",
    oauth: {
        domain: "civicbridge.auth.us-east-1.amazoncognito.com",
        scope: ["email", "openid", "profile"],
        redirectSignIn: "http://localhost:3000/",
        redirectSignOut: "http://localhost:3000/auth/signin",
        responseType: "code",
    },

    // ── Cognito Identity Pool (Federated) ──
    aws_cognito_identity_pool_id: "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",

    // ── S3 Storage ──
    aws_user_files_s3_bucket: process.env.NEXT_PUBLIC_S3_BUCKET || "civic-bridge-media-842533680239",
    aws_user_files_s3_bucket_region: process.env.NEXT_PUBLIC_REGION || "us-east-1",

    // ── API (REST → API Gateway) ──
    aws_cloud_logic_custom: [
        {
            name: "CivicBridgeAPI",
            endpoint: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
            region: process.env.NEXT_PUBLIC_REGION || "us-east-1",
        },
    ],
};

export default awsExports;
