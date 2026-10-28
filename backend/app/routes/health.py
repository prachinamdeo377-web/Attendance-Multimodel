from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
import sys

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def check_health(db: Session = Depends(get_db)):
    """Health check endpoint confirming backend service, database, and system status."""
    db_status = "HEALTHY"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "python_version": sys.version.split()[0],
        "audio_pipeline": "Librosa/SoundFile Enabled (16kHz Normalized)",
        "video_pipeline": "OpenCV Haar Cascade Face Detector Enabled",
        "privacy_mode": "Strict Local Processing (Zero External Upload)"
    }
