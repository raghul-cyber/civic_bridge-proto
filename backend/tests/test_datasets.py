import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.dataset_service import (
    fetch_chicago_311, validate_chicago_311,
    fetch_census_acs, validate_census_acs,
    fetch_usaspending, validate_usaspending,
    fetch_openaq, validate_openaq,
    fetch_fema_nfhl, validate_fema_nfhl,
    upload_to_s3, DatasetScheduler
)
from api.datasets_router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

# ========================
# 1. Fetcher Tests
# ========================

@patch("services.dataset_service.requests.get")
def test_fetch_chicago_311(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = [{"sr_number": "123", "sr_type": "Pothole"}]
    df = fetch_chicago_311()
    assert not df.empty
    assert len(df) == 1
    assert "sr_number" in df.columns

def test_validate_chicago_311():
    df_valid = pd.DataFrame([{"sr_number": "123", "sr_type": "Pothole"}])
    assert validate_chicago_311(df_valid) == True
    df_invalid = pd.DataFrame([{"wrong_col": "123"}])
    assert validate_chicago_311(df_invalid) == False

@patch("services.dataset_service.requests.get")
def test_fetch_census_acs(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = [["NAME", "B01003_001E"], ["Cook County", "5000000"]]
    df = fetch_census_acs()
    assert not df.empty
    assert df.iloc[0]["NAME"] == "Cook County"

def test_validate_census_acs():
    df_valid = pd.DataFrame([{"NAME": "Cook County"}])
    assert validate_census_acs(df_valid) == True

@patch("services.dataset_service.requests.post")
def test_fetch_usaspending(mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"results": [{"shape_code": "IL"}]}
    df = fetch_usaspending()
    assert not df.empty
    assert "shape_code" in df.columns

def test_validate_usaspending():
    df_valid = pd.DataFrame([{"shape_code": "IL"}])
    assert validate_usaspending(df_valid) == True

@patch("services.dataset_service.requests.get")
def test_fetch_openaq(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"results": [{"parameter": "pm25"}]}
    df = fetch_openaq()
    assert not df.empty
    assert "parameter" in df.columns

def test_validate_openaq():
    df_valid = pd.DataFrame([{"parameter": "pm25"}])
    assert validate_openaq(df_valid) == True

@patch("services.dataset_service.requests.get")
def test_fetch_fema_nfhl(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"features": [{"attributes": {"FLD_ZONE": "A"}}]}
    df = fetch_fema_nfhl()
    assert not df.empty
    assert "FLD_ZONE" in df.columns

def test_validate_fema_nfhl():
    df_valid = pd.DataFrame([{"FLD_ZONE": "A"}])
    assert validate_fema_nfhl(df_valid) == True

# ========================
# 2. Upload / Scheduler Tests
# ========================

@patch("services.dataset_service.s3_client")
def test_upload_to_s3(mock_s3_client):
    df = pd.DataFrame([{"col1": "val1"}])
    res = upload_to_s3(df, "test_key.csv")
    assert res == True
    mock_s3_client.put_object.assert_called_once()


@patch("services.dataset_service.upload_to_s3", return_value=True)
@patch("services.dataset_service.fetch_chicago_311")
def test_scheduler_process_dataset(mock_fetch, mock_upload):
    mock_fetch.return_value = pd.DataFrame([{"sr_number": "1", "sr_type": "A"}])
    scheduler = DatasetScheduler()
    res = scheduler.process_dataset("chicago_311", fetch_chicago_311, validate_chicago_311)
    
    assert res["status"] == "ok"
    assert res["rows"] == 1


@patch("services.dataset_service.DatasetScheduler.process_dataset")
def test_scheduler_run_all(mock_process):
    mock_process.return_value = {"status": "ok", "rows": 10}
    scheduler = DatasetScheduler()
    
    res = scheduler.run_all()
    # It should have run for chicago_311, census_acs, usaspending, openaq, fema_nfhl
    assert "chicago_311" in res
    assert res["chicago_311"] == {"status": "ok", "rows": 10}


# ========================
# 3. Router Tests
# ========================

@patch("api.datasets_router.s3_client")
def test_list_datasets_endpoint(mock_s3):
    mock_s3.list_objects_v2.return_value = {
        "Contents": [{"Key": "datasets/test.csv", "Size": 100, "LastModified": "2023-01-01"}]
    }
    response = client.get("/datasets/list")
    assert response.status_code == 200
    assert "datasets" in response.json()
    assert len(response.json()["datasets"]) == 1


@patch("api.datasets_router.s3_client")
def test_get_dataset_endpoint(mock_s3):
    # Mock listing to find the latest file
    mock_s3.list_objects_v2.return_value = {
        "Contents": [{"Key": "datasets/chicago_311/data.csv", "LastModified": "2023-01-01"}]
    }
    # Mock getting the file contents
    df = pd.DataFrame([{"sr_number": "1"}])
    mock_s3.get_object.return_value = {
        "Body": MagicMock(read=MagicMock(return_value=df.to_csv(index=False).encode('utf-8')))
    }
    
    response = client.get("/datasets/chicago_311")
    assert response.status_code == 200
    assert "data" in response.json()
    assert response.json()["data"][0]["sr_number"] == 1


@patch("api.datasets_router.DatasetScheduler.run_all")
def test_refresh_datasets_endpoint(mock_run_all):
    mock_run_all.return_value = {"chicago_311": {"status": "ok", "rows": 5}}
    
    # Missing auth token
    res = client.post("/datasets/refresh")
    assert res.status_code == 403
    
    # Valid auth token
    res = client.post("/datasets/refresh", headers={"Authorization": "Bearer admin-secret-token"})
    assert res.status_code == 200
    assert res.json()["message"] == "Dataset refresh completed"
    assert res.json()["summary"]["chicago_311"]["status"] == "ok"
