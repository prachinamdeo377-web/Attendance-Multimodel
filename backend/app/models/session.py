from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    course_name = Column(String(100), default="AI & Computer Vision Lab")
    instructor_name = Column(String(100), default="Prof. A. Sharma")
    status = Column(String(30), default="SCHEDULED")  # SCHEDULED, LIVE, COMPLETED, CANCELLED
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    consent_confirmed = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")
    audio_analyses = relationship("AudioAnalysis", back_populates="session", cascade="all, delete-orphan")
    video_analyses = relationship("VideoAnalysis", back_populates="session", cascade="all, delete-orphan")
    engagement_analyses = relationship("EngagementAnalysis", back_populates="session", cascade="all, delete-orphan")
