from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database import get_db
from models.user import User
from models.attendance import Attendance, AttendanceStatus
from models.labour import SiteLabour
from schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse, BulkAttendanceCreate
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/v1/attendance", tags=["attendance"])


@router.post("/bulk")
def bulk_mark_attendance(
    data: BulkAttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk mark attendance for a site on a date. Upserts records."""
    results = []
    for record in data.records:
        existing = db.query(Attendance).filter(
            Attendance.labour_id == record.labour_id,
            Attendance.site_id == data.site_id,
            Attendance.date == data.date
        ).first()

        if existing:
            existing.status = record.status
            existing.marked_by = current_user.id
            if record.notes:
                existing.notes = record.notes
            results.append(existing)
        else:
            attendance = Attendance(
                labour_id=record.labour_id,
                site_id=data.site_id,
                date=data.date,
                status=record.status,
                marked_by=current_user.id,
                notes=record.notes
            )
            db.add(attendance)
            results.append(attendance)

    db.commit()
    return {"message": f"Attendance marked for {len(results)} labours", "count": len(results)}


@router.get("/{site_id}/{att_date}")
def get_attendance(
    site_id: int,
    att_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(Attendance).filter(
        Attendance.site_id == site_id,
        Attendance.date == att_date
    ).all()
    return [
        {
            "id": r.id,
            "labour_id": r.labour_id,
            "status": r.status,
            "notes": r.notes
        } for r in records
    ]


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    data: AttendanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    record.marked_by = current_user.id
    db.commit()
    db.refresh(record)
    return record
