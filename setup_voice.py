import os
import sys
import platform
import subprocess

def print_step(step):
    print(f"\n[+] {step}")

def main():
    print_step("Checking for Piper TTS configuration...")
    
    # Check OS
    system = platform.system().lower()
    is_windows = "windows" in system
    is_linux = "linux" in system
    
    print(f"Detected OS: {system}")
    
    if is_windows:
        print("NOTE: On Windows, you typically need to download the Piper binary release.")
        print("Please download from: https://github.com/rhasspy/piper/releases")
        print("Extract it and place 'piper.exe' in a 'piper' folder in this directory.")
        
    if is_linux:
        print("On Linux/Raspberry Pi, you can often simply download the binary.")
        # In a real deployment script we might try to curl/tar it here.
        print("Ensure 'piper' executable is in your PATH or in a local 'piper' directory.")

    # Check for models
    model_name = "en_US-lessac-medium.onnx"
    model_config = "en_US-lessac-medium.onnx.json"
    
    if not os.path.exists(model_name):
        print_step(f"Downloading Service Model: {model_name}...")
        # Placeholder for download logic - for now we just instruct
        print(f"Please download {model_name} and {model_config}")
        print("from https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium")
    else:
        print(f"Model {model_name} found.")

    print_step("Voice Setup Check Complete.")

if __name__ == "__main__":
    main()
