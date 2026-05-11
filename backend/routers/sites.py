from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User, UserRole
from models.site import Site, SiteWorkItem, SiteStatus
from models.work import WorkLog, SitePhoto
from models.labour import SiteLabour, Labour
from models.attendance import Attendance, AttendanceStatus
from schemas.site import SiteCreate, SiteUpdate, SiteResponse, SiteWorkItemCreate, SiteWorkItemUpdate, SiteWorkItemResponse
from schemas.work import WorkLogCreate, WorkLogResponse
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.calculations import calculate_site_earnings, calculate_net_profit, calculate_quantity

router = APIRouter(prefix="/api/v1/sites", tags=["sites"])


def check_site_access(site: Site, current_user: User):
    if current_user.role == UserRole.owner and site.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.site_incharge and site.site_incharge_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this site")


@router.get("", response_model=List[SiteResponse])
def list_sites(
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.owner:
        query = db.query(Site).filter(Site.owner_id == current_user.id)
    elif current_user.role == UserRole.site_incharge:
        query = db.query(Site).filter(Site.site_incharge_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    if status:
        query = query.filter(Site.status == status)
    if project_type:
        query = query.filter(Site.project_type == project_type)
    if search:
        query = query.filter(
            Site.name.ilike(f"%{search}%") | Site.main_contractor_name.ilike(f"%{search}%")
        )
    return query.all()


@router.post("", response_model=SiteResponse)
def create_site(
    site_data: SiteCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    site = Site(**site_data.model_dump(), owner_id=current_user.id)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)
    return site


@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: int,
    site_data: SiteUpdate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id, Site.owner_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    for field, value in site_data.model_dump(exclude_unset=True).items():
        setattr(site, field, value)
    db.commit()
    db.refresh(site)
    return site


# Work Items
@router.get("/{site_id}/work-items", response_model=List[SiteWorkItemResponse])
def get_work_items(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)
    return db.query(SiteWorkItem).filter(SiteWorkItem.site_id == site_id).all()


@router.post("/{site_id}/work-items", response_model=SiteWorkItemResponse)
def add_work_item(
    site_id: int,
    item_data: SiteWorkItemCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id, Site.owner_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Auto-fill unit label if not provided
    unit_labels = {
        "running_meter": "Running Meter",
        "m3": "Cubic Meter",
        "sqm": "Square Meter",
        "lumpsum": "Lump Sum",
        "per_unit": "Unit"
    }
    if not item_data.unit_label:
        item_data.unit_label = unit_labels.get(item_data.work_type, "Unit")

    item = SiteWorkItem(**item_data.model_dump(), site_id=site_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{site_id}/work-items/{item_id}", response_model=SiteWorkItemResponse)
def update_work_item(
    site_id: int,
    item_id: int,
    item_data: SiteWorkItemUpdate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    item = db.query(SiteWorkItem).filter(SiteWorkItem.id == item_id, SiteWorkItem.site_id == site_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    for field, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{site_id}/work-items/{item_id}")
def delete_work_item(
    site_id: int,
    item_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    item = db.query(SiteWorkItem).filter(SiteWorkItem.id == item_id, SiteWorkItem.site_id == site_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    db.delete(item)
    db.commit()
    return {"message": "Work item deleted"}


# Work Logs
@router.get("/{site_id}/work-logs")
def get_work_logs(
    site_id: int,
    log_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)

    query = db.query(WorkLog).filter(WorkLog.site_id == site_id)
    if log_date:
        query = query.filter(WorkLog.log_date == log_date)

    logs = query.order_by(WorkLog.log_date.desc(), WorkLog.created_at.desc()).all()
    result = []
    for log in logs:
        work_item = db.query(SiteWorkItem).filter(SiteWorkItem.id == log.work_item_id).first()
        result.append({
            "id": log.id,
            "work_item_id": log.work_item_id,
            "work_item_name": work_item.work_name if work_item else "",
            "work_type": work_item.work_type if work_item else "",
            "rate_per_unit": float(work_item.rate_per_unit) if work_item else 0,
            "unit_label": work_item.unit_label if work_item else "",
            "log_date": log.log_date.isoformat(),
            "quantity_done": float(log.quantity_done),
            "length_m": float(log.length_m) if log.length_m else None,
            "width_m": float(log.width_m) if log.width_m else None,
            "height_m": float(log.height_m) if log.height_m else None,
            "earned": float(log.quantity_done) * float(work_item.rate_per_unit) if work_item else 0,
            "remarks": log.remarks,
            "weather": log.weather,
            "logged_by": log.logged_by
        })
    return result


@router.post("/{site_id}/work-logs", response_model=WorkLogResponse)
def add_work_log(
    site_id: int,
    log_data: WorkLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)

    work_item = db.query(SiteWorkItem).filter(
        SiteWorkItem.id == log_data.work_item_id,
        SiteWorkItem.site_id == site_id
    ).first()
    if not work_item:
        raise HTTPException(status_code=404, detail="Work item not found")

    # Calculate quantity
    qty = calculate_quantity(
        work_item.work_type,
        float(log_data.length_m) if log_data.length_m else None,
        float(log_data.width_m) if log_data.width_m else None,
        float(log_data.height_m) if log_data.height_m else None,
        float(log_data.quantity_done) if log_data.quantity_done else None
    )

    log = WorkLog(
        site_id=site_id,
        work_item_id=log_data.work_item_id,
        logged_by=current_user.id,
        log_date=log_data.log_date,
        quantity_done=qty,
        length_m=log_data.length_m,
        width_m=log_data.width_m,
        height_m=log_data.height_m,
        quantity_unit=work_item.unit_label,
        remarks=log_data.remarks,
        weather=log_data.weather
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# Attendance
@router.get("/{site_id}/attendance/{att_date}")
def get_site_attendance(
    site_id: int,
    att_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)

    # Get all assigned labours
    assignments = db.query(SiteLabour).filter(
        SiteLabour.site_id == site_id,
        SiteLabour.assigned_date <= att_date,
        (SiteLabour.released_date == None) | (SiteLabour.released_date >= att_date)
    ).all()

    result = []
    for assignment in assignments:
        labour = db.query(Labour).filter(Labour.id == assignment.labour_id).first()
        attendance = db.query(Attendance).filter(
            Attendance.labour_id == assignment.labour_id,
            Attendance.site_id == site_id,
            Attendance.date == att_date
        ).first()

        result.append({
            "labour_id": assignment.labour_id,
            "labour_name": labour.name if labour else "",
            "skill_type": labour.skill_type if labour else "",
            "daily_rate": float(assignment.daily_rate_at_assignment),
            "photo_url": labour.photo_url if labour else None,
            "attendance_id": attendance.id if attendance else None,
            "status": attendance.status if attendance else None
        })

    return {
        "date": att_date.isoformat(),
        "site_id": site_id,
        "labours": result,
        "summary": {
            "total": len(result),
            "present": sum(1 for r in result if r["status"] == "present"),
            "absent": sum(1 for r in result if r["status"] == "absent"),
            "half_day": sum(1 for r in result if r["status"] == "half_day"),
            "not_marked": sum(1 for r in result if r["status"] is None)
        }
    }


# Financials
@router.get("/{site_id}/financials")
def get_site_financials(
    site_id: int,
    week_start: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)

    from datetime import date as date_type, timedelta
    from services.calculations import get_week_dates
    if not week_start:
        week_start = date_type.today()
    w_start, w_end = get_week_dates(week_start)

    profit_data = calculate_net_profit(site_id, w_start, w_end, db)

    # Work items breakdown
    work_items = db.query(SiteWorkItem).filter(SiteWorkItem.site_id == site_id).all()
    items_breakdown = []
    for item in work_items:
        total_done = db.query(func.sum(WorkLog.quantity_done)).filter(
            WorkLog.work_item_id == item.id,
            WorkLog.log_date >= w_start,
            WorkLog.log_date <= w_end
        ).scalar() or 0
        earned = float(total_done) * float(item.rate_per_unit)
        items_breakdown.append({
            "work_item_id": item.id,
            "work_name": item.work_name,
            "unit_label": item.unit_label,
            "rate": float(item.rate_per_unit),
            "quantity_done": float(total_done),
            "earned": earned
        })

    return {
        "week_start": w_start.isoformat(),
        "week_end": w_end.isoformat(),
        "earnings": float(profit_data["earned"]),
        "labour_cost": float(profit_data["labour_cost"]),
        "expenses": float(profit_data["expenses"]),
        "gross_profit": float(profit_data["gross_profit"]),
        "is_profitable": profit_data["is_profitable"],
        "work_items_breakdown": items_breakdown
    }


# Photos
@router.get("/{site_id}/photos")
def get_site_photos(
    site_id: int,
    photo_type: Optional[str] = None,
    photo_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    check_site_access(site, current_user)

    query = db.query(SitePhoto).filter(SitePhoto.site_id == site_id)
    if photo_type:
        query = query.filter(SitePhoto.photo_type == photo_type)
    if photo_date:
        query = query.filter(func.date(SitePhoto.created_at) == photo_date)

    photos = query.order_by(SitePhoto.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": p.id,
            "photo_url": p.photo_url,
            "caption": p.caption,
            "photo_type": p.photo_type,
            "photo_time": p.photo_time.isoformat() if p.photo_time else None,
            "uploaded_by": p.uploaded_by,
            "created_at": p.created_at.isoformat()
        } for p in photos
    ]
