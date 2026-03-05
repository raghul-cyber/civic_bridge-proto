import os
import io
import json
import logging
import boto3
import csv
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

S3_BUCKET = os.environ.get("S3_BUCKET_DATASETS", "civic-bridge-datasets-842533680239")
FAILED_PREFIX = "failed/"

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Dataset to DynamoDB Table Mapping
# format: (table_name, pk_col, sk_col, lambda_processing_func)
DATASET_CONFIG = {
    "chicago_311": {
        "table": "civic_issues",
        "pk": "issue_id",
        "sk": "reported_date",
        "mapping_func": lambda row: {
            "issue_id": row.get("sr_number", f"N/A_{datetime.now().timestamp()}"),
            "reported_date": row.get("created_date", str(datetime.now())),
            **row
        }
    },
    "census_acs": {
        "table": "civic_demographics",
        "pk": "county_fips",
        "sk": "year",
        "mapping_func": lambda row: {
            "county_fips": row.get("state", "00") + row.get("county", "000"),
            "year": "2022", # ACS 2022 dataset default
            **row
        }
    },
    "usaspending": {
        "table": "civic_budget",
        "pk": "award_id",
        "sk": "fiscal_year",
        "mapping_func": lambda row: {
            "award_id": row.get("award_id", f"UNK_{datetime.now().timestamp()}"),
            "fiscal_year": row.get("fiscal_year", "2023"),
            **row
        }
    },
    "openaq": {
        "table": "civic_environment",
        "pk": "location_id",
        "sk": "timestamp",
        "mapping_func": lambda row: {
            "location_id": str(row.get("locationId", "0")),
            "timestamp": row.get("date", {}).get("utc", str(datetime.now())),
            **row
        }
    },
    "fema_nfhl": {
        "table": "civic_hazards",
        "pk": "zone_id",
        "sk": "state",
        "mapping_func": lambda row: {
            "zone_id": row.get("FLD_ZONE", "UNKNOWN"),
            "state": row.get("STATE", "US"),
            **row
        }
    }
}

def get_latest_file(dataset_name: str) -> str:
    """Find the latest CSV file in the dataset S3 directory."""
    prefix = f"datasets/{dataset_name}/"
    response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
    
    if "Contents" not in response:
        return None
        
    latest_obj = sorted(response["Contents"], key=lambda obj: obj["LastModified"], reverse=True)[0]
    return latest_obj["Key"]

def save_failed_items(dataset_name: str, failed_items: list):
    """Save failed DynamoDB items back to S3 for manual review."""
    if not failed_items:
        return
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    failed_key = f"{FAILED_PREFIX}{dataset_name}/failed_{timestamp}.json"
    
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=failed_key,
            Body=json.dumps(failed_items)
        )
        logger.info(f"Saved {len(failed_items)} failed items to s3://{S3_BUCKET}/{failed_key}")
    except Exception as e:
        logger.error(f"Error saving failed items to S3: {e}")

def process_dataset(dataset_name: str, config: dict):
    """Read dataset from CSV and batch write to DynamoDB mapping specific columns"""
    latest_key = get_latest_file(dataset_name)
    if not latest_key:
        logger.warning(f"No files found for dataset {dataset_name}. Skipping.")
        return 0, 0
        
    logger.info(f"Processing s3://{S3_BUCKET}/{latest_key}")
    
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=latest_key)
        csv_content = response['Body'].read().decode('utf-8').splitlines()
        reader = csv.DictReader(csv_content)
        
        table_name = config["table"]
        table = dynamodb.Table(table_name)
        mapping_func = config["mapping_func"]
        
        items = []
        success_count = 0
        failed_items = []

        for row in reader:
             # Strip whitespace or empty strings to prevent schema failures
            clean_row = {k: v for k, v in row.items() if v != ""}
            item = mapping_func(clean_row)
            items.append(item)
            
        # Batch write in chunks of 25 (DynamoDB Limit)
        with table.batch_writer() as batch:
            for item in items:
                try:
                    batch.put_item(Item=item)
                    success_count += 1
                except Exception as e:
                    logger.error(f"Failed to queue item for {dataset_name}: {e}")
                    failed_items.append(item)
                    
        # Log and save failures outside of batch block (assuming client errors queue silently under exceptions above if schema failed)
        save_failed_items(dataset_name, failed_items)
            
        return success_count, len(failed_items)

    except Exception as e:
        logger.error(f"Error processing {dataset_name}: {e}")
        return 0, -1

def lambda_handler(event, context):
    """
    AWS Lambda handler function. 
    Accepts an optional payload: {"dataset": "dataset_name"} 
    to process a single dataset or else processes all datasets.
    """
    target_dataset = event.get("dataset")
    results = {}
    
    datasets_to_process = {target_dataset: DATASET_CONFIG[target_dataset]} if target_dataset and target_dataset in DATASET_CONFIG else DATASET_CONFIG

    logger.info(f"Starting seed process for: {list(datasets_to_process.keys())}")
    
    for dataset_name, config in datasets_to_process.items():
        success, failed = process_dataset(dataset_name, config)
        results[dataset_name] = {
            "success": success,
            "failed": failed
        }
        
    logger.info("Seeding complete.")
    return {
        "statusCode": 200,
        "body": json.dumps(results)
    }
