from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.equipment import EquipmentCategory, EquipmentStatus, ReturnCondition


class EquipmentCreate(BaseModel):
    name: str
    category: Optional[EquipmentCategory] = None
    description: Optional[str] = None
    total_quantity: int = 1
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None
    notes: Optional[str] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[EquipmentCategory] = None
    description: Optional[str] = None
    total_quantity: Optional[int] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None
    current_status: Optional[EquipmentStatus] = None
    notes: Optional[str] = None


class EquipmentResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    category: Optional[EquipmentCategory] = None
    description: Optional[str] = None
    total_quantity: int
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None
    current_status: EquipmentStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EquipmentAllocationCreate(BaseModel):
    site_id: int
    quantity_allocated: int
    allocated_date: date
    notes: Optional[str] = None


class EquipmentReturnCreate(BaseModel):
    returned_date: date
    condition_on_return: ReturnCondition
    notes: Optional[str] = None


class EquipmentAllocationResponse(BaseModel):
    id: int
    equipment_id: int
    site_id: int
    quantity_allocated: int
    allocated_date: date
    returned_date: Optional[date] = None
    condition_on_return: Optional[ReturnCondition] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
