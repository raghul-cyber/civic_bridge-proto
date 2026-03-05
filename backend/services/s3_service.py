import os
import io
import uuid
import logging
from datetime import datetime
import boto3
import pandas as pd
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_MEDIA = os.getenv("S3_BUCKET_MEDIA", "civic-bridge-media-842533680239")
S3_BUCKET_DATASETS = os.getenv("S3_BUCKET_DATASETS", "civic-bridge-datasets-842533680239")
AMPLIFY_DOMAIN = os.getenv("AMPLIFY_DOMAIN", "https://*.amplifyapp.com")

s3_client = boto3.client("s3", region_name=AWS_REGION)


class S3Service:
    """
    Complete S3 integration for CivicBridge.
    Handles uploads, downloads, presigning, lifecycle policies,
    and CORS configuration for both media and dataset buckets.
    """

    def __init__(self):
        self.client = s3_client
        self.media_bucket = S3_BUCKET_MEDIA
        self.datasets_bucket = S3_BUCKET_DATASETS

    # ═══════════════════════════════════════════
    # 1. Upload Operations
    # ═══════════════════════════════════════════

    def upload_file(
        self,
        file_bytes: bytes,
        bucket: str,
        key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Uploads raw bytes to S3 and returns a presigned URL.

        Args:
            file_bytes:   Raw file content.
            bucket:       Target bucket name.
            key:          S3 object key.
            content_type: MIME type.

        Returns:
            Presigned URL (1 h expiry).
        """
        try:
            self.client.put_object(
                Bucket=bucket,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
            )
            url = self.get_presigned_url(bucket, key, expires_in=3600)
            logger.info(f"Uploaded {len(file_bytes)} bytes → s3://{bucket}/{key}")
            return url
        except ClientError as e:
            logger.error(f"upload_file failed: {e}")
            raise

    def upload_issue_photo(
        self, issue_id: str, photo_bytes: bytes, filename: str
    ) -> str:
        """
        Uploads a citizen photo for an issue, compressing if > 5 MB.

        Key pattern: uploads/issues/{issue_id}/{uuid}_{filename}
        Returns a presigned URL valid for 7 days.
        """
        # Compress if larger than 5 MB
        if len(photo_bytes) > 5 * 1024 * 1024:
            photo_bytes = self._compress_image(photo_bytes)

        safe_name = filename.replace(" ", "_")
        key = f"uploads/issues/{issue_id}/{uuid.uuid4().hex[:8]}_{safe_name}"

        content_type = "image/jpeg"
        if filename.lower().endswith(".png"):
            content_type = "image/png"
        elif filename.lower().endswith(".webp"):
            content_type = "image/webp"

        try:
            self.client.put_object(
                Bucket=self.media_bucket,
                Key=key,
                Body=photo_bytes,
                ContentType=content_type,
            )
            url = self.get_presigned_url(
                self.media_bucket, key, expires_in=7 * 24 * 3600  # 7 days
            )
            logger.info(f"Issue photo uploaded → {key}")
            return url
        except ClientError as e:
            logger.error(f"upload_issue_photo failed: {e}")
            raise

    @staticmethod
    def _compress_image(image_bytes: bytes, max_size: int = 5 * 1024 * 1024) -> bytes:
        """Compress an image using Pillow until it's under max_size."""
        try:
            from PIL import Image

            img = Image.open(io.BytesIO(image_bytes))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            quality = 85
            while quality > 10:
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=quality, optimize=True)
                compressed = buf.getvalue()
                if len(compressed) <= max_size:
                    logger.info(
                        f"Image compressed: {len(image_bytes)} → {len(compressed)} bytes (q={quality})"
                    )
                    return compressed
                quality -= 10

            return compressed  # Return best effort
        except ImportError:
            logger.warning("Pillow not installed — skipping compression")
            return image_bytes

    # ═══════════════════════════════════════════
    # 2. Download Operations
    # ═══════════════════════════════════════════

    def get_presigned_url(
        self, bucket: str, key: str, expires_in: int = 3600
    ) -> str:
        """Generate a presigned GET URL."""
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except ClientError as e:
            logger.error(f"get_presigned_url failed: {e}")
            raise

    def download_file(self, bucket: str, key: str) -> bytes:
        """Download an S3 object and return its bytes."""
        try:
            response = self.client.get_object(Bucket=bucket, Key=key)
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"download_file failed: {e}")
            raise

    # ═══════════════════════════════════════════
    # 3. Dataset Operations
    # ═══════════════════════════════════════════

    def list_dataset_files(self, prefix: str = "datasets/") -> list[dict]:
        """
        Lists all objects under a prefix in the datasets bucket.

        Returns:
            List of dicts with name, size, last_modified.
        """
        try:
            paginator = self.client.get_paginator("list_objects_v2")
            files = []
            for page in paginator.paginate(Bucket=self.datasets_bucket, Prefix=prefix):
                for obj in page.get("Contents", []):
                    files.append(
                        {
                            "name": obj["Key"],
                            "size": obj["Size"],
                            "last_modified": obj["LastModified"].isoformat(),
                        }
                    )
            return files
        except ClientError as e:
            logger.error(f"list_dataset_files failed: {e}")
            return []

    def get_latest_dataset(self, dataset_name: str) -> pd.DataFrame:
        """
        Finds the most recent CSV for a named dataset and returns a DataFrame.
        Looks under processed/{dataset_name}/ first, then raw/{dataset_name}/.
        """
        for prefix in [f"processed/{dataset_name}/", f"raw/{dataset_name}/"]:
            files = self.list_dataset_files(prefix)
            if files:
                latest = sorted(files, key=lambda f: f["last_modified"], reverse=True)[0]
                csv_bytes = self.download_file(self.datasets_bucket, latest["name"])
                return pd.read_csv(io.BytesIO(csv_bytes))

        logger.warning(f"No dataset files found for {dataset_name}")
        return pd.DataFrame()

    # ═══════════════════════════════════════════
    # 4. Lifecycle Policy Setup
    # ═══════════════════════════════════════════

    def setup_lifecycle_policies(self):
        """
        Configures S3 lifecycle rules:
          - audio/uploads/   → delete after 30 days
          - tts/cache/       → delete after 90 days
          - raw/             → transition to Glacier after 180 days
        """
        # ── Media bucket ──
        media_rules = [
            {
                "ID": "delete-audio-uploads-30d",
                "Filter": {"Prefix": "audio/uploads/"},
                "Status": "Enabled",
                "Expiration": {"Days": 30},
            },
            {
                "ID": "delete-tts-cache-90d",
                "Filter": {"Prefix": "tts/cache/"},
                "Status": "Enabled",
                "Expiration": {"Days": 90},
            },
        ]

        try:
            self.client.put_bucket_lifecycle_configuration(
                Bucket=self.media_bucket,
                LifecycleConfiguration={"Rules": media_rules},
            )
            logger.info(f"Lifecycle policies set on {self.media_bucket}")
        except ClientError as e:
            logger.error(f"Failed to set lifecycle on {self.media_bucket}: {e}")

        # ── Datasets bucket ──
        dataset_rules = [
            {
                "ID": "archive-raw-datasets-180d",
                "Filter": {"Prefix": "raw/"},
                "Status": "Enabled",
                "Transitions": [
                    {"Days": 180, "StorageClass": "GLACIER"}
                ],
            },
        ]

        try:
            self.client.put_bucket_lifecycle_configuration(
                Bucket=self.datasets_bucket,
                LifecycleConfiguration={"Rules": dataset_rules},
            )
            logger.info(f"Lifecycle policies set on {self.datasets_bucket}")
        except ClientError as e:
            logger.error(f"Failed to set lifecycle on {self.datasets_bucket}: {e}")

    # ═══════════════════════════════════════════
    # 5. CORS Configuration
    # ═══════════════════════════════════════════

    def setup_cors(self):
        """
        Applies CORS rules to both buckets allowing the Amplify domain
        and localhost for development.
        """
        cors_config = {
            "CORSRules": [
                {
                    "AllowedOrigins": [
                        AMPLIFY_DOMAIN,
                        "http://localhost:5173",
                        "http://localhost:3000",
                    ],
                    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                    "AllowedHeaders": ["*"],
                    "ExposeHeaders": ["ETag", "Content-Length"],
                    "MaxAgeSeconds": 3600,
                }
            ]
        }

        for bucket in [self.media_bucket, self.datasets_bucket]:
            try:
                self.client.put_bucket_cors(
                    Bucket=bucket, CORSConfiguration=cors_config
                )
                logger.info(f"CORS configured on {bucket}")
            except ClientError as e:
                logger.error(f"CORS setup failed on {bucket}: {e}")


# Singleton
s3_service = S3Service()
