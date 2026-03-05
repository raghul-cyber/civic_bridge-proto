import uuid
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from services.dynamo_service import dynamo_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/issues", tags=["issues"])
security = HTTPBearer()

TABLE = "civic_issues"


# ── Request / Response Models ──

class LocationModel(BaseModel):
    lat: float = 0.0
    lng: float = 0.0
    address: str = ""

class CreateIssueRequest(BaseModel):
    title: str
    description: str
    category: str = "other"
    location: LocationModel = LocationModel()
    ward: str = ""
    severity: str = "medium"
    reporter_id: str = ""
    photos: list[str] = []
    ai_extracted: dict = {}

class UpdateIssueRequest(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    ward: Optional[str] = None


def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != "admin-secret-token":
        raise HTTPException(status_code=403, detail="Admin access required")
    return credentials.credentials


# ─────────────────────────────────────────
# GET /issues – list issues
# ─────────────────────────────────────────

@router.get("")
def list_issues(
    ward: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    """
    List issues with optional filters.
    Uses GSIs when ward or category is provided; falls back to scan.
    """
    try:
        if ward:
            items = dynamo_service.query_by_gsi(
                TABLE, "ward-status-index", "ward", ward, limit=limit
            )
            if status:
                items = [i for i in items if i.get("status") == status]
            return {"issues": items, "count": len(items)}

        if category:
            items = dynamo_service.query_by_gsi(
                TABLE, "category-date-index", "category", category, limit=limit
            )
            return {"issues": items, "count": len(items)}

        # Fallback: scan (filtered if status provided)
        from boto3.dynamodb.conditions import Attr
        filter_expr = Attr("status").eq(status) if status else None
        items = dynamo_service.scan_table(TABLE, filter_expr=filter_expr, limit=limit)
        return {"issues": items, "count": len(items)}

    except Exception as e:
        logger.error(f"list_issues failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to list issues")


# ─────────────────────────────────────────
# POST /issues – create new issue
# ─────────────────────────────────────────

@router.post("", status_code=201)
def create_issue(req: CreateIssueRequest):
    """Create a new civic issue."""
    issue_id = f"ISS-{uuid.uuid4().hex[:8].upper()}"
    reported_date = datetime.utcnow().isoformat()

    item = {
        "issue_id": issue_id,
        "reported_date": reported_date,
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "location": {
            "lat": str(req.location.lat),
            "lng": str(req.location.lng),
            "address": req.location.address,
        },
        "ward": req.ward,
        "severity": req.severity,
        "status": "open",
        "reporter_id": req.reporter_id,
        "photos": req.photos,
        "ai_extracted": req.ai_extracted,
        "upvotes": 0,
    }

    success = dynamo_service.put_item(TABLE, item)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create issue")

    return {"message": "Issue created", "issue": item}


# ─────────────────────────────────────────
# GET /issues/{issue_id} – get single issue
# ─────────────────────────────────────────

@router.get("/{issue_id}")
def get_issue(issue_id: str):
    """
    Get a single issue by issue_id.
    Since we need the SK (reported_date), we query by PK only.
    """
    items = dynamo_service.query_by_pk(TABLE, "issue_id", issue_id, limit=1)
    if not items:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"issue": items[0]}


# ─────────────────────────────────────────
# PUT /issues/{issue_id} – update issue
# ─────────────────────────────────────────

@router.put("/{issue_id}")
def update_issue(issue_id: str, req: UpdateIssueRequest):
    """Update issue attributes (status, description, etc.)."""
    # First, find the item to get its sort key
    items = dynamo_service.query_by_pk(TABLE, "issue_id", issue_id, limit=1)
    if not items:
        raise HTTPException(status_code=404, detail="Issue not found")

    existing = items[0]
    reported_date = existing["reported_date"]

    updates = {}
    if req.status is not None:
        updates["status"] = req.status
    if req.description is not None:
        updates["description"] = req.description
    if req.category is not None:
        updates["category"] = req.category
    if req.severity is not None:
        updates["severity"] = req.severity
    if req.ward is not None:
        updates["ward"] = req.ward

    if not updates:
        return {"message": "No updates provided", "issue": existing}

    updates["updated_at"] = datetime.utcnow().isoformat()

    success = dynamo_service.update_item(
        TABLE,
        pk={"issue_id": issue_id},
        sk={"reported_date": reported_date},
        updates=updates,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update issue")

    return {"message": "Issue updated", "issue_id": issue_id, "updates": updates}


# ─────────────────────────────────────────
# DELETE /issues/{issue_id} – admin only
# ─────────────────────────────────────────

@router.delete("/{issue_id}")
def delete_issue(issue_id: str, token: str = Depends(verify_admin)):
    """Delete an issue (admin only)."""
    items = dynamo_service.query_by_pk(TABLE, "issue_id", issue_id, limit=1)
    if not items:
        raise HTTPException(status_code=404, detail="Issue not found")

    existing = items[0]
    success = dynamo_service.delete_item(
        TABLE,
        pk={"issue_id": issue_id},
        sk={"reported_date": existing["reported_date"]},
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete issue")

    return {"message": "Issue deleted", "issue_id": issue_id}


# ─────────────────────────────────────────
# POST /issues/{issue_id}/upvote
# ─────────────────────────────────────────

@router.post("/{issue_id}/upvote")
def upvote_issue(issue_id: str):
    """Increment the upvote counter atomically."""
    items = dynamo_service.query_by_pk(TABLE, "issue_id", issue_id, limit=1)
    if not items:
        raise HTTPException(status_code=404, detail="Issue not found")

    existing = items[0]
    reported_date = existing["reported_date"]

    # Use a raw update expression for atomic increment
    try:
        dynamo_service._table(TABLE).update_item(
            Key={"issue_id": issue_id, "reported_date": reported_date},
            UpdateExpression="SET upvotes = if_not_exists(upvotes, :zero) + :inc",
            ExpressionAttributeValues={":inc": 1, ":zero": 0},
        )
        current_upvotes = existing.get("upvotes", 0) + 1
        return {"message": "Upvoted", "issue_id": issue_id, "upvotes": current_upvotes}
    except Exception as e:
        logger.error(f"upvote failed: {e}")
        raise HTTPException(status_code=500, detail="Upvote failed")
