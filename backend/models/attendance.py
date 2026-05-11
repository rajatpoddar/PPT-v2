from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Enum, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    half_day = "half_day"
    leave = "leave"
    holiday = "holiday"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    labour_id = Column(Integer, ForeignKey("labours.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    check_in_time = Column(Time)
    check_out_time = Column(Time)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("labour_id", "site_id", "date", name="uq_attendance_labour_site_date"),
    )

    # Relationships
    labour = relationship("Labour", back_populates="attendance_records")
    site = relationship("Site", back_populates="attendance_records")
    marker = relationship("User", foreign_keys=[marked_by])
