import os
import io
import hashlib
import logging
from dotenv import load_dotenv
from gtts import gTTS
from services.aws_service import get_boto3_client

load_dotenv()
logger = logging.getLogger(__name__)

S3_BUCKET_MEDIA = os.getenv("S3_BUCKET_MEDIA", "civic-bridge-media-842533680239")
TTS_CACHE_PREFIX = "tts/cache/"

# Polly voice catalogue — maps voice_id to language + gender
POLLY_VOICES = {
    "Joanna":  {"language_code": "en-US", "language": "English (US)",       "gender": "Female", "engine": "neural"},
    "Miguel":  {"language_code": "es-US", "language": "Spanish (US)",       "gender": "Male",   "engine": "neural"},
    "Aditi":   {"language_code": "hi-IN", "language": "Hindi (India)",      "gender": "Female", "engine": "standard"},
    "Celine":  {"language_code": "fr-FR", "language": "French (France)",    "gender": "Female", "engine": "neural"},
    "Vitoria": {"language_code": "pt-BR", "language": "Portuguese (Brazil)","gender": "Female", "engine": "neural"}
}

# gTTS language shortcode mapping
GTTS_LANG_MAP = {
    "en-US": "en",
    "es-US": "es",
    "hi-IN": "hi",
    "fr-FR": "fr",
    "pt-BR": "pt"
}


class TTSService:
    """
    Dual-mode Text-to-Speech service for CivicBridge.

    MODE A — Amazon Polly (production):
        Neural / standard voices, MD5-based S3 caching so repeated
        phrases are served instantly from cache.

    MODE B — gTTS (local / dev):
        Free Google Translate TTS, no credentials needed.
    """

    def __init__(self):
        self.polly_client = get_boto3_client("polly")
        self.s3_client = get_boto3_client("s3")

    # ──────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────

    @staticmethod
    def _cache_key(text: str, voice_id: str) -> str:
        """Generates a deterministic S3 key from text + voice via MD5."""
        raw = f"{text}|{voice_id}"
        digest = hashlib.md5(raw.encode("utf-8")).hexdigest()
        return f"{TTS_CACHE_PREFIX}{voice_id}/{digest}.mp3"

    def _check_s3_cache(self, key: str) -> bytes | None:
        """Returns cached audio bytes from S3, or None if miss."""
        try:
            obj = self.s3_client.get_object(Bucket=S3_BUCKET_MEDIA, Key=key)
            logger.info(f"TTS cache HIT: {key}")
            return obj["Body"].read()
        except self.s3_client.exceptions.NoSuchKey:
            return None
        except Exception:
            return None

    def _write_s3_cache(self, key: str, audio_bytes: bytes) -> None:
        """Writes audio bytes into the S3 cache."""
        try:
            self.s3_client.put_object(
                Bucket=S3_BUCKET_MEDIA,
                Key=key,
                Body=audio_bytes,
                ContentType="audio/mpeg"
            )
            logger.info(f"TTS cache WRITE: {key}")
        except Exception as e:
            logger.warning(f"Failed to write TTS cache: {e}")

    # ──────────────────────────────────────────────
    # MODE A — Amazon Polly
    # ──────────────────────────────────────────────

    def synthesize_with_polly(
        self,
        text: str,
        voice_id: str = "Joanna",
        engine: str = "neural",
        output_format: str = "mp3"
    ) -> bytes:
        """
        Synthesizes speech with Amazon Polly.

        Args:
            text:          Plain text to speak (max 3 000 chars per Polly limit).
            voice_id:      Polly voice name — Joanna | Miguel | Aditi | Celine | Vitoria.
            engine:        "neural" or "standard".
            output_format: "mp3" (default), "ogg_vorbis", or "pcm".

        Returns:
            Raw audio bytes (MP3).
        """
        if voice_id not in POLLY_VOICES:
            raise ValueError(f"Unsupported Polly voice: {voice_id}. "
                             f"Choose from: {list(POLLY_VOICES.keys())}")

        # 1. Check S3 cache first
        cache_key = self._cache_key(text, voice_id)
        cached = self._check_s3_cache(cache_key)
        if cached:
            return cached

        # 2. Fallback to engine override from voice catalogue
        voice_meta = POLLY_VOICES[voice_id]
        effective_engine = voice_meta.get("engine", engine)

        try:
            response = self.polly_client.synthesize_speech(
                Text=text,
                OutputFormat=output_format,
                VoiceId=voice_id,
                Engine=effective_engine
            )
            audio_bytes = response["AudioStream"].read()
            logger.info(
                f"Polly synthesis OK: voice={voice_id}, engine={effective_engine}, "
                f"size={len(audio_bytes)} bytes"
            )

            # 3. Cache the result
            self._write_s3_cache(cache_key, audio_bytes)

            return audio_bytes

        except Exception as e:
            logger.error(f"Polly synthesis failed: {e}")
            raise

    # ──────────────────────────────────────────────
    # MODE B — gTTS (local / dev)
    # ──────────────────────────────────────────────

    def synthesize_with_gtts(self, text: str, lang: str = "en") -> bytes:
        """
        Synthesizes speech using Google Translate TTS.

        Args:
            text: Plain text to speak.
            lang: ISO-639-1 language code (en, es, hi, fr, pt).

        Returns:
            Raw MP3 audio bytes.
        """
        try:
            tts = gTTS(text=text, lang=lang, slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            audio_bytes = buf.read()
            logger.info(f"gTTS synthesis OK: lang={lang}, size={len(audio_bytes)} bytes")
            return audio_bytes
        except Exception as e:
            logger.error(f"gTTS synthesis failed: {e}")
            raise

    # ──────────────────────────────────────────────
    # Unified convenience method
    # ──────────────────────────────────────────────

    def synthesize(
        self,
        text: str,
        voice_id: str = "Joanna",
        language: str = "en-US",
        mode: str = "polly"
    ) -> bytes:
        """
        Single entry-point that routes to the correct backend.

        Args:
            text:     Text to synthesize.
            voice_id: Polly voice name (ignored when mode='gtts').
            language: BCP-47 language code, used for gTTS fallback mapping.
            mode:     'polly' or 'gtts'.

        Returns:
            Raw MP3 bytes.
        """
        if mode == "polly":
            return self.synthesize_with_polly(text, voice_id=voice_id)
        elif mode == "gtts":
            lang_short = GTTS_LANG_MAP.get(language, "en")
            return self.synthesize_with_gtts(text, lang=lang_short)
        else:
            raise ValueError(f"Invalid TTS mode: {mode}")


# Singleton
tts_service = TTSService()
