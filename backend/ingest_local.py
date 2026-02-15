import os
import glob
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings
# Fallback
from langchain_community.embeddings import SentenceTransformerEmbeddings

import config

# Configuration
DOCS_DIR = config.DOCS_DIR
DB_DIR = config.DB_DIR
# Default to "nomic-embed-text" via Ollama, but support HF for offline robust
try:
    # Quick check if we want to use local generic
    USE_HF = True 
except:
    USE_HF = False

def create_knowledge_base():
    print(f"Checking for documents in {DOCS_DIR}...")
    if not os.path.exists(DOCS_DIR):
        os.makedirs(DOCS_DIR)
        print(f"Created {DOCS_DIR}. Please add PDFs there.")
        return

    # Find all PDFs and TXTs
    pdf_files = glob.glob(os.path.join(DOCS_DIR, "*.pdf"))
    txt_files = glob.glob(os.path.join(DOCS_DIR, "*.txt"))
    csv_files = glob.glob(os.path.join(DOCS_DIR, "*.csv"))
    
    all_files = pdf_files + txt_files + csv_files
    
    if not all_files:
        print(f"No PDF or TXT files found in {DOCS_DIR}. Please add some documents.")
        return

    documents = []
    
    # Process PDFs
    for pdf_path in pdf_files:
        print(f"Loading {pdf_path}...")
        try:
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
        except Exception as e:
            print(f"Error loading {pdf_path}: {e}")

    # Process TXTs
    for txt_path in txt_files:
        print(f"Loading {txt_path}...")
        try:
            loader = TextLoader(txt_path)
            documents.extend(loader.load())
        except Exception as e:
            print(f"Error loading {txt_path}: {e}")

    # Process CSVs
    for csv_path in csv_files:
        print(f"Loading {csv_path}...")
        try:
            loader = CSVLoader(csv_path)
            documents.extend(loader.load())
        except Exception as e:
            print(f"Error loading {csv_path}: {e}")

    if not documents:
        print("No documents loaded.")
        return

    print(f"Loaded {len(documents)} pages. Splitting text with Semantic Strategy...")
    
    # Improved Chunking for RAG
    # 1000/200 is often better for context than 500/50
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ",", ""]
    )
    splits = text_splitter.split_documents(documents)
    
    print(f"Created {len(splits)} chunks. Initializing Embeddings...")

    print(f"Created {len(splits)} chunks. Initializing Embeddings...")

    try:
        print(f"Using Ollama Embeddings ({config.EMBEDDING_MODEL})...")
        embeddings = OllamaEmbeddings(model=config.EMBEDDING_MODEL)
    except Exception as e:
        print(f"Failed to initialize Ollama Embeddings: {e}")
        return
    
    print(f"Creating Vector Database in {DB_DIR}...")
    
    # Create Local Database
    vectorstore = Chroma.from_documents(
        documents=splits, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    print(f"Knowledge Base Built Successfully in '{DB_DIR}'!")

if __name__ == "__main__":
    create_knowledge_base()
