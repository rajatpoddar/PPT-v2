from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.user import User
from models.work import SitePhoto
from schemas.work import SitePhotoCreate
from middleware.auth_middleware import get_current_user
from services.file_storage import save_photo

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])


@router.post("/photo")
async def upload_photo(
    site_id: int,
    file: UploadFile = File(...),
    caption: str = None,
    photo_type: str = None,
    work_log_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    url = await save_photo(file, "site_photos")

    photo = SitePhoto(
        site_id=site_id,
        uploaded_by=current_user.id,
        photo_url=url,
        caption=caption,
        photo_type=photo_type,
        work_log_id=work_log_id,
        photo_time=datetime.utcnow()
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {
        "id": photo.id,
        "photo_url": url,
        "caption": caption,
        "photo_type": photo_type,
        "created_at": photo.created_at.isoformat()
    }


@router.post("/receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    url = await save_photo(file, "receipts")
    return {"receipt_url": url}
