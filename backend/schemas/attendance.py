from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime
from models.attendance import AttendanceStatus


class AttendanceCreate(BaseModel):
    labour_id: int
    site_id: int
    date: date
    status: AttendanceStatus
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    labour_id: int
    site_id: int
    date: date
    status: AttendanceStatus
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    marked_by: int
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BulkAttendanceItem(BaseModel):
    labour_id: int
    status: AttendanceStatus
    notes: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    site_id: int
    date: date
    records: List[BulkAttendanceItem]
