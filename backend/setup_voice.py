import os
import sys
import platform
import subprocess
import urllib.request
import zipfile
import tarfile
import shutil
import config

def print_step(step):
    print(f"\n[+] {step}")

def download_file(url, dest_path):
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, dest_path)
        print(f"Downloaded to {dest_path}")
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def extract_archive(archive_path, extract_to):
    print(f"Extracting {archive_path} to {extract_to}...")
    try:
        if archive_path.endswith(".zip"):
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                zip_ref.extractall(extract_to)
        elif archive_path.endswith(".tar.gz") or archive_path.endswith(".tgz"):
            with tarfile.open(archive_path, "r:gz") as tar_ref:
                tar_ref.extractall(extract_to)
        return True
    except Exception as e:
        print(f"Error extracting {archive_path}: {e}")
        return False

def setup_piper():
    if os.path.exists(config.PIPER_BINARY):
        print(f"Piper binary found at {config.PIPER_BINARY}")
        return True

    print_step("Piper binary not found. Attempting to download...")
    
    system = platform.system().lower()
    is_windows = "windows" in system
    is_linux = "linux" in system
    machine = platform.machine().lower()

    url = None
    archive_name = "piper_archive"

    if is_windows:
        url = config.PIPER_WINDOWS_URL
        archive_name += ".zip"
    elif is_linux and "x86_64" in machine:
        url = config.PIPER_LINUX_URL
        archive_name += ".tar.gz"
    else:
        print("Automatic download only supported for Windows (amd64) and Linux (x86_64).")
        print("Please manually download Piper for your architecture from: https://github.com/rhasspy/piper/releases")
        return False

    if download_file(url, archive_name):
        if extract_archive(archive_name, config.BASE_DIR):
            # Cleanup
            os.remove(archive_name)
            
            # The archive typically extracts to a folder named 'piper'. 
            # Our config expects 'piper/piper.exe' inside BASE_DIR/piper.
            
            # Check if it extracted to a subfolder
            extracted_piper_dir = os.path.join(config.BASE_DIR, "piper")
            if os.path.exists(extracted_piper_dir) and os.path.isdir(extracted_piper_dir):
                 # Check if the binary is directly here or in a nested 'piper' folder
                 # Windows zip often has top level 'piper/'
                 pass 
            
            if os.path.exists(config.PIPER_BINARY):
                print("Piper setup successful.")
                return True
            else:
                 print(f"Extraction successful but binary not found at {config.PIPER_BINARY}. Check folder structure.")
                 # Debug listing
                 print(f"Contents of {config.BASE_DIR}: {os.listdir(config.BASE_DIR)}")
                 if os.path.exists(extracted_piper_dir):
                     print(f"Contents of {extracted_piper_dir}: {os.listdir(extracted_piper_dir)}")
                 return False
        else:
            return False
    return False

def setup_voice_model():
    if os.path.exists(config.VOICE_MODEL_PATH) and os.path.exists(config.VOICE_MODEL_CONFIG_PATH):
        print(f"Voice model found: {config.VOICE_MODEL_NAME}")
        return True
    
    print_step(f"Downloading Voice Model: {config.VOICE_MODEL_NAME}...")
    
    # Download .onnx
    if not os.path.exists(config.VOICE_MODEL_PATH):
        if not download_file(config.VOICE_MODEL_URL, config.VOICE_MODEL_PATH):
            return False

    # Download .json
    if not os.path.exists(config.VOICE_MODEL_CONFIG_PATH):
        if not download_file(config.VOICE_MODEL_CONFIG_URL, config.VOICE_MODEL_CONFIG_PATH):
            return False
            
    print("Voice model setup successful.")
    return True

def main():
    print("--- Civic Bridge / Village Node Setup ---")
    
    # 1. Setup Piper
    if setup_piper():
        print("[OK] Piper is ready.")
    else:
        print("[FAIL] Piper setup failed. Voice features may not work.")

    # 2. Setup Voice Model
    if setup_voice_model():
        print("[OK] Voice model is ready.")
    else:
        print("[FAIL] Voice model setup failed.")

    print("\nSetup Complete.")

if __name__ == "__main__":
    main()
