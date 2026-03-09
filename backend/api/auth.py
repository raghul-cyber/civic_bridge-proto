import os
import logging
from datetime import datetime, timedelta
import jwt
import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(tags=["authentication"])

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
JWT_SECRET = os.getenv('JWT_SECRET', 'fallback_secret_do_not_use_in_prod')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Initialize DynamoDB Table
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    users_table = dynamodb.Table(os.getenv('DYNAMO_TABLE_USERS', 'civic_users'))
except Exception as e:
    logger.error(f"Failed to initialize DynamoDB: {e}")
    dynamodb = None
    users_table = None

class GoogleTokenRequest(BaseModel):
    credential: str  # Google ID token sent from frontend

async def upsert_user_dynamodb(user_data: dict) -> dict:
    """Insert or update a user in the civic_users DynamoDB table."""
    if not users_table:
        logger.warning("DynamoDB not available, skipping user persistence.")
        return user_data

    # Match the schema defined in dynamo_setup.py: user_id (HASH), email (RANGE)
    try:
        # Assuming google_id is used as the user_id
        item = {
            'user_id': user_data['google_id'],
            'email': user_data['email'],
            'name': user_data.get('name', ''),
            'picture': user_data.get('picture', ''),
            'role': user_data.get('role', 'citizen'),
            'created_at': user_data.get('created_at', datetime.utcnow().isoformat()),
            'last_login': datetime.utcnow().isoformat()
        }
        users_table.put_item(Item=item)
        return item
    except Exception as e:
        logger.error(f"Failed to upsert user to DynamoDB: {e}")
        # Return user data anyway to allow login to proceed even if DB fails
        return user_data

@router.post('/api/auth/google')
async def google_login(req: GoogleTokenRequest):
    """Verify Google token, create/update user, and issue JWT."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_req
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(500, "Google Client ID is not configured on the server.")

    try:
        # 1. Verify token
        info = id_token.verify_oauth2_token(
            req.credential, 
            google_req.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # 2. Database Upsert
        user = await upsert_user_dynamodb({
            'email': info['email'], 
            'name': info.get('name',''),
            'picture': info.get('picture',''), 
            'google_id': info['sub'],
            'role': 'citizen', 
            'created_at': datetime.utcnow().isoformat()
        })
        
        # 3. Create Custom JWT
        expire = datetime.utcnow() + timedelta(days=7)
        payload = {
            'sub': user['email'], 
            'name': user['name'],
            'role': user['role'], 
            'exp': expire
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        
        return {'token': token, 'user': user}
        
    except ValueError as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(401, 'Invalid Google token')
    except Exception as e:
        logger.error(f"Login process failed: {e}")
        raise HTTPException(500, str(e))
