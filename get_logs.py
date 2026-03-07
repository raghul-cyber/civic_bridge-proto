import urllib.request
import json
import zipfile
import io

repo = 'raghul-cyber/civic_bridge-proto'
url = f'https://api.github.com/repos/{repo}/actions/runs'
req = urllib.request.Request(url, headers={'Accept': 'application/vnd.github.v3+json'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    
runs = data['workflow_runs']
if not runs:
    print('No runs found.')
    exit()

latest_run = runs[0]
print(f"Latest run ID: {latest_run['id']}, Status: {latest_run['status']}, Conclusion: {latest_run['conclusion']}")

zip_url = f"https://api.github.com/repos/{repo}/actions/runs/{latest_run['id']}/logs"
try:
    req = urllib.request.Request(zip_url, headers={'Accept': 'application/vnd.github.v3+json'})
    with urllib.request.urlopen(req) as response:
        with open("logs.zip", "wb") as f:
            f.write(response.read())
    print("Logs downloaded to logs.zip. Extracting...")
    with zipfile.ZipFile("logs.zip", "r") as zip_ref:
        zip_ref.extractall("run_logs")
    print("Extracted to run_logs/")
except Exception as e:
    print('Error downloading logs zip:', e)


