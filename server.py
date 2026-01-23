import os
import subprocess
import streamlit as st
from langchain_community.llms import Ollama
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.chains import RetrievalQA
import time

# --- Configuration ---
MODEL_NAME = "phi3"
EMBEDDING_MODEL = "nomic-embed-text"
DB_DIR = "village_db"
PIPER_BINARY = "piper" # Assumes piper is in PATH or ./piper/piper
VOICE_MODEL = "en_US-lessac-medium.onnx" # Must be in current dir or configured path

# --- Setup Local Brain ---
@st.cache_resource
def load_chain():
    print("Loading LLM and VectorDB...")
    llm = Ollama(model=MODEL_NAME)
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)
    
    if not os.path.exists(DB_DIR):
        print(f"WARNING: {DB_DIR} not found. Please run ingest_local.py first.")
        return None

    db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
    
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=db.as_retriever(search_kwargs={"k": 3}),
        return_source_documents=True
    )
    return qa_chain

chain = load_chain()

# --- Voice Function ---
def speak_text(text):
    """
    Generates audio from text using Piper TTS (Offline).
    Returns the path to the generated audio file.
    """
    output_file = "response.wav"
    
    # Command: echo "text" | piper --model ... --output_file ...
    # We use subprocess.Popen to pipe input
    
    # Check if voice model exists
    if not os.path.exists(VOICE_MODEL):
        st.warning(f"Voice model '{VOICE_MODEL}' not found. Audio generation skipped.")
        return None

    try:
        # Determine piper command - simplistic check
        piper_cmd = [PIPER_BINARY, "--model", VOICE_MODEL, "--output_file", output_file]
        
        # If on windows, might need full path or .exe
        if os.name == 'nt' and not os.path.exists(PIPER_BINARY) and os.path.exists("piper/piper.exe"):
             piper_cmd = ["piper/piper.exe", "--model", VOICE_MODEL, "--output_file", output_file]

        process = subprocess.Popen(
            piper_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True # Enable text mode for stdin
        )
        
        stdout, stderr = process.communicate(input=text)
        
        if process.returncode == 0:
            return output_file
        else:
            st.error(f"Piper TTS Error: {stderr}")
            return None
            
    except Exception as e:
        st.error(f"Failed to run Piper: {e}")
        return None


# --- UI ---
st.set_page_config(page_title="Village Node AI", page_icon="🌲")

st.title("🌲 Village Node AI")
st.subheader("Offline Civic Assistant")

if chain is None:
    st.error("Knowledge Base not found. Please add docs to 'local_docs/' and run 'ingest_local.py'.")
else:
    # Chat Interface
    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if "audio" in message:
                st.audio(message["audio"])

    if prompt := st.chat_input("Ask a question (e.g., 'What are the pension rules?')"):
        # User message
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # Assistant response
        with st.chat_message("assistant"):
            with st.spinner("Thinking locally..."):
                start_time = time.time()
                response = chain.invoke({"query": prompt})
                result_text = response['result']
                
                st.markdown(result_text)
                
                # Generate Audio
                audio_file = speak_text(result_text)
                if audio_file:
                    st.audio(audio_file)
                    # Read into bytes to store in session state if needed for persistence?? 
                    # For now just re-playing from file is risky if overwritten, but simplest for prototype.
                    # Ideally, we should read the bytes.
                    with open(audio_file, "rb") as f:
                        audio_bytes = f.read()
                    
                    st.session_state.messages.append({
                        "role": "assistant", 
                        "content": result_text,
                        "audio": audio_bytes # Store bytes to replay later
                    })
                else:
                     st.session_state.messages.append({"role": "assistant", "content": result_text})

                with st.expander("View Source Document"):
                    for doc in response['source_documents']:
                        st.markdown(f"**Source**: {doc.metadata.get('source', 'Unknown')}")
                        st.text(doc.page_content)

