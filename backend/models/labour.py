from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class SkillType(str, enum.Enum):
    unskilled_labour = "unskilled_labour"
    skilled_labour = "skilled_labour"
    mason_mistri = "mason_mistri"
    bar_bender = "bar_bender"
    carpenter = "carpenter"
    plumber = "plumber"
    electrician = "electrician"
    equipment_operator = "equipment_operator"
    supervisor = "supervisor"


class LabourStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class Labour(Base):
    __tablename__ = "labours"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, index=True)
    skill_type = Column(Enum(SkillType), nullable=False)
    daily_rate = Column(Numeric(10, 2), nullable=False)
    date_joined = Column(Date)
    address = Column(Text)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    id_proof_type = Column(String)
    id_proof_number = Column(String)
    photo_url = Column(String)
    status = Column(Enum(LabourStatus), default=LabourStatus.active)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    site_assignments = relationship("SiteLabour", back_populates="labour")
    attendance_records = relationship("Attendance", back_populates="labour")
    payments = relationship("LabourPayment", back_populates="labour")


class SiteLabour(Base):
    __tablename__ = "site_labours"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    labour_id = Column(Integer, ForeignKey("labours.id"), nullable=False)
    assigned_date = Column(Date, nullable=False)
    released_date = Column(Date, nullable=True)
    daily_rate_at_assignment = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="labour_assignments")
    labour = relationship("Labour", back_populates="site_assignments")
