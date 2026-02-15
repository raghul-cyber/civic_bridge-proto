import os

# --- Model Configuration ---
LLM_MODEL = "phi3"
EMBEDDING_MODEL = "nomic-embed-text"

# --- Directory Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, "local_docs")
DB_DIR = os.path.join(BASE_DIR, "village_db")

# --- Voice Configuration ---
# Voice Model
VOICE_MODEL_NAME = "en_US-lessac-medium.onnx"
VOICE_MODEL_CONFIG = "en_US-lessac-medium.onnx.json"
VOICE_MODEL_PATH = os.path.join(BASE_DIR, VOICE_MODEL_NAME)
VOICE_MODEL_CONFIG_PATH = os.path.join(BASE_DIR, VOICE_MODEL_CONFIG)

# Piper Binary
PIPER_DIR = os.path.join(BASE_DIR, "piper")
if os.name == 'nt':
    PIPER_BINARY = os.path.join(PIPER_DIR, "piper.exe")
else:
    PIPER_BINARY = os.path.join(PIPER_DIR, "piper")

# --- URLs ---
PIPER_WINDOWS_URL = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
PIPER_LINUX_URL = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"

VOICE_MODEL_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx?download=true"
VOICE_MODEL_CONFIG_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json?download=true"

# --- Bhashini Configuration ---
BHASHINI_USER_ID = os.getenv("BHASHINI_USER_ID", "")
BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", "")
BHASHINI_PIPELINE_ID = os.getenv("BHASHINI_PIPELINE_ID", "64392f96daac500b55c543cd")

STT_MODEL_SIZE = "tiny"