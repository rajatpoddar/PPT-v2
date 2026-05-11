from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.expense import ExpenseCategory, ExpensePaymentMode


class ExpenseCreate(BaseModel):
    site_id: int
    expense_date: date
    category: ExpenseCategory
    amount: Decimal
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    payment_mode: Optional[ExpensePaymentMode] = None


class ExpenseUpdate(BaseModel):
    expense_date: Optional[date] = None
    category: Optional[ExpenseCategory] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    payment_mode: Optional[ExpensePaymentMode] = None


class ExpenseResponse(BaseModel):
    id: int
    site_id: int
    expense_date: date
    category: ExpenseCategory
    amount: Decimal
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    payment_mode: Optional[ExpensePaymentMode] = None
    receipt_photo_url: Optional[str] = None
    added_by: int
    created_at: datetime

    class Config:
        from_attributes = True
