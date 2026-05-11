from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class WeatherCondition(str, enum.Enum):
    sunny = "sunny"
    cloudy = "cloudy"
    rainy = "rainy"
    stopped_due_to_rain = "stopped_due_to_rain"


class PhotoType(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"
    work_in_progress = "work_in_progress"
    completed_section = "completed_section"
    issue = "issue"


class WorkLog(Base):
    __tablename__ = "work_logs"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    work_item_id = Column(Integer, ForeignKey("site_work_items.id"), nullable=False)
    logged_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, nullable=False)
    quantity_done = Column(Numeric(12, 3), nullable=False)
    length_m = Column(Numeric(10, 3))
    width_m = Column(Numeric(10, 3))
    height_m = Column(Numeric(10, 3))
    quantity_unit = Column(String)
    remarks = Column(Text)
    weather = Column(Enum(WeatherCondition))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="work_logs")
    work_item = relationship("SiteWorkItem", back_populates="work_logs")
    logger = relationship("User", foreign_keys=[logged_by])
    photos = relationship("SitePhoto", back_populates="work_log")


class SitePhoto(Base):
    __tablename__ = "site_photos"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    work_log_id = Column(Integer, ForeignKey("work_logs.id"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    photo_url = Column(String, nullable=False)
    caption = Column(Text)
    photo_time = Column(DateTime(timezone=True))
    photo_type = Column(Enum(PhotoType))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="photos")
    work_log = relationship("WorkLog", back_populates="photos")
    uploader = relationship("User", foreign_keys=[uploaded_by])
