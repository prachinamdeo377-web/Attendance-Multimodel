from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="PRESENT")  # PRESENT, ABSENT, LATE, EXCUSED
    check_in_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String(50), default="MANUAL")  # MANUAL, CONSENT_VERIFIED, BATCH_IMPORT
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student_attendance'),
    )

    session = relationship("Session", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")
