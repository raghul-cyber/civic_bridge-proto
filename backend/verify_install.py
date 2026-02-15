try:
    from langchain.chains import RetrievalQA
    print("SUCCESS: langchain.chains.RetrievalQA found.")
except ImportError as e:
    print(f"FAILURE: {e}")
    try:
        import langchain
        print(f"LangChain version: {langchain.__version__}")
        print(f"LangChain file: {langchain.__file__}")
    except:
        print("Could not import langchain to check version.")
