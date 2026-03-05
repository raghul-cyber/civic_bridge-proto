import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.dataset_service import DatasetScheduler, s3_client, S3_BUCKET_DATASETS
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/datasets", tags=["datasets"])
security = HTTPBearer()

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifies that the bearer token has admin privileges."""
    token = credentials.credentials
    # In a real environment, validate token properly. For this prototype, a simple dummy check.
    if token != "admin-secret-token":
        raise HTTPException(status_code=403, detail="Not authorized")
    return token

@router.get("/list")
def list_datasets():
    """List all available datasets from S3"""
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET_DATASETS, Prefix="datasets/")
        files = []
        if "Contents" in response:
            for obj in response["Contents"]:
                files.append({
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"]
                })
        return {"datasets": files}
    except Exception as e:
        logger.error(f"Error listing datasets: {e}")
        raise HTTPException(status_code=500, detail="Failed to list datasets")

@router.get("/{name}")
def get_dataset(name: str):
    """Return latest 100 rows as JSON from a given dataset"""
    try:
        prefix = f"datasets/{name}/"
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET_DATASETS, Prefix=prefix)
        
        if "Contents" not in response or len(response["Contents"]) == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or no files exist")
        
        # Determine the latest file based on LastModified
        latest_file = sorted(response["Contents"], key=lambda obj: obj["LastModified"], reverse=True)[0]
        
        s3_obj = s3_client.get_object(Bucket=S3_BUCKET_DATASETS, Key=latest_file["Key"])
        df = pd.read_csv(io.BytesIO(s3_obj["Body"].read()))
        
        result_data = df.head(100).fillna("").to_dict(orient="records")
        return {"dataset": name, "file": latest_file["Key"], "data": result_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving dataset {name}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dataset")

@router.post("/refresh")
def refresh_datasets(token: str = Depends(verify_admin_token)):
    """Trigger re-ingest (admin only, bearer token)"""
    try:
        scheduler = DatasetScheduler()
        summary = scheduler.run_all()
        return {"message": "Dataset refresh completed", "summary": summary}
    except Exception as e:
        logger.error(f"Error refreshing datasets: {e}")
        raise HTTPException(status_code=500, detail="Failed to run refresh scheduler")
