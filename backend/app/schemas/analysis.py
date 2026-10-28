from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

# --- Audio Schemas ---
class AudioSegment(BaseModel):
    start_seconds: float
    end_seconds: float
    rms_energy: float
    speech_activity: bool

class AudioAnalysisResponse(BaseModel):
    id: Optional[int] = None
    session_id: Optional[int] = None
    filename: str
    duration_seconds: float
    original_sample_rate: int
    processed_sample_rate: int
    original_channels: int
    processed_channels: int
    rms_energy_mean: float
    speech_ratio: float
    silence_ratio: float
    segments: List[AudioSegment]
    waveform_downsampled: Optional[List[float]] = None
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Video Schemas ---
class VideoFrameSample(BaseModel):
    timestamp_seconds: float
    face_count: int
    confidence_mean: Optional[float] = None

class VideoAnalysisResponse(BaseModel):
    id: Optional[int] = None
    session_id: Optional[int] = None
    filename: str
    duration_seconds: float
    fps: float
    width: int
    height: int
    sampled_frames_count: int
    sampling_interval_seconds: float
    average_face_count: float
    max_face_count: int
    min_face_count: int
    face_counts_timeline: List[VideoFrameSample]
    preview_frames: Optional[List[str]] = None  # Base64 data URLs or preview paths
    detection_method: str
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Engagement Schemas ---
class TimeAlignedPoint(BaseModel):
    timestamp_seconds: float
    rms_energy: Optional[float] = None
    speech_active: Optional[bool] = None
    face_count: Optional[int] = None
    visual_active: Optional[bool] = None
    point_engagement_score: float

class EngagementResponse(BaseModel):
    id: Optional[int] = None
    session_id: int
    overall_engagement_score: float
    visual_indicator_score: float
    audio_indicator_score: float
    timeline: List[TimeAlignedPoint]
    explainability: dict[str, Any]
    warnings: List[str]
    formula_version: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
