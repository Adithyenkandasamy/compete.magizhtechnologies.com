"""
Cloudinary Image Service.

Provides secure, compressed image uploads to Cloudinary for:
- User avatars (auto-face-crop, optimized square, webp/avif)
- Hackathon event banners (proportional 1600px, auto-format, auto-quality)

Includes a triple-layer compression strategy:
1. In-memory pre-upload compression (Pillow if available, gracefully optional)
2. Cloudinary signed upload transformations (q_auto:good, f_auto, dimension limits)
3. CDN delivery URL optimization (f_auto, q_auto)
"""

import hashlib
import io
import logging
import time
import uuid
from typing import Optional

from fastapi import HTTPException, status
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Optional Pillow integration for local compression before network transmission
try:
    from PIL import Image  # type: ignore
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


class CloudinaryService:
    """Service for handling signed, compressed uploads to Cloudinary."""

    def __init__(self) -> None:
        self.cloud_name = settings.cloudinary_cloud_name
        self.api_key = settings.cloudinary_api_key
        self.api_secret = settings.cloudinary_secret
        self.upload_url = f"https://api.cloudinary.com/v1_1/{self.cloud_name}/image/upload"

    def _verify_credentials(self) -> None:
        """Ensure Cloudinary credentials are set."""
        if not self.api_key or not self.api_secret or not self.cloud_name:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET) are not configured.",
            )

    def _generate_signature(self, params: dict[str, str]) -> str:
        """
        Generate Cloudinary SHA-1 signature.
        Sorts parameters alphabetically, joins with '&', appends api_secret,
        and computes sha1 hex digest.
        """
        sorted_keys = sorted(params.keys())
        to_sign = "&".join(f"{k}={params[k]}" for k in sorted_keys if params[k] is not None)
        to_sign += self.api_secret
        return hashlib.sha1(to_sign.encode("utf-8")).hexdigest()

    def _pre_compress_image(
        self,
        image_bytes: bytes,
        max_dim: int = 1600,
        quality: int = 82,
    ) -> tuple[bytes, str]:
        """
        In-memory pre-compression using Pillow if installed.
        Resizes dimensions exceeding max_dim and re-encodes to optimized JPEG/WEBP.
        """
        if not HAS_PIL:
            return image_bytes, "application/octet-stream"

        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                # Determine output format
                if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                    out_format = "WEBP"
                    content_type = "image/webp"
                else:
                    out_format = "JPEG"
                    content_type = "image/jpeg"
                    if img.mode != "RGB":
                        img = img.convert("RGB")

                # Scale down if either dimension exceeds max_dim
                width, height = img.size
                if max(width, height) > max_dim:
                    ratio = max_dim / max(width, height)
                    new_w = max(1, int(width * ratio))
                    new_h = max(1, int(height * ratio))
                    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                buffer = io.BytesIO()
                img.save(buffer, format=out_format, quality=quality, optimize=True)
                compressed_bytes = buffer.getvalue()

                # Only use compressed version if it is smaller than original
                if len(compressed_bytes) < len(image_bytes):
                    return compressed_bytes, content_type
                return image_bytes, content_type
        except Exception as e:
            logger.warning(f"PIL pre-compression skipped due to error: {e}")
            return image_bytes, "application/octet-stream"

    def _optimize_delivery_url(self, raw_url: str, is_avatar: bool = False) -> str:
        """
        Ensure Cloudinary secure_url incorporates on-the-fly CDN optimization
        (f_auto, q_auto:good) and face-crop for avatars.
        """
        if not raw_url or "/image/upload/" not in raw_url:
            return raw_url

        if is_avatar:
            # Face-centered fill, 500x500 square, auto-quality, modern webp/avif format
            transform = "c_fill,g_face,w_500,h_500,q_auto:good,f_auto"
        else:
            # Max width 1600px proportional, auto-quality, modern webp/avif format
            transform = "c_limit,w_1600,q_auto:good,f_auto"

        # Inject transformations after /image/upload/
        parts = raw_url.split("/image/upload/", 1)
        optimized_url = f"{parts[0]}/image/upload/{transform}/{parts[1]}"
        return optimized_url

    async def upload_avatar(
        self,
        image_bytes: bytes,
        filename: str = "avatar.jpg",
        user_id: Optional[uuid.UUID] = None,
    ) -> str:
        """
        Upload and compress a user avatar image to Cloudinary.
        Folder: magizh/avatars
        Transformation: c_fill,g_face,w_500,h_500,q_auto:good,f_auto
        """
        self._verify_credentials()

        # Validate minimum and maximum size (max 10MB)
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded avatar file is empty.",
            )
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar file size exceeds maximum limit of 10MB.",
            )

        # Pre-compress with max 800px square before network upload
        compressed_bytes, content_type = self._pre_compress_image(
            image_bytes, max_dim=800, quality=80
        )

        folder = "magizh/avatars"
        timestamp = str(int(time.time()))
        public_id = f"user_{user_id or uuid.uuid4()}_{timestamp}"
        transformation = "c_fill,g_face,w_500,h_500,q_auto:good,f_auto"

        params_to_sign = {
            "folder": folder,
            "public_id": public_id,
            "timestamp": timestamp,
            "transformation": transformation,
        }
        sig = self._generate_signature(params_to_sign)

        form_data = {
            "api_key": self.api_key,
            "timestamp": timestamp,
            "signature": sig,
            "folder": folder,
            "public_id": public_id,
            "transformation": transformation,
        }

        files = {
            "file": (filename, compressed_bytes, content_type),
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.upload_url,
                    data=form_data,
                    files=files,
                )
            except Exception as e:
                logger.error(f"Failed connecting to Cloudinary: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to connect to Cloudinary image storage service.",
                )

        if response.status_code != 200:
            logger.error(f"Cloudinary avatar upload error ({response.status_code}): {response.text}")
            err_detail = "Failed to upload avatar to Cloudinary."
            try:
                err_data = response.json()
                if "error" in err_data and "message" in err_data["error"]:
                    err_detail = f"Cloudinary error: {err_data['error']['message']}"
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=err_detail,
            )

        data = response.json()
        raw_url = data.get("secure_url") or data.get("url")
        if not raw_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Cloudinary did not return a valid secure URL.",
            )

        return self._optimize_delivery_url(raw_url, is_avatar=True)

    async def upload_event_banner(
        self,
        image_bytes: bytes,
        filename: str = "banner.jpg",
        event_id: Optional[uuid.UUID] = None,
    ) -> str:
        """
        Upload and compress a hackathon event banner image to Cloudinary.
        Folder: magizh/banners
        Transformation: c_limit,w_1600,q_auto:good,f_auto
        """
        self._verify_credentials()

        # Validate minimum and maximum size (max 15MB)
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded banner file is empty.",
            )
        if len(image_bytes) > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event banner file size exceeds maximum limit of 15MB.",
            )

        # Pre-compress to max 1600px width before network upload
        compressed_bytes, content_type = self._pre_compress_image(
            image_bytes, max_dim=1600, quality=82
        )

        folder = "magizh/banners"
        timestamp = str(int(time.time()))
        public_id = f"event_{event_id or uuid.uuid4()}_{timestamp}"
        transformation = "c_limit,w_1600,q_auto:good,f_auto"

        params_to_sign = {
            "folder": folder,
            "public_id": public_id,
            "timestamp": timestamp,
            "transformation": transformation,
        }
        sig = self._generate_signature(params_to_sign)

        form_data = {
            "api_key": self.api_key,
            "timestamp": timestamp,
            "signature": sig,
            "folder": folder,
            "public_id": public_id,
            "transformation": transformation,
        }

        files = {
            "file": (filename, compressed_bytes, content_type),
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(
                    self.upload_url,
                    data=form_data,
                    files=files,
                )
            except Exception as e:
                logger.error(f"Failed connecting to Cloudinary: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to connect to Cloudinary image storage service.",
                )

        if response.status_code != 200:
            logger.error(f"Cloudinary banner upload error ({response.status_code}): {response.text}")
            err_detail = "Failed to upload banner to Cloudinary."
            try:
                err_data = response.json()
                if "error" in err_data and "message" in err_data["error"]:
                    err_detail = f"Cloudinary error: {err_data['error']['message']}"
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=err_detail,
            )

        data = response.json()
        raw_url = data.get("secure_url") or data.get("url")
        if not raw_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Cloudinary did not return a valid secure URL.",
            )

        return self._optimize_delivery_url(raw_url, is_avatar=False)


cloudinary_service = CloudinaryService()
