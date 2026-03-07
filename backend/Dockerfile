# ============================================================
# CivicBridge Backend — Multi-Stage Dockerfile
# Final image < 800 MB (python:3.11-slim + ffmpeg)
# ============================================================

# ── Stage 1: Build dependencies ──
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build-time deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip "setuptools<70" wheel
RUN pip install --no-cache-dir --prefix=/install openai-whisper==20231117 --no-build-isolation
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Production image ──
FROM python:3.11-slim AS production

LABEL maintainer="CivicBridge <admin@civicbridge.org>"
LABEL description="CivicBridge FastAPI backend with Whisper STT support"

# System deps: ffmpeg (for Whisper audio), libsndfile1 (audio I/O)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Python packages from builder
COPY --from=builder /install /usr/local

# Create non-root user
RUN useradd --create-home --shell /bin/bash civicbridge
USER civicbridge
WORKDIR /home/civicbridge/app

# Copy application code
COPY --chown=civicbridge:civicbridge . .

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "2", \
    "--log-level", "info"]
