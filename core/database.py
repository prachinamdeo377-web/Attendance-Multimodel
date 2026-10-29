import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(DB_DIR, "attendance_multimodal.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    department = Column(String(100), default="Artificial Intelligence & Data Science")
    year_of_study = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")


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


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="PRESENT")  # PRESENT, ABSENT, LATE, EXCUSED
    check_in_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String(50), default="MANUAL")  # MANUAL, MEDIAPIPE_VISION, CONSENT_VERIFIED
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student_attendance'),
    )

    session = relationship("Session", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")


class AudioAnalysis(Base):
    __tablename__ = "audio_analyses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    original_sample_rate = Column(Integer, default=44100)
    processed_sample_rate = Column(Integer, default=16000)
    original_channels = Column(Integer, default=2)
    processed_channels = Column(Integer, default=1)
    rms_energy_mean = Column(Float, default=0.0)
    speech_ratio = Column(Float, default=0.0)
    silence_ratio = Column(Float, default=0.0)
    segments_json = Column(Text, nullable=True)
    waveform_downsampled_json = Column(Text, nullable=True)
    status = Column(String(30), default="COMPLETED")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="audio_analyses")


class VideoAnalysis(Base):
    __tablename__ = "video_analyses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    fps = Column(Float, default=0.0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    sampled_frames_count = Column(Integer, default=0)
    sampling_interval_seconds = Column(Float, default=1.0)
    average_face_count = Column(Float, default=0.0)
    max_face_count = Column(Integer, default=0)
    min_face_count = Column(Integer, default=0)
    face_counts_timeline_json = Column(Text, nullable=True)
    preview_frames_json = Column(Text, nullable=True)
    detection_method = Column(String(50), default="MEDIAPIPE_OPENCV")
    status = Column(String(30), default="COMPLETED")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="video_analyses")


class EngagementAnalysis(Base):
    __tablename__ = "engagement_analyses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score = Column(Float, default=0.0)
    acoustic_score = Column(Float, default=0.0)
    visual_score = Column(Float, default=0.0)
    attendance_ratio = Column(Float, default=0.0)
    timeline_json = Column(Text, nullable=True)
    formula_version = Column(String(20), default="1.0-explainable")
    calculation_details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="engagement_analyses")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db_session():
    return SessionLocal()
