from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Numeric, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class StaffPaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank_transfer = "bank_transfer"


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    designation = Column(String)
    monthly_salary = Column(Numeric(10, 2))
    join_date = Column(Date)
    assigned_sites = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="staff_profile")
    salary_records = relationship("StaffSalary", back_populates="staff")


class StaffSalary(Base):
    __tablename__ = "staff_salaries"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    month_year = Column(String, nullable=False)  # "2025-04"
    base_salary = Column(Numeric(10, 2))
    attendance_days = Column(Integer)
    working_days = Column(Integer)
    allowances = Column(Numeric(10, 2), default=0)
    deductions = Column(Numeric(10, 2), default=0)
    net_salary = Column(Numeric(10, 2))
    payment_date = Column(Date)
    payment_mode = Column(Enum(StaffPaymentMode))
    is_paid = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    staff = relationship("Staff", back_populates="salary_records")
