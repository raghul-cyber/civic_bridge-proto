import os
import subprocess
import streamlit as st
from langchain_community.llms import Ollama
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.chains import RetrievalQA
import time
import tempfile
import config

# --- Configuration ---
# Loaded from config.py

# --- Setup Local Brain ---
@st.cache_resource
def load_chain():
    print("Loading LLM and VectorDB...")
    llm = Ollama(model=config.LLM_MODEL)
    embeddings = OllamaEmbeddings(model=config.EMBEDDING_MODEL)
    
    if not os.path.exists(config.DB_DIR):
        print(f"WARNING: {config.DB_DIR} not found. Please run ingest_local.py first.")
        st.error(f"Knowledge Base ({config.DB_DIR}) not found. Please run ingest_local.py first.")
        return None

    db = Chroma(persist_directory=config.DB_DIR, embedding_function=embeddings)
    
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
    # Check if voice model exists
    if not os.path.exists(config.VOICE_MODEL_PATH):
        st.warning(f"Voice model not found at {config.VOICE_MODEL_PATH}. Audio generation skipped.")
        return None

    try:
        # Create a temporary file
        # We need to close it so Piper can write to it (on Windows especially)
        fd, output_file = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        
        piper_cmd = [config.PIPER_BINARY, "--model", config.VOICE_MODEL_PATH, "--output_file", output_file]
        
        # Check binary existence
        if not os.path.exists(config.PIPER_BINARY):
             st.warning(f"Piper binary not found at {config.PIPER_BINARY}. Audio generation skipped.")
             return None

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
            if os.path.exists(output_file):
                os.remove(output_file)
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
                try:
                    st.toast("Connecting to Brain...", icon="🧠")
                    print(f"[{time.time()}] Invoking Chain...")
                    t0 = time.time()
                    response = chain.invoke({"query": prompt})
                    t1 = time.time()
                    print(f"[{time.time()}] Chain finished in {t1-t0:.2f}s")
                    
                    result_text = response['result']
                    
                    st.markdown(result_text)
                    st.success(f"Thinking time: {t1-t0:.2f}s")
                    
                    # Generate Audio
                    st.toast("Generating Voice...", icon="🗣️")
                    t2 = time.time()
                    audio_file = speak_text(result_text)
                    t3 = time.time()
                    print(f"[{time.time()}] TTS finished in {t3-t2:.2f}s")

                    if audio_file:
                        st.audio(audio_file)
                        
                        # Read bytes to persist
                        with open(audio_file, "rb") as f:
                            audio_bytes = f.read()
                        
                        st.session_state.messages.append({
                            "role": "assistant", 
                            "content": result_text,
                            "audio": audio_bytes
                        })
                        
                        # Cleanup temp file
                        try:
                            # os.remove(audio_file) # Keep for debug
                            pass
                        except:
                            pass
                    else:
                         st.session_state.messages.append({"role": "assistant", "content": result_text})

                    with st.expander("View Source Document"):
                        for doc in response['source_documents']:
                            st.markdown(f"**Source**: {doc.metadata.get('source', 'Unknown')}")
                            st.text(doc.page_content)
                except Exception as e:
                    st.error(f"An error occurred: {e}")
                    print(f"ERROR: {e}")
