import time
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.stt_service import stt_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stt", tags=["speech-to-text"])

@router.get("/languages")
def get_supported_languages():
    """Returns list of supported language codes with display names."""
    return {"languages": stt_service.supported_languages}

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en-US"),
    mode: str = Form("aws") # "aws" or "whisper"
):
    """
    Accepts multipart/form-data audio uploads and transcribes them 
    using either AWS Transcribe or local Whisper models.
    """
    start_time = time.time()
    
    if mode not in ["aws", "whisper"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'aws' or 'whisper'.")
        
    if mode == "aws" and language not in stt_service.supported_languages:
         raise HTTPException(status_code=400, detail=f"Unsupported language code for AWS mode: {language}")

    try:
        audio_bytes = await file.read()
        
        if mode == "aws":
            # Mode A: AWS Transcribe Pipeline
            s3_uri = stt_service.upload_audio_to_s3(audio_bytes, file.filename)
            transcript = stt_service.transcribe_with_aws(s3_uri, language_code=language)
            
        elif mode == "whisper":
            # Mode B: Local Whisper Pipeline (requires temp file on disk)
            suffix = os.path.splitext(file.filename)[1] or ".webm"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
                
            try:
                # Force English for base model simplicity, whisper auto-detects otherwise
                transcript = stt_service.transcribe_with_whisper(tmp_path, model_size="base")
            finally:
                os.remove(tmp_path) # cleanup
                
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            "transcript": transcript,
            "language": language,
            "duration_ms": duration_ms,
            "mode": mode
        }
        
    except Exception as e:
        logger.error(f"Transcription API failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
