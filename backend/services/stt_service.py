import os
import time
import uuid
import logging
import functools
try:
    import whisper
except ImportError:
    whisper = None
import requests
from dotenv import load_dotenv
from services.aws_service import get_boto3_client

load_dotenv()
logger = logging.getLogger(__name__)

S3_BUCKET_MEDIA = os.getenv("S3_BUCKET_MEDIA", "civic-bridge-media-842533680239")

class STTService:
    def __init__(self):
        self.s3_client = get_boto3_client('s3')
        self.transcribe_client = get_boto3_client('transcribe')
        self.supported_languages = {
            "en-US": "English (US)",
            "es-US": "Spanish (US)",
            "hi-IN": "Hindi (India)",
            "fr-FR": "French (France)",
            "pt-BR": "Portuguese (Brazil)"
        }

    # ==========================================
    # MODE A: AWS Transcribe (Production)
    # ==========================================
    
    def upload_audio_to_s3(self, audio_bytes: bytes, filename: str) -> str:
        """Uploads raw audio bytes to S3 and returns the S3 URI."""
        key = f"audio/uploads/{uuid.uuid4()}_{filename}"
        try:
            self.s3_client.put_object(
                Bucket=S3_BUCKET_MEDIA,
                Key=key,
                Body=audio_bytes,
                ContentType='audio/mpeg' # Assuming mp3/wav/webm
            )
            s3_uri = f"s3://{S3_BUCKET_MEDIA}/{key}"
            logger.info(f"Successfully uploaded audio to {s3_uri}")
            return s3_uri
        except Exception as e:
            logger.error(f"Failed to upload audio to S3: {e}")
            raise Exception("S3 Upload Failed")

    def transcribe_with_aws(self, s3_uri: str, language_code: str = "en-US") -> str:
        """Starts an AWS Transcribe job, polls until complete, and returns the transcript."""
        if language_code not in self.supported_languages:
            raise ValueError(f"Unsupported language code: {language_code}")

        job_name = f"civic_stt_{uuid.uuid4().hex}"
        
        try:
            self.transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                LanguageCode=language_code,
                Media={'MediaFileUri': s3_uri},
                MediaFormat='webm' # Adjust dynamically if needed based on frontend encoding
            )
        except Exception as e:
            logger.error(f"Failed to start transcription job {job_name}: {e}")
            raise

        logger.info(f"Started AWS Transcribe Job: {job_name}")

        while True:
            response = self.transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
            status = response['TranscriptionJob']['TranscriptionJobStatus']
            
            if status in ['COMPLETED', 'FAILED']:
                break
            time.sleep(3)
            
        if status == 'FAILED':
            reason = response['TranscriptionJob'].get('FailureReason', 'Unknown Error')
            logger.error(f"Transcription {job_name} failed: {reason}")
            self.delete_transcription_job(job_name)
            raise Exception(f"Transcription failed: {reason}")
            
        # Fetch the completed transcript
        transcript_uri = response['TranscriptionJob']['Transcript']['TranscriptFileUri']
        transcript_response = requests.get(transcript_uri)
        transcript_response.raise_for_status()
        
        data = transcript_response.json()
        transcript_text = data['results']['transcripts'][0]['transcript']
        
        # Cleanup job metadata in AWS Transcribe
        self.delete_transcription_job(job_name)
        
        return transcript_text

    def delete_transcription_job(self, job_name: str):
        """Removes the transcription job record from AWS to prevent clutter."""
        try:
            self.transcribe_client.delete_transcription_job(TranscriptionJobName=job_name)
            logger.info(f"Cleaned up transcription job: {job_name}")
        except Exception as e:
            logger.warning(f"Failed to delete transcription job {job_name}: {e}")

    # ==========================================
    # MODE B: OpenAI Whisper (Local/Dev)
    # ==========================================
    
    @functools.lru_cache(maxsize=1)
    def _load_whisper_model(self, model_size: str = "base"):
        """Loads and caches the Whisper model."""
        logger.info(f"Loading Whisper model '{model_size}' into memory...")
        return whisper.load_model(model_size)

    def transcribe_with_whisper(self, audio_path: str, model_size: str = "base") -> str:
        """Transcribes an audio file locally using OpenAI's Whisper model."""
        if whisper is None:
            raise RuntimeError("openai-whisper is not installed. Install it with: pip install openai-whisper")
        try:
            model = self._load_whisper_model(model_size)
            result = model.transcribe(audio_path)
            return result["text"]
        except Exception as e:
            logger.error(f"Whisper transcription failed for {audio_path}: {e}")
            raise

# Singleton instance for router consumption
stt_service = STTService()
