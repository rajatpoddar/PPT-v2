from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User
from models.payment import LabourPayment, PaymentType
from models.labour import Labour, SiteLabour
from schemas.payment import LabourPaymentCreate, LabourPaymentResponse
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.calculations import get_labour_balance

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.get("/pending")
def get_pending_payments(
    site_id: Optional[int] = None,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Get all labours with pending balance."""
    labours = db.query(Labour).filter(Labour.owner_id == current_user.id, Labour.status == "active").all()
    pending = []

    for labour in labours:
        balance_data = get_labour_balance(labour.id, site_id, db)
        if balance_data["balance_due"] > 0:
            # Get current site assignment
            assignment = db.query(SiteLabour).filter(
                SiteLabour.labour_id == labour.id,
                SiteLabour.released_date == None
            ).first()

            pending.append({
                "labour_id": labour.id,
                "labour_name": labour.name,
                "skill_type": labour.skill_type,
                "photo_url": labour.photo_url,
                "site_id": assignment.site_id if assignment else None,
                "total_earned": float(balance_data["total_earned"]),
                "total_paid": float(balance_data["total_paid"]),
                "balance_due": float(balance_data["balance_due"])
            })

    # Sort by balance_due descending
    pending.sort(key=lambda x: x["balance_due"], reverse=True)
    return pending


@router.post("/labour", response_model=LabourPaymentResponse)
def record_payment(
    payment_data: LabourPaymentCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    payment = LabourPayment(**payment_data.model_dump(), paid_by=current_user.id)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/advance", response_model=LabourPaymentResponse)
def record_advance(
    payment_data: LabourPaymentCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    # Ensure it's marked as advance
    payment_data.payment_type = PaymentType.advance

    # Warning check: advance > 3x daily rate
    labour = db.query(Labour).filter(Labour.id == payment_data.labour_id).first()
    warning = None
    if labour and payment_data.amount > labour.daily_rate * 3:
        warning = f"Advance amount exceeds 3× daily rate (₹{float(labour.daily_rate * 3):.0f})"

    payment = LabourPayment(**payment_data.model_dump(), paid_by=current_user.id)
    db.add(payment)
    db.commit()
    db.refresh(payment)

    result = LabourPaymentResponse.model_validate(payment)
    return {"payment": result, "warning": warning}


@router.get("/history")
def get_payment_history(
    labour_id: Optional[int] = None,
    site_id: Optional[int] = None,
    payment_type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    query = db.query(LabourPayment)

    if labour_id:
        query = query.filter(LabourPayment.labour_id == labour_id)
    if site_id:
        query = query.filter(LabourPayment.site_id == site_id)
    if payment_type:
        query = query.filter(LabourPayment.payment_type == payment_type)
    if from_date:
        query = query.filter(LabourPayment.payment_date >= from_date)
    if to_date:
        query = query.filter(LabourPayment.payment_date <= to_date)

    payments = query.order_by(LabourPayment.payment_date.desc()).offset(skip).limit(limit).all()
    total = query.count()

    return {
        "total": total,
        "payments": [
            {
                "id": p.id,
                "labour_id": p.labour_id,
                "site_id": p.site_id,
                "date": p.payment_date.isoformat(),
                "amount": float(p.amount),
                "type": p.payment_type,
                "mode": p.payment_mode,
                "reference": p.reference_number,
                "remarks": p.remarks
            } for p in payments
        ]
    }
