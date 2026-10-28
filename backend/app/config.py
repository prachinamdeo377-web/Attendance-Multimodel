import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Multimodal Attendance & Engagement Agent"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Storage & Database
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'attendance_multimodal.db')}"
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    PROCESSED_DIR: str = os.path.join(BASE_DIR, "processed")
    
    # File limits
    MAX_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB
    ALLOWED_AUDIO_EXTENSIONS: List[str] = [".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac"]
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    
    # Audio Analysis defaults
    AUDIO_TARGET_SAMPLE_RATE: int = 16000
    AUDIO_SEGMENT_DURATION_SEC: float = 2.0
    AUDIO_SILENCE_THRESHOLD_RMS: float = 0.015
    
    # Video Analysis defaults
    VIDEO_FRAME_SAMPLE_INTERVAL_SEC: float = 1.0
    FACE_CONFIDENCE_THRESHOLD: float = 0.5
    
    # Privacy & Consent
    REQUIRE_CONSENT_CONFIRMATION: bool = True
    ENABLE_PERSISTENT_RECORDING_STORAGE: bool = False
    DATA_RETENTION_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure runtime directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
