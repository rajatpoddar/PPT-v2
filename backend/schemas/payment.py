from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.payment import PaymentType, PaymentMode


class LabourPaymentCreate(BaseModel):
    labour_id: int
    site_id: int
    payment_date: date
    amount: Decimal
    payment_type: PaymentType
    payment_mode: PaymentMode
    reference_number: Optional[str] = None
    week_start: Optional[date] = None
    week_end: Optional[date] = None
    remarks: Optional[str] = None


class LabourPaymentResponse(BaseModel):
    id: int
    labour_id: int
    site_id: int
    payment_date: date
    amount: Decimal
    payment_type: PaymentType
    payment_mode: PaymentMode
    reference_number: Optional[str] = None
    week_start: Optional[date] = None
    week_end: Optional[date] = None
    remarks: Optional[str] = None
    paid_by: int
    created_at: datetime

    class Config:
        from_attributes = True
