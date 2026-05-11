from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User, UserRole
from models.investor import Investor, InvestorTransaction, SiteInvestment
from schemas.investor import (InvestorCreate, InvestorUpdate, InvestorResponse,
                               InvestorTransactionCreate, InvestorTransactionResponse,
                               SiteInvestmentCreate, SiteInvestmentResponse)
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.calculations import calculate_investor_profit
from routers.auth import hash_password

router = APIRouter(prefix="/api/v1/investors", tags=["investors"])


@router.get("", response_model=List[InvestorResponse])
def list_investors(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    return db.query(Investor).all()


@router.post("", response_model=InvestorResponse)
def create_investor(
    data: InvestorCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    # Create user account
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=UserRole.investor
    )
    db.add(user)
    db.flush()

    investor = Investor(
        user_id=user.id,
        full_name=data.full_name,
        phone=data.phone,
        address=data.address,
        pan_number=data.pan_number,
        bank_name=data.bank_name,
        bank_account=data.bank_account,
        ifsc_code=data.ifsc_code,
        investment_type=data.investment_type,
        profit_share_percentage=data.profit_share_percentage,
        interest_rate_monthly=data.interest_rate_monthly
    )
    db.add(investor)
    db.commit()
    db.refresh(investor)
    return investor


@router.get("/{investor_id}", response_model=InvestorResponse)
def get_investor(
    investor_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    investor = db.query(Investor).filter(Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return investor


@router.put("/{investor_id}", response_model=InvestorResponse)
def update_investor(
    investor_id: int,
    data: InvestorUpdate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    investor = db.query(Investor).filter(Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(investor, field, value)
    db.commit()
    db.refresh(investor)
    return investor


@router.post("/{investor_id}/transactions", response_model=InvestorTransactionResponse)
def add_transaction(
    investor_id: int,
    data: InvestorTransactionCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    investor = db.query(Investor).filter(Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")

    transaction = InvestorTransaction(
        investor_id=investor_id,
        recorded_by=current_user.id,
        **data.model_dump()
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{investor_id}/transactions")
def get_transactions(
    investor_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Investors can only see their own transactions
    if current_user.role == UserRole.investor:
        investor = db.query(Investor).filter(Investor.user_id == current_user.id).first()
        if not investor or investor.id != investor_id:
            raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(InvestorTransaction).filter(InvestorTransaction.investor_id == investor_id)
    if from_date:
        query = query.filter(InvestorTransaction.transaction_date >= from_date)
    if to_date:
        query = query.filter(InvestorTransaction.transaction_date <= to_date)

    transactions = query.order_by(InvestorTransaction.transaction_date.desc()).all()
    return [
        {
            "id": t.id,
            "date": t.transaction_date.isoformat(),
            "type": t.transaction_type,
            "amount": float(t.amount),
            "site_id": t.site_id,
            "payment_mode": t.payment_mode,
            "reference": t.reference_number,
            "notes": t.notes
        } for t in transactions
    ]


@router.get("/{investor_id}/profit-calculation")
def get_profit_calculation(
    investor_id: int,
    site_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investor = db.query(Investor).filter(Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")

    if current_user.role == UserRole.investor:
        if investor.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    if site_id:
        return calculate_investor_profit(investor, site_id, db)

    # Calculate for all sites
    site_investments = db.query(SiteInvestment).filter(SiteInvestment.investor_id == investor_id).all()
    results = []
    for si in site_investments:
        profit_data = calculate_investor_profit(investor, si.site_id, db)
        from models.site import Site
        site = db.query(Site).filter(Site.id == si.site_id).first()
        results.append({
            "site_id": si.site_id,
            "site_name": site.name if site else "Unknown",
            **{k: float(v) for k, v in profit_data.items()}
        })

    total_invested = sum(r["invested"] for r in results)
    total_profit = sum(r["profit"] for r in results)
    total_due = sum(r["total_due"] for r in results)

    return {
        "sites": results,
        "summary": {
            "total_invested": total_invested,
            "total_profit": total_profit,
            "total_due": total_due
        }
    }


@router.post("/{investor_id}/site-investments", response_model=SiteInvestmentResponse)
def add_site_investment(
    investor_id: int,
    data: SiteInvestmentCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    investment = SiteInvestment(investor_id=investor_id, **data.model_dump())
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return investment
