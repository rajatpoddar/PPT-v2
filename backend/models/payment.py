from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class PaymentType(str, enum.Enum):
    daily_salary = "daily_salary"
    advance = "advance"
    bonus = "bonus"
    final_settlement = "final_settlement"
    deduction = "deduction"


class PaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank_transfer = "bank_transfer"


class LabourPayment(Base):
    __tablename__ = "labour_payments"

    id = Column(Integer, primary_key=True, index=True)
    labour_id = Column(Integer, ForeignKey("labours.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(Enum(PaymentType), nullable=False)
    payment_mode = Column(Enum(PaymentMode), nullable=False)
    reference_number = Column(String)
    week_start = Column(Date)
    week_end = Column(Date)
    remarks = Column(Text)
    paid_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    labour = relationship("Labour", back_populates="payments")
    site = relationship("Site")
    payer = relationship("User", foreign_keys=[paid_by])
