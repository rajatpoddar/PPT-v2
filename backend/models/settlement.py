from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class WeeklySettlement(Base):
    __tablename__ = "weekly_settlements"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    total_work_quantity = Column(Numeric(12, 3))
    total_earned_from_contractor = Column(Numeric(12, 2))
    advance_received_from_contractor = Column(Numeric(12, 2))
    total_labour_salaries = Column(Numeric(12, 2))
    total_advances_given = Column(Numeric(12, 2))
    total_expenses = Column(Numeric(12, 2))
    gross_profit = Column(Numeric(12, 2))
    net_profit = Column(Numeric(12, 2))
    is_profitable = Column(Boolean)
    settlement_notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="weekly_settlements")
    creator = relationship("User", foreign_keys=[created_by])
