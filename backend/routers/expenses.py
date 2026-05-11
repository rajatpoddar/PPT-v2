from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User
from models.expense import Expense
from schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.file_storage import save_photo

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    site_id: Optional[int] = None,
    category: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Expense)

    if current_user.role == "site_incharge":
        from models.site import Site
        site_ids = [s.id for s in db.query(Site).filter(Site.site_incharge_id == current_user.id).all()]
        query = query.filter(Expense.site_id.in_(site_ids))
    elif site_id:
        query = query.filter(Expense.site_id == site_id)

    if category:
        query = query.filter(Expense.category == category)
    if from_date:
        query = query.filter(Expense.expense_date >= from_date)
    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    expenses = query.order_by(Expense.expense_date.desc()).offset(skip).limit(limit).all()

    # Category totals
    category_totals = {}
    for exp in expenses:
        cat = exp.category
        category_totals[cat] = category_totals.get(cat, 0) + float(exp.amount)

    return expenses


@router.post("", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = Expense(**expense_data.model_dump(), added_by=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in expense_data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


@router.post("/{expense_id}/receipt")
async def upload_receipt(
    expense_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    url = await save_photo(file, "receipts")
    expense.receipt_photo_url = url
    db.commit()
    return {"receipt_url": url}


@router.get("/summary")
def get_expense_summary(
    site_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Expense.category, func.sum(Expense.amount).label("total"))

    if site_id:
        query = query.filter(Expense.site_id == site_id)
    if from_date:
        query = query.filter(Expense.expense_date >= from_date)
    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    results = query.group_by(Expense.category).all()
    return [{"category": r.category, "total": float(r.total)} for r in results]
