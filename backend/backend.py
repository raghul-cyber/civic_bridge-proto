import os
import subprocess
import tempfile
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.llms import Ollama
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.chains import RetrievalQA
from faster_whisper import WhisperModel
import config
from bhashini import BhashiniService
from tts_engine import TTSEngine

app = FastAPI(title="Civic Bridge API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- State ---
chain = None
stt_model = None
bhashini = None
tts_engine = None

# --- Setup Local Brain ---
def load_chain():
    print("Loading LLM and VectorDB...")
    try:
        llm = Ollama(model=config.LLM_MODEL)
        embeddings = OllamaEmbeddings(model=config.EMBEDDING_MODEL)
        
        if not os.path.exists(config.DB_DIR):
            print(f"WARNING: {config.DB_DIR} not found.")
            return None

        db = Chroma(persist_directory=config.DB_DIR, embedding_function=embeddings)
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=db.as_retriever(search_kwargs={"k": 3}),
            return_source_documents=True
        )
        return qa_chain
    except Exception as e:
        print(f"Error loading chain: {e}")
        return None

def load_stt_model():
    print("Loading Faster Whisper Model...")
    try:
        model_size = getattr(config, 'STT_MODEL_SIZE', 'tiny')
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        return model
    except Exception as e:
        print(f"Error loading STT model: {e}")
        return None

# Initialize chain on startup
@app.on_event("startup")
def startup_event():
    global chain, stt_model, bhashini, tts_engine
    chain = load_chain()
    stt_model = load_stt_model()
    bhashini = BhashiniService()
    tts_engine = TTSEngine()
    print(f"Bhashini Service Configured: {bhashini.is_configured}")

# --- Voice Function ---
def generate_audio(text: str) -> Optional[str]:
    """
    Generates audio from text using Piper TTS (Offline).
    Returns the path to the generated audio file.
    """
    if not os.path.exists(config.VOICE_MODEL_PATH):
        print(f"Voice model not found at {config.VOICE_MODEL_PATH}")
        return None

    try:
        fd, output_file = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        
        piper_cmd = [config.PIPER_BINARY, "--model", config.VOICE_MODEL_PATH, "--output_file", output_file]
        
        if not os.path.exists(config.PIPER_BINARY):
             print(f"Piper binary not found at {config.PIPER_BINARY}")
             return None

        process = subprocess.Popen(
            piper_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=text)
        
        if process.returncode == 0:
            return output_file
        else:
            print(f"Piper TTS Error: {stderr}")
            if os.path.exists(output_file):
                os.remove(output_file)
            return None
            
    except Exception as e:
        print(f"Failed to run Piper: {e}")
        return None

# --- Models ---
class QueryRequest(BaseModel):
    query: str
    language: str = "en" # Default to English

class QueryResponse(BaseModel):
    result: str
    original_query: str
    sources: List[str]
    thinking_time: float

class VoiceRequest(BaseModel):
    text: str
    language: str = "en"

class TranscribeResponse(BaseModel):
    text: str
    language: str = "en" # Detected language

# --- Endpoints ---
@app.post("/query", response_model=QueryResponse)
def query_endpoint(request: QueryRequest):
    global chain, bhashini
    if chain is None:
        raise HTTPException(status_code=503, detail="Knowledge Base not loaded. Run ingest_local.py first.")

    start_time = time.time()
    try:
        print(f"Processing query: {request.query} [Lang: {request.language}]")
        
        # 1. Translate Input to English if needed
        english_query = request.query
        if request.language != "en" and bhashini.is_configured:
            print(f"Translating from {request.language}...")
            # Mock/Real Translation
            # english_query = bhashini.translate(request.query, request.language, "en")
            pass 

        # 2. Query RAG
        response = chain.invoke({"query": english_query})
        english_result = response['result']
        
        # 3. Translate Output back to Source Language
        final_result = english_result
        if request.language != "en" and bhashini.is_configured:
             print(f"Translating result to {request.language}...")
             # Mock/Real Translation
             # final_result = bhashini.translate(english_result, "en", request.language)
             pass

        end_time = time.time()
        
        sources = [doc.metadata.get('source', 'Unknown') for doc in response.get('source_documents', [])]
        
        return QueryResponse(
            result=final_result,
            original_query=request.query,
            sources=list(set(sources)), # Deduplicate
            thinking_time=end_time - start_time
        )
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice")
async def voice_endpoint(request: VoiceRequest):
    global tts_engine
    
    if tts_engine is None:
        raise HTTPException(status_code=503, detail="TTS Engine not loaded.")

    try:
        # Use EdgeTTS for high quality voices (Multilingual)
        audio_file = await tts_engine.generate_audio(request.text, request.language)
        
        if audio_file and os.path.exists(audio_file):
            return FileResponse(audio_file, media_type="audio/mpeg", filename="response.mp3")
        else:
            raise HTTPException(status_code=500, detail="Audio generation failed")
            
    except Exception as e:
         print(f"TTS Error: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_endpoint(file: UploadFile = File(...)):
    global stt_model
    if stt_model is None:
        raise HTTPException(status_code=503, detail="STT Model not loaded.")

    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(await file.read())
            temp_audio_path = temp_audio.name

        segments, info = stt_model.transcribe(temp_audio_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])
        
        os.remove(temp_audio_path)
        return TranscribeResponse(text=text.strip())

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "brain_loaded": chain is not None, "stt_loaded": stt_model is not None}

@app.get("/")
def read_root():
    return {"message": "Civic Bridge API is running. Use the frontend to interact."}

