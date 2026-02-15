import traceback
try:
    from langchain_community.embeddings import OllamaEmbeddings
    print("Imported OllamaEmbeddings")
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    print("Initialized OllamaEmbeddings")
except Exception:
    traceback.print_exc()
