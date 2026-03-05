"""
civic-dataset-ingest — Lambda handler
Trigger: EventBridge Scheduler — cron(0 2 * * ? *) daily 2 AM UTC
Fetches data from all public APIs, stores raw CSV in S3,
and batch-writes into DynamoDB tables.
"""

import os
import io
import json
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
import pandas as pd
import requests

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

S3_BUCKET = os.environ.get("S3_BUCKET_DATASETS", "civic-bridge-datasets-842533680239")
CENSUS_KEY = os.environ.get("CENSUS_API_KEY", "")

# ═══════════════════════════════════════════════════════════════
# Dataset Fetchers
# ═══════════════════════════════════════════════════════════════

def fetch_311():
    """Chicago 311 Service Requests."""
    url = "https://data.cityofchicago.org/resource/v6vf-nfxy.json?$limit=5000"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    return pd.DataFrame(resp.json()), "311"


def fetch_census():
    """US Census ACS 5-Year Estimates."""
    url = f"https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&for=county:*&in=state:*&key={CENSUS_KEY}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    df = pd.DataFrame(data[1:], columns=data[0])
    return df, "census"


def fetch_usaspending():
    """USASpending.gov federal awards by state."""
    url = "https://api.usaspending.gov/api/v2/search/spending_by_geography/"
    payload = {
        "scope": "place_of_performance",
        "geo_layer": "state",
        "filters": {
            "time_period": [{"start_date": "2023-01-01", "end_date": "2024-12-31"}]
        }
    }
    resp = requests.post(url, json=payload, timeout=60)
    resp.raise_for_status()
    results = resp.json().get("results", [])
    return pd.DataFrame(results), "budget"


def fetch_openaq():
    """OpenAQ air quality measurements."""
    url = "https://api.openaq.org/v2/measurements?limit=1000&country=US"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    results = resp.json().get("results", [])
    return pd.DataFrame(results), "airquality"


def fetch_fema():
    """FEMA National Flood Hazard Layer."""
    url = (
        "https://msc.fema.gov/arcgis/rest/services/NFHL/NFHL_Available/FeatureServer/0/query"
        "?where=1%3D1&outFields=*&f=json&resultRecordCount=1000"
    )
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    features = resp.json().get("features", [])
    rows = [f.get("attributes", {}) for f in features]
    return pd.DataFrame(rows), "fema"


FETCHERS = [fetch_311, fetch_census, fetch_usaspending, fetch_openaq, fetch_fema]

# ── DynamoDB table mapping ──
TABLE_MAP = {
    "311":        {"table": "civic_issues",        "pk": "issue_id",    "sk": "reported_date"},
    "census":     {"table": "civic_demographics",  "pk": "county_fips", "sk": "year"},
    "budget":     {"table": "civic_budget",        "pk": "award_id",    "sk": "fiscal_year"},
    "airquality": {"table": "civic_environment",   "pk": "location_id", "sk": "timestamp"},
    "fema":       {"table": "civic_hazards",       "pk": "zone_id",     "sk": "state"},
}


def upload_to_s3(df: pd.DataFrame, dataset: str) -> str:
    """Upload DataFrame as CSV to S3 processed/ folder."""
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    key = f"processed/{dataset}/{date_str}.csv"
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    s3.put_object(
        Bucket=S3_BUCKET, Key=key,
        Body=csv_buffer.getvalue(), ContentType="text/csv"
    )
    logger.info(f"Uploaded {len(df)} rows → s3://{S3_BUCKET}/{key}")
    return key


def seed_dynamo(df: pd.DataFrame, dataset: str):
    """Batch-write DataFrame rows into DynamoDB."""
    mapping = TABLE_MAP.get(dataset)
    if not mapping:
        logger.warning(f"No DynamoDB mapping for dataset: {dataset}")
        return 0

    table = dynamodb.Table(mapping["table"])
    count = 0
    with table.batch_writer() as batch:
        for _, row in df.iterrows():
            item = {k: str(v) for k, v in row.to_dict().items() if v is not None and str(v).strip()}
            if not item:
                continue
            batch.put_item(Item=item)
            count += 1

    logger.info(f"Seeded {count} rows → {mapping['table']}")
    return count


def process_dataset(fetcher):
    """Fetch → upload to S3 → seed DynamoDB for a single dataset."""
    name = fetcher.__name__.replace("fetch_", "")
    try:
        df, dataset = fetcher()
        if df.empty:
            return {"dataset": name, "status": "empty", "rows": 0}

        upload_to_s3(df, dataset)
        count = seed_dynamo(df, dataset)
        return {"dataset": name, "status": "success", "rows": count}
    except Exception as e:
        logger.error(f"Failed to process {name}: {e}")
        return {"dataset": name, "status": "error", "error": str(e)}


def handler(event, context):
    """Lambda entry-point — triggered by EventBridge daily schedule."""
    logger.info(f"Dataset ingestion started at {datetime.utcnow().isoformat()}")

    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_dataset, f): f.__name__ for f in FETCHERS}
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            logger.info(f"  {result['dataset']}: {result['status']}")

    summary = {
        "timestamp": datetime.utcnow().isoformat(),
        "results": results,
        "total_success": sum(1 for r in results if r["status"] == "success"),
        "total_errors": sum(1 for r in results if r["status"] == "error"),
    }
    logger.info(f"Ingestion summary: {json.dumps(summary)}")

    return {"statusCode": 200, "body": json.dumps(summary, default=str)}
