from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class ExpenseCategory(str, enum.Enum):
    food_lodging = "food_lodging"
    equipment_purchase = "equipment_purchase"
    equipment_repair = "equipment_repair"
    fuel_transport = "fuel_transport"
    material = "material"
    site_setup = "site_setup"
    safety_equipment = "safety_equipment"
    other = "other"


class ExpensePaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank_transfer = "bank_transfer"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    expense_date = Column(Date, nullable=False)
    category = Column(Enum(ExpenseCategory), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    vendor_name = Column(String)
    payment_mode = Column(Enum(ExpensePaymentMode))
    receipt_photo_url = Column(String)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="expenses")
    added_by_user = relationship("User", foreign_keys=[added_by])
