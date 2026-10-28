from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

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
    segments_json = Column(Text, nullable=True)  # JSON array of segments
    waveform_downsampled_json = Column(Text, nullable=True)  # Visual preview points
    status = Column(String(30), default="COMPLETED")  # COMPLETED, FAILED
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
    face_counts_timeline_json = Column(Text, nullable=True)  # JSON array of samples
    preview_frames_json = Column(Text, nullable=True)  # JSON array of base64 snapshots
    detection_method = Column(String(50), default="HAAR_CASCADE")
    status = Column(String(30), default="COMPLETED")  # COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="video_analyses")


class EngagementAnalysis(Base):
    __tablename__ = "engagement_analyses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_engagement_score = Column(Float, default=0.0)  # 0 to 100
    visual_indicator_score = Column(Float, default=0.0)
    audio_indicator_score = Column(Float, default=0.0)
    timeline_json = Column(Text, nullable=True)  # synchronized feature timeline
    explainability_json = Column(Text, nullable=True)  # feature contributions & weights
    warnings_json = Column(Text, nullable=True)  # data quality & ethical disclaimers
    formula_version = Column(String(50), default="v1.0-heuristic-explainable")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="engagement_analyses")
