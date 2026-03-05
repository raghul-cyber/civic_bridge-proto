import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO
from services.tts_service import tts_service, POLLY_VOICES, GTTS_LANG_MAP

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts", tags=["text-to-speech"])


class SynthesizeRequest(BaseModel):
    text: str
    voice: str = "Joanna"       # Polly voice ID
    language: str = "en-US"     # BCP-47 code, used for gTTS fallback
    mode: str = "polly"         # "polly" | "gtts"


# ────────────────────────────────────────────
# GET /tts/voices
# ────────────────────────────────────────────

@router.get("/voices")
def list_voices():
    """
    Returns all available voice IDs with language and gender metadata.
    """
    voices = []
    for voice_id, meta in POLLY_VOICES.items():
        voices.append({
            "voice_id": voice_id,
            "language_code": meta["language_code"],
            "language": meta["language"],
            "gender": meta["gender"],
            "engine": meta["engine"]
        })
    return {"voices": voices}


# ────────────────────────────────────────────
# POST /tts/synthesize
# ────────────────────────────────────────────

@router.post("/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    """
    Synthesizes text to speech and returns an audio/mpeg stream.

    - Uses Amazon Polly (mode='polly') with MD5-based S3 caching
      so repeated phrases are served instantly.
    - Falls back to gTTS (mode='gtts') for local/dev environments.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    if req.mode == "polly" and req.voice not in POLLY_VOICES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown voice '{req.voice}'. Available: {list(POLLY_VOICES.keys())}"
        )

    if req.mode == "gtts" and req.language not in GTTS_LANG_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported gTTS language: {req.language}"
        )

    try:
        audio_bytes = tts_service.synthesize(
            text=req.text,
            voice_id=req.voice,
            language=req.language,
            mode=req.mode
        )

        return StreamingResponse(
            content=BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=tts_output.mp3",
                "Content-Length": str(len(audio_bytes))
            }
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        raise HTTPException(status_code=500, detail="Speech synthesis failed.")
