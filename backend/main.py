"""
CivicBridge — FastAPI Application Entry Point
Registers all API routers and configures CORS / health check.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CivicBridge API",
    description="Civic-tech platform API — issues, datasets, STT, TTS, NLP",
    version="1.0.0",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.amplifyapp\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health Check ──
@app.get("/health")
def health():
    return {"status": "ok", "service": "civicbridge-api"}

# ── Register Routers ──
from api.datasets_router import router as datasets_router
from api.stt_router import router as stt_router
from api.tts_router import router as tts_router
from api.nlp_router import router as nlp_router
from api.issues_router import router as issues_router
from api.s3_router import router as s3_router

app.include_router(datasets_router)
app.include_router(stt_router)
app.include_router(tts_router)
app.include_router(nlp_router)
app.include_router(issues_router)
app.include_router(s3_router)

logger.info("CivicBridge API started — all routers registered")
