import os
import glob
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings

# Configuration
DOCS_DIR = "local_docs"
DB_DIR = "village_db"
EMBEDDING_MODEL = "nomic-embed-text"

def create_knowledge_base():
    print(f"Checking for documents in {DOCS_DIR}...")
    
    # Find all PDFs in the directory
    pdf_files = glob.glob(os.path.join(DOCS_DIR, "*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {DOCS_DIR}. Please add some '.pdf' files.")
        return

    documents = []
    for pdf_path in pdf_files:
        print(f"Loading {pdf_path}...")
        try:
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
        except Exception as e:
            print(f"Error loading {pdf_path}: {e}")

    if not documents:
        print("No documents loaded.")
        return

    print(f"Loaded {len(documents)} pages. Splitting text...")
    
    # Split into chunks (smaller chunks are better for small models)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    splits = text_splitter.split_documents(documents)
    
    print(f"Created {len(splits)} chunks. Creating Vector Database with {EMBEDDING_MODEL}...")

    # Initialize Embeddings
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)
    
    # Create Local Database
    # Chroma handles persistence automatically in newer versions if persist_directory is set
    vectorstore = Chroma.from_documents(
        documents=splits, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    print(f"Knowledge Base Built Locally in '{DB_DIR}'!")

if __name__ == "__main__":
    create_knowledge_base()
