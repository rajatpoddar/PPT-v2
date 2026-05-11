from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.labour import SkillType, LabourStatus


class LabourCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    skill_type: SkillType
    daily_rate: Decimal
    date_joined: Optional[date] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    notes: Optional[str] = None


class LabourUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    skill_type: Optional[SkillType] = None
    daily_rate: Optional[Decimal] = None
    date_joined: Optional[date] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    status: Optional[LabourStatus] = None
    notes: Optional[str] = None


class LabourResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    phone: Optional[str] = None
    skill_type: SkillType
    daily_rate: Decimal
    date_joined: Optional[date] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    photo_url: Optional[str] = None
    status: LabourStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SiteLabourCreate(BaseModel):
    labour_id: int
    assigned_date: date
    daily_rate_at_assignment: Optional[Decimal] = None  # if None, use labour's current rate


class SiteLabourResponse(BaseModel):
    id: int
    site_id: int
    labour_id: int
    assigned_date: date
    released_date: Optional[date] = None
    daily_rate_at_assignment: Decimal
    labour: Optional[LabourResponse] = None

    class Config:
        from_attributes = True


class LabourBalanceResponse(BaseModel):
    labour_id: int
    labour_name: str
    site_id: Optional[int] = None
    total_earned: Decimal
    total_paid: Decimal
    balance_due: Decimal
    status: str  # "owed_to_labour", "labour_owes", "settled"
