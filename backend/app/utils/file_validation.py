import os
from fastapi import HTTPException, UploadFile
from app.config import settings

def validate_audio_file(file: UploadFile, max_size_bytes: int = None) -> str:
    """Validates audio file extension and returns sanitized safe filename."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    
    filename = os.path.basename(file.filename)
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    if ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext}'. Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )
    return filename

def validate_video_file(file: UploadFile, max_size_bytes: int = None) -> str:
    """Validates video file extension and returns sanitized safe filename."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    
    filename = os.path.basename(file.filename)
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    if ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{ext}'. Allowed: {', '.join(settings.ALLOWED_VIDEO_EXTENSIONS)}"
        )
    return filename

def check_file_size(file_bytes: bytes, max_bytes: int = settings.MAX_UPLOAD_SIZE_BYTES):
    """Ensures uploaded payload doesn't exceed permissible size limit."""
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
    if len(file_bytes) > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowable upload size of {limit_mb}MB."
        )
