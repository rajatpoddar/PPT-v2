from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class ProjectType(str, enum.Enum):
    PCC_road = "PCC_road"
    WBM_road = "WBM_road"
    guardwall = "guardwall"
    check_dam = "check_dam"
    culvert = "culvert"
    kalvat = "kalvat"
    excavation = "excavation"
    building = "building"
    other = "other"


class SiteStatus(str, enum.Enum):
    active = "active"
    on_hold = "on_hold"
    completed = "completed"


class WorkType(str, enum.Enum):
    running_meter = "running_meter"
    m3 = "m3"
    sqm = "sqm"
    lumpsum = "lumpsum"
    per_unit = "per_unit"


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    location = Column(String)
    project_type = Column(Enum(ProjectType))
    start_date = Column(Date)
    expected_end_date = Column(Date)
    actual_end_date = Column(Date)
    main_contractor_name = Column(String)
    main_contractor_phone = Column(String)
    main_contractor_company = Column(String)
    site_incharge_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(SiteStatus), default=SiteStatus.active)
    total_contract_value = Column(Numeric(12, 2))
    gps_lat = Column(Numeric(10, 8))
    gps_lng = Column(Numeric(10, 8))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    site_incharge = relationship("User", foreign_keys=[site_incharge_id], back_populates="managed_sites")
    work_items = relationship("SiteWorkItem", back_populates="site", cascade="all, delete-orphan")
    work_logs = relationship("WorkLog", back_populates="site")
    photos = relationship("SitePhoto", back_populates="site")
    labour_assignments = relationship("SiteLabour", back_populates="site")
    attendance_records = relationship("Attendance", back_populates="site")
    expenses = relationship("Expense", back_populates="site")
    equipment_allocations = relationship("EquipmentAllocation", back_populates="site")
    investments = relationship("SiteInvestment", back_populates="site")
    weekly_settlements = relationship("WeeklySettlement", back_populates="site")


class SiteWorkItem(Base):
    __tablename__ = "site_work_items"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    work_name = Column(String, nullable=False)
    work_type = Column(Enum(WorkType), nullable=False)
    rate_per_unit = Column(Numeric(10, 2), nullable=False)
    unit_label = Column(String)
    total_estimated_quantity = Column(Numeric(12, 3))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="work_items")
    work_logs = relationship("WorkLog", back_populates="work_item")
