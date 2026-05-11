from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User
from models.labour import Labour, SiteLabour, LabourStatus
from models.attendance import Attendance
from models.payment import LabourPayment
from schemas.labour import LabourCreate, LabourUpdate, LabourResponse, SiteLabourCreate, SiteLabourResponse, LabourBalanceResponse
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.calculations import get_labour_balance
from services.file_storage import save_photo

router = APIRouter(prefix="/api/v1/labours", tags=["labours"])


@router.get("", response_model=List[LabourResponse])
def list_labours(
    search: Optional[str] = None,
    skill_type: Optional[str] = None,
    status: Optional[str] = None,
    site_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Owner sees all their labours; site incharge sees labours on their sites
    if current_user.role == "owner":
        query = db.query(Labour).filter(Labour.owner_id == current_user.id)
    else:
        # Get labours assigned to incharge's sites
        from models.site import Site
        site_ids = [s.id for s in db.query(Site).filter(Site.site_incharge_id == current_user.id).all()]
        labour_ids = [sl.labour_id for sl in db.query(SiteLabour).filter(
            SiteLabour.site_id.in_(site_ids),
            SiteLabour.released_date == None
        ).all()]
        query = db.query(Labour).filter(Labour.id.in_(labour_ids))

    if search:
        query = query.filter(or_(Labour.name.ilike(f"%{search}%"), Labour.phone.ilike(f"%{search}%")))
    if skill_type:
        query = query.filter(Labour.skill_type == skill_type)
    if status:
        query = query.filter(Labour.status == status)
    if site_id:
        labour_ids_on_site = [sl.labour_id for sl in db.query(SiteLabour).filter(
            SiteLabour.site_id == site_id,
            SiteLabour.released_date == None
        ).all()]
        query = query.filter(Labour.id.in_(labour_ids_on_site))

    return query.offset(skip).limit(limit).all()


@router.post("", response_model=LabourResponse)
def create_labour(
    labour_data: LabourCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    # Check duplicate phone
    if labour_data.phone:
        existing = db.query(Labour).filter(Labour.phone == labour_data.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="A labour with this phone number already exists")

    labour = Labour(**labour_data.model_dump(), owner_id=current_user.id)
    db.add(labour)
    db.commit()
    db.refresh(labour)
    return labour


@router.get("/{labour_id}", response_model=LabourResponse)
def get_labour(
    labour_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")
    return labour


@router.put("/{labour_id}", response_model=LabourResponse)
def update_labour(
    labour_id: int,
    labour_data: LabourUpdate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id, Labour.owner_id == current_user.id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")

    for field, value in labour_data.model_dump(exclude_unset=True).items():
        setattr(labour, field, value)
    db.commit()
    db.refresh(labour)
    return labour


@router.delete("/{labour_id}")
def deactivate_labour(
    labour_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id, Labour.owner_id == current_user.id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")
    labour.status = LabourStatus.inactive
    db.commit()
    return {"message": "Labour deactivated"}


@router.get("/{labour_id}/balance")
def get_balance(
    labour_id: int,
    site_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")

    balance = get_labour_balance(labour_id, site_id, db)
    balance["labour_id"] = labour_id
    balance["labour_name"] = labour.name
    balance["site_id"] = site_id
    return balance


@router.get("/{labour_id}/attendance")
def get_attendance_history(
    labour_id: int,
    month: Optional[str] = None,  # "2025-04"
    site_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance).filter(Attendance.labour_id == labour_id)
    if site_id:
        query = query.filter(Attendance.site_id == site_id)
    if month:
        year, mon = month.split("-")
        query = query.filter(
            Attendance.date >= date(int(year), int(mon), 1),
            Attendance.date <= date(int(year), int(mon), 28)  # approximate
        )
    records = query.order_by(Attendance.date.desc()).all()
    return [{"id": r.id, "date": r.date.isoformat(), "status": r.status, "site_id": r.site_id} for r in records]


@router.get("/{labour_id}/payments")
def get_payment_history(
    labour_id: int,
    site_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LabourPayment).filter(LabourPayment.labour_id == labour_id)
    if site_id:
        query = query.filter(LabourPayment.site_id == site_id)
    payments = query.order_by(LabourPayment.payment_date.desc()).all()
    return [
        {
            "id": p.id,
            "date": p.payment_date.isoformat(),
            "amount": float(p.amount),
            "type": p.payment_type,
            "mode": p.payment_mode,
            "site_id": p.site_id
        } for p in payments
    ]


@router.post("/{labour_id}/photo")
async def upload_labour_photo(
    labour_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id, Labour.owner_id == current_user.id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")

    url = await save_photo(file, "labour_photos")
    labour.photo_url = url
    db.commit()
    return {"photo_url": url}


@router.post("/{labour_id}/assign")
def assign_to_site(
    labour_id: int,
    assignment: SiteLabourCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")

    # Check if already assigned to this site
    existing = db.query(SiteLabour).filter(
        SiteLabour.labour_id == labour_id,
        SiteLabour.site_id == assignment.site_id,
        SiteLabour.released_date == None
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Labour already assigned to this site")

    rate = assignment.daily_rate_at_assignment or labour.daily_rate
    site_labour = SiteLabour(
        site_id=assignment.site_id,
        labour_id=labour_id,
        assigned_date=assignment.assigned_date,
        daily_rate_at_assignment=rate
    )
    db.add(site_labour)
    db.commit()
    db.refresh(site_labour)
    return site_labour


@router.post("/{labour_id}/release/{site_id}")
def release_from_site(
    labour_id: int,
    site_id: int,
    released_date: date = None,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    assignment = db.query(SiteLabour).filter(
        SiteLabour.labour_id == labour_id,
        SiteLabour.site_id == site_id,
        SiteLabour.released_date == None
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.released_date = released_date or date.today()
    db.commit()
    return {"message": "Labour released from site"}
