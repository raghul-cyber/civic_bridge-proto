import os
import langchain
try:
    path = os.path.dirname(langchain.__file__)
    print(f"Path: {path}")
    print("Contents:")
    print(os.listdir(path))
except Exception as e:
    print(e)
