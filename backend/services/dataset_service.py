import os
import io
import logging
import requests
import pandas as pd
import concurrent.futures
from datetime import datetime
from dotenv import load_dotenv
from services.aws_service import get_boto3_client

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

S3_BUCKET_DATASETS = os.getenv("S3_BUCKET_DATASETS", "civic-bridge-datasets-842533680239")
CENSUS_KEY = os.getenv("CENSUS_API_KEY", "")

s3_client = get_boto3_client('s3')

def upload_to_s3(df: pd.DataFrame, key: str) -> bool:
    """Uploads a pandas DataFrame as a CSV file to S3."""
    try:
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        s3_client.put_object(
            Bucket=S3_BUCKET_DATASETS,
            Key=key,
            Body=csv_buffer.getvalue()
        )
        return True
    except Exception as e:
        logger.error(f"Failed to upload {key} to S3: {e}")
        return False

# --- Chicago 311 ---
def fetch_chicago_311() -> pd.DataFrame:
    url = "https://data.cityofchicago.org/resource/v6vf-nfxy.json?$limit=5000"
    response = requests.get(url)
    response.raise_for_status()
    return pd.DataFrame(response.json())

def validate_chicago_311(df: pd.DataFrame) -> bool:
    if df.empty:
        return False
    required_cols = ['sr_number', 'sr_type']
    return all(col in df.columns for col in required_cols)

# --- US Census ACS ---
def fetch_census_acs() -> pd.DataFrame:
    if not CENSUS_KEY:
        logger.warning("CENSUS_API_KEY not set in environment.")
    url = f"https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&for=county:*&in=state:*&key={CENSUS_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    if data:
        # First row contains headers
        return pd.DataFrame(data[1:], columns=data[0])
    return pd.DataFrame()

def validate_census_acs(df: pd.DataFrame) -> bool:
    return not df.empty and 'NAME' in df.columns

# --- USASpending.gov ---
def fetch_usaspending() -> pd.DataFrame:
    url = "https://api.usaspending.gov/api/v2/search/spending_by_geography/"
    payload = {
        "scope": "place_of_performance",
        "geo_layer": "state",
        "filters": {
            "time_period": [{"start_date": "2023-01-01", "end_date": "2024-12-31"}]
        }
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    return pd.DataFrame(data.get("results", []))

def validate_usaspending(df: pd.DataFrame) -> bool:
    return not df.empty and 'shape_code' in df.columns

# --- OpenAQ ---
def fetch_openaq() -> pd.DataFrame:
    url = "https://api.openaq.org/v2/measurements?limit=1000&country=US"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    return pd.DataFrame(data.get("results", []))

def validate_openaq(df: pd.DataFrame) -> bool:
    return not df.empty and 'parameter' in df.columns

# --- FEMA NFHL ---
def fetch_fema_nfhl() -> pd.DataFrame:
    url = "https://msc.fema.gov/arcgis/rest/services/NFHL/NFHL_Available/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=500"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    features = data.get("features", [])
    attributes = [f.get("attributes", {}) for f in features]
    return pd.DataFrame(attributes)

def validate_fema_nfhl(df: pd.DataFrame) -> bool:
    return not df.empty

# --- Dataset Scheduler ---
class DatasetScheduler:
    def __init__(self):
        self.datasets = {
            "chicago_311": (fetch_chicago_311, validate_chicago_311),
            "census_acs": (fetch_census_acs, validate_census_acs),
            "usaspending": (fetch_usaspending, validate_usaspending),
            "openaq": (fetch_openaq, validate_openaq),
            "fema_nfhl": (fetch_fema_nfhl, validate_fema_nfhl)
        }

    def process_dataset(self, name: str, fetch_fn, validate_fn) -> dict:
        result = {"status": "error", "rows": 0}
        try:
            df = fetch_fn()
            if validate_fn(df):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                s3_key = f"datasets/{name}/{name}_{timestamp}.csv"
                if upload_to_s3(df, s3_key):
                    logger.info(f"[{name}] Successfully uploaded {len(df)} rows to S3.")
                    result = {"status": "ok", "rows": len(df)}
                else:
                    logger.error(f"[{name}] S3 upload failed.")
            else:
                logger.error(f"[{name}] Validation failed. Dropping dataframe.")
        except Exception as e:
            logger.error(f"[{name}] Fetch/Process failed: {e}")
        
        return result

    def run_all(self):
        """Runs all fetchers in parallel and logs output status summary."""
        summary = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_dataset = {
                executor.submit(self.process_dataset, name, f, v): name
                for name, (f, v) in self.datasets.items()
            }
            for future in concurrent.futures.as_completed(future_to_dataset):
                name = future_to_dataset[future]
                try:
                    summary[name] = future.result()
                except Exception as exc:
                    summary[name] = {"status": "error", "rows": 0}
                    logger.error(f"Dataset {name} generated an exception: {exc}")
        return summary
