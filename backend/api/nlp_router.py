import os
import json
import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nlp", tags=["nlp"])

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

# ============================================================
# LLM Extraction Prompt (Claude Haiku)
# ============================================================
EXTRACTION_SYSTEM_PROMPT = """You are a civic issue extraction assistant for CivicBridge, a government services platform.
You receive a free-form spoken report from a citizen describing a civic issue.
Your job is to extract structured data from the report.

You MUST return ONLY a valid JSON object with these exact keys:
{
  "issue_type": "string — one of: pothole, streetlight, water_leak, garbage, noise, graffiti, traffic_signal, flooding, other",
  "location": "string — street address or landmark mentioned",
  "description": "string — cleaned-up description of the issue",
  "severity": "string — one of: low, medium, high, critical — infer from urgency/safety language",
  "estimated_duration": "string — how long the issue has existed, e.g. '3 days', '1 week', 'unknown'"
}

Rules:
- If a field cannot be determined from the text, use "unknown".
- Do NOT include any text outside the JSON object.
- Keep the description concise but preserve all relevant details."""

class ExtractionRequest(BaseModel):
    transcript: str

class TranslationRequest(BaseModel):
    text: str
    source_language: str = "auto"
    target_language: str = "en"

@router.post("/extract")
async def extract_issue_fields(req: ExtractionRequest):
    """
    Uses Claude Haiku to extract structured issue fields from a spoken transcript.
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 512,
                    "system": EXTRACTION_SYSTEM_PROMPT,
                    "messages": [
                        {"role": "user", "content": req.transcript}
                    ]
                }
            )

        if response.status_code != 200:
            logger.error(f"Anthropic API error: {response.status_code} {response.text}")
            raise HTTPException(status_code=502, detail="LLM extraction failed")

        data = response.json()
        raw_text = data["content"][0]["text"]

        # Parse the JSON from Claude's response
        extracted = json.loads(raw_text)
        return {"extracted": extracted}

    except json.JSONDecodeError:
        logger.error(f"LLM returned non-JSON: {raw_text}")
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON")
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate_text(req: TranslationRequest):
    """
    Stub endpoint for translation. 
    In production, wire this to AWS Translate, Google Cloud Translation, or Bhashini API.
    """
    # --- STUB: Returns the original text with a placeholder translation ---
    logger.info(f"Translation stub called: {req.source_language} -> {req.target_language}")
    return {
        "original": req.text,
        "translated": req.text,  # Placeholder — replace with real API call
        "source_language": req.source_language,
        "target_language": req.target_language,
        "note": "Stub response. Connect to AWS Translate or Bhashini for production."
    }
