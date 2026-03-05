#!/bin/bash
# ============================================================
# CivicBridge — API Smoke Test Script
# Hits every API Gateway endpoint and checks HTTP responses.
# Usage: ./scripts/smoke_test.sh [API_URL]
# ============================================================
set -euo pipefail

API_URL="${1:-http://localhost:8000}"
PASS=0
FAIL=0
TOTAL=0
AUTH_TOKEN="${AUTH_TOKEN:-}"    # Set if testing auth-protected routes
API_KEY="${API_KEY:-}"         # Admin API key

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
    local method="$1"
    local path="$2"
    local expected="${3:-200}"
    local data="${4:-}"
    local extra_headers="${5:-}"
    TOTAL=$((TOTAL + 1))

    local curl_cmd="curl -sf -o /dev/null -w '%{http_code}' -X $method"

    # Add auth header if available
    if [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi

    # Add API key if available
    if [ -n "$API_KEY" ]; then
        curl_cmd="$curl_cmd -H 'x-api-key: $API_KEY'"
    fi

    # Add extra headers
    if [ -n "$extra_headers" ]; then
        curl_cmd="$curl_cmd $extra_headers"
    fi

    # Add request body
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi

    curl_cmd="$curl_cmd '$API_URL$path'"

    local status_code
    status_code=$(eval "$curl_cmd" 2>/dev/null || echo "000")

    if [ "$status_code" = "$expected" ]; then
        echo -e "  ${GREEN}✓${NC} $method $path → $status_code"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} $method $path → $status_code (expected $expected)"
        FAIL=$((FAIL + 1))
    fi
}

echo "============================================"
echo "  CivicBridge API Smoke Tests"
echo "  Target: $API_URL"
echo "============================================"
echo ""

# ── 1. Health Check ──
echo -e "${YELLOW}[Health]${NC}"
check GET "/health" 200

# ── 2. Issues CRUD ──
echo ""
echo -e "${YELLOW}[Issues]${NC}"

# Create issue
ISSUE_BODY='{"title":"Smoke test issue","description":"Created by smoke test script","category":"pothole","ward":"ward-1"}'
check POST "/issues" 201 "$ISSUE_BODY"

# List issues
check GET "/issues" 200
check GET "/issues?ward=ward-1" 200
check GET "/issues?category=pothole" 200
check GET "/issues?status=open" 200

# Get specific issue (will 404 since we don't capture the ID — that's OK for smoke)
check GET "/issues/ISS-SMOKETEST" 404

# Update (will 404 — expected)
check PUT "/issues/ISS-SMOKETEST" 404 '{"status":"in_progress"}'

# Upvote (will 404 — expected)
check POST "/issues/ISS-SMOKETEST/upvote" 404

# Delete without auth (should 403)
check DELETE "/issues/ISS-SMOKETEST" 403

# ── 3. Services ──
echo ""
echo -e "${YELLOW}[Services]${NC}"
check GET "/services" 200

# ── 4. Datasets ──
echo ""
echo -e "${YELLOW}[Datasets]${NC}"
check GET "/datasets/files" 200
check GET "/datasets/files?prefix=processed/" 200

# ── 5. STT ──
echo ""
echo -e "${YELLOW}[Speech-to-Text]${NC}"
check GET "/stt/languages" 200

# ── 6. TTS ──
echo ""
echo -e "${YELLOW}[Text-to-Speech]${NC}"
TTS_BODY='{"text":"Hello from CivicBridge smoke test","voice_id":"Joanna"}'
check POST "/tts/synthesize" 200 "$TTS_BODY"
check GET "/tts/voices" 200

# ── 7. Media ──
echo ""
echo -e "${YELLOW}[Media]${NC}"
check GET "/media/presign?key=uploads/test/photo.jpg" 200

# ── 8. NLP ──
echo ""
echo -e "${YELLOW}[NLP]${NC}"
NLP_BODY='{"text":"There is a broken streetlight at 123 Main Street"}'
check POST "/nlp/extract" 200 "$NLP_BODY"

# ── Summary ──
echo ""
echo "============================================"
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${TOTAL} total"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All smoke tests passed! ✓${NC}"
    exit 0
fi
