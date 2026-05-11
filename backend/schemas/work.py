from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.work import WeatherCondition, PhotoType


class WorkLogCreate(BaseModel):
    work_item_id: int
    log_date: date
    quantity_done: Optional[Decimal] = None  # auto-calculated for m3
    length_m: Optional[Decimal] = None
    width_m: Optional[Decimal] = None
    height_m: Optional[Decimal] = None
    quantity_unit: Optional[str] = None
    remarks: Optional[str] = None
    weather: Optional[WeatherCondition] = None


class WorkLogResponse(BaseModel):
    id: int
    site_id: int
    work_item_id: int
    logged_by: int
    log_date: date
    quantity_done: Decimal
    length_m: Optional[Decimal] = None
    width_m: Optional[Decimal] = None
    height_m: Optional[Decimal] = None
    quantity_unit: Optional[str] = None
    remarks: Optional[str] = None
    weather: Optional[WeatherCondition] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SitePhotoCreate(BaseModel):
    caption: Optional[str] = None
    photo_type: Optional[PhotoType] = None
    work_log_id: Optional[int] = None


class SitePhotoResponse(BaseModel):
    id: int
    site_id: int
    work_log_id: Optional[int] = None
    uploaded_by: int
    photo_url: str
    caption: Optional[str] = None
    photo_time: Optional[datetime] = None
    photo_type: Optional[PhotoType] = None
    created_at: datetime

    class Config:
        from_attributes = True
