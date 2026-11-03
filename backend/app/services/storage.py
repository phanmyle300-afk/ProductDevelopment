import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.logging import logger

LOCAL_STORAGE_DIR = Path("data/resumes")
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


class StorageService:
    def __init__(self):
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.access_key = settings.S3_ACCESS_KEY_ID
        self.secret_key = settings.S3_SECRET_ACCESS_KEY
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.S3_REGION

        self._s3_client = None

    def _get_client(self):
        if not self._s3_client:
            try:
                self._s3_client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name=self.region,
                    config=Config(signature_version="s3v4"),
                )
                # Ensure bucket exists
                try:
                    self._s3_client.head_bucket(Bucket=self.bucket_name)
                except ClientError:
                    try:
                        self._s3_client.create_bucket(Bucket=self.bucket_name)
                        logger.info(f"Created S3/MinIO bucket: {self.bucket_name}")
                    except Exception as e:
                        logger.warning(f"Could not auto-create S3 bucket: {e}")
            except Exception as e:
                logger.warning(f"S3/MinIO client initialization failed: {e}")
                self._s3_client = None
        return self._s3_client

    async def save_file(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: str,
        candidate_id: uuid.UUID,
    ) -> Tuple[str, str, int]:
        """
        Saves file to S3-compatible storage (MinIO) with encryption or fallback to local disk.
        Returns: (file_url, stored_filename, file_size)
        """
        file_size = len(file_bytes)
        ext = Path(original_filename).suffix.lower() or ".pdf"
        safe_name = f"{candidate_id}_{int(datetime.now(timezone.utc).timestamp())}{ext}"

        client = self._get_client()
        if client:
            try:
                client.put_object(
                    Bucket=self.bucket_name,
                    Key=safe_name,
                    Body=file_bytes,
                    ContentType=content_type,
                    ServerSideEncryption="AES256",  # Server-side encryption if supported
                )
                file_url = f"{self.endpoint_url}/{self.bucket_name}/{safe_name}"
                logger.info(f"File stored successfully to S3/MinIO: {safe_name}")
                return file_url, safe_name, file_size
            except Exception as e:
                logger.warning(f"Failed to upload to S3/MinIO, falling back to local storage: {e}")

        # Local Fallback
        local_path = LOCAL_STORAGE_DIR / safe_name
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        file_url = f"file:///{local_path.resolve()}"
        logger.info(f"File stored to local disk: {local_path}")
        return file_url, safe_name, file_size

    def get_file_bytes(self, file_url: str) -> Optional[bytes]:
        """Retrieve file bytes from either S3/MinIO or local storage."""
        if file_url.startswith("file:///"):
            path_str = file_url.replace("file:///", "")
            path = Path(path_str)
            if path.exists():
                return path.read_bytes()

        client = self._get_client()
        if client and self.bucket_name in file_url:
            key = file_url.split("/")[-1]
            try:
                res = client.get_object(Bucket=self.bucket_name, Key=key)
                return res["Body"].read()
            except Exception as e:
                logger.error(f"Failed to fetch file from S3: {e}")

        return None


storage_service = StorageService()
