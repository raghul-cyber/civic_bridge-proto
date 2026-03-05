import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from services.s3_service import s3_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["media & storage"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ─────────────────────────────────────────
# POST /media/upload – upload issue photo
# ─────────────────────────────────────────

@router.post("/media/upload")
async def upload_photo(
    file: UploadFile = File(...),
    issue_id: str = Form("unassigned"),
):
    """
    Upload an issue photo to S3.
    Returns the presigned URL (7-day expiry).
    Max 10 MB per file. Compressed automatically if > 5 MB.
    """
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, detail=f"File too large. Max {MAX_FILE_SIZE // (1024*1024)} MB."
        )

    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415, detail=f"Unsupported file type: {file.content_type}"
        )

    try:
        url = s3_service.upload_issue_photo(issue_id, content, file.filename)
        return {
            "url": url,
            "filename": file.filename,
            "issue_id": issue_id,
            "size": len(content),
        }
    except Exception as e:
        logger.error(f"Photo upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


# ─────────────────────────────────────────
# GET /media/presign/{key} – presigned URL
# ─────────────────────────────────────────

@router.get("/media/presign")
def get_presigned(
    key: str = Query(..., description="S3 object key"),
    bucket: str = Query(None, description="Bucket name (defaults to media bucket)"),
    expires: int = Query(3600, description="URL expiry in seconds"),
):
    """Get a presigned download URL for any S3 object."""
    target_bucket = bucket or s3_service.media_bucket
    try:
        url = s3_service.get_presigned_url(target_bucket, key, expires_in=expires)
        return {"url": url, "key": key, "expires_in": expires}
    except Exception as e:
        logger.error(f"Presign failed: {e}")
        raise HTTPException(status_code=500, detail="Could not generate presigned URL")


# ─────────────────────────────────────────
# GET /datasets/files – list dataset files
# ─────────────────────────────────────────

@router.get("/datasets/files")
def list_dataset_files(
    prefix: str = Query("datasets/", description="S3 key prefix to list"),
):
    """List all dataset files under a given S3 prefix."""
    files = s3_service.list_dataset_files(prefix)
    return {"files": files, "count": len(files)}
