import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import io
from config import settings


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def ensure_upload_dirs():
    """Create upload directories if they don't exist."""
    dirs = [
        Path(settings.UPLOAD_DIR) / "site_photos",
        Path(settings.UPLOAD_DIR) / "receipts",
        Path(settings.UPLOAD_DIR) / "labour_photos",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)


async def save_photo(file: UploadFile, folder: str = "site_photos") -> str:
    """Save an uploaded photo and return its URL path."""
    ensure_upload_dirs()

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, WebP)")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Compress image
    try:
        img = Image.open(io.BytesIO(content))
        # Convert to RGB if needed (for PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Resize if too large (max 1920px on longest side)
        max_size = 1920
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size), Image.LANCZOS)

        # Save compressed
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        content = output.getvalue()
    except Exception:
        pass  # If compression fails, save original

    filename = f"{uuid.uuid4()}.jpg"
    file_path = Path(settings.UPLOAD_DIR) / folder / filename

    with open(file_path, "wb") as f:
        f.write(content)

    return f"/uploads/{folder}/{filename}"


def delete_file(file_url: str):
    """Delete a file by its URL path."""
    if not file_url:
        return
    # Convert URL to filesystem path
    relative_path = file_url.lstrip("/")
    file_path = Path(relative_path)
    if file_path.exists():
        file_path.unlink()
