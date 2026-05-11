from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.investor import InvestmentType, InvestorTransactionType, InvestorPaymentMode


class InvestorCreate(BaseModel):
    # User fields
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    # Investor fields
    address: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    investment_type: InvestmentType
    profit_share_percentage: Optional[Decimal] = None
    interest_rate_monthly: Optional[Decimal] = None


class InvestorUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    investment_type: Optional[InvestmentType] = None
    profit_share_percentage: Optional[Decimal] = None
    interest_rate_monthly: Optional[Decimal] = None


class InvestorResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    investment_type: InvestmentType
    profit_share_percentage: Optional[Decimal] = None
    interest_rate_monthly: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvestorTransactionCreate(BaseModel):
    transaction_date: date
    transaction_type: InvestorTransactionType
    amount: Decimal
    site_id: Optional[int] = None
    reference_number: Optional[str] = None
    payment_mode: Optional[InvestorPaymentMode] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None


class InvestorTransactionResponse(BaseModel):
    id: int
    investor_id: int
    transaction_date: date
    transaction_type: InvestorTransactionType
    amount: Decimal
    site_id: Optional[int] = None
    reference_number: Optional[str] = None
    payment_mode: Optional[InvestorPaymentMode] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None
    recorded_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class SiteInvestmentCreate(BaseModel):
    investor_id: int
    allocated_amount: Decimal
    allocation_date: date
    notes: Optional[str] = None


class SiteInvestmentResponse(BaseModel):
    id: int
    site_id: int
    investor_id: int
    allocated_amount: Decimal
    allocation_date: date
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
