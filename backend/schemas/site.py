from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from models.site import ProjectType, SiteStatus, WorkType


class SiteCreate(BaseModel):
    name: str
    location: Optional[str] = None
    project_type: Optional[ProjectType] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    main_contractor_name: Optional[str] = None
    main_contractor_phone: Optional[str] = None
    main_contractor_company: Optional[str] = None
    site_incharge_id: Optional[int] = None
    total_contract_value: Optional[Decimal] = None
    gps_lat: Optional[Decimal] = None
    gps_lng: Optional[Decimal] = None
    notes: Optional[str] = None


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    project_type: Optional[ProjectType] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    main_contractor_name: Optional[str] = None
    main_contractor_phone: Optional[str] = None
    main_contractor_company: Optional[str] = None
    site_incharge_id: Optional[int] = None
    status: Optional[SiteStatus] = None
    total_contract_value: Optional[Decimal] = None
    gps_lat: Optional[Decimal] = None
    gps_lng: Optional[Decimal] = None
    notes: Optional[str] = None


class SiteResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    location: Optional[str] = None
    project_type: Optional[ProjectType] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    main_contractor_name: Optional[str] = None
    main_contractor_phone: Optional[str] = None
    main_contractor_company: Optional[str] = None
    site_incharge_id: Optional[int] = None
    status: SiteStatus
    total_contract_value: Optional[Decimal] = None
    gps_lat: Optional[Decimal] = None
    gps_lng: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SiteWorkItemCreate(BaseModel):
    work_name: str
    work_type: WorkType
    rate_per_unit: Decimal
    unit_label: Optional[str] = None
    total_estimated_quantity: Optional[Decimal] = None


class SiteWorkItemUpdate(BaseModel):
    work_name: Optional[str] = None
    work_type: Optional[WorkType] = None
    rate_per_unit: Optional[Decimal] = None
    unit_label: Optional[str] = None
    total_estimated_quantity: Optional[Decimal] = None


class SiteWorkItemResponse(BaseModel):
    id: int
    site_id: int
    work_name: str
    work_type: WorkType
    rate_per_unit: Decimal
    unit_label: Optional[str] = None
    total_estimated_quantity: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True
