from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class EquipmentCategory(str, enum.Enum):
    digging_tools = "digging_tools"
    measuring_tools = "measuring_tools"
    concrete_tools = "concrete_tools"
    safety = "safety"
    heavy_machinery = "heavy_machinery"
    transport = "transport"
    other = "other"


class EquipmentStatus(str, enum.Enum):
    in_store = "in_store"
    on_site = "on_site"
    under_repair = "under_repair"
    disposed = "disposed"


class ReturnCondition(str, enum.Enum):
    good = "good"
    damaged = "damaged"
    lost = "lost"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(Enum(EquipmentCategory))
    description = Column(Text)
    total_quantity = Column(Integer, default=1)
    purchase_date = Column(Date)
    purchase_cost = Column(Numeric(10, 2))
    current_status = Column(Enum(EquipmentStatus), default=EquipmentStatus.in_store)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    allocations = relationship("EquipmentAllocation", back_populates="equipment")


class EquipmentAllocation(Base):
    __tablename__ = "equipment_allocations"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    quantity_allocated = Column(Integer, nullable=False)
    allocated_date = Column(Date, nullable=False)
    returned_date = Column(Date)
    condition_on_return = Column(Enum(ReturnCondition))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    equipment = relationship("Equipment", back_populates="allocations")
    site = relationship("Site", back_populates="equipment_allocations")
