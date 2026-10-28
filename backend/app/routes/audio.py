import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.config import settings
from app.utils.file_validation import validate_audio_file, check_file_size
from app.services.audio_analysis import audio_analyzer
from app.models.analysis import AudioAnalysis
from app.schemas.analysis import AudioAnalysisResponse

router = APIRouter(prefix="/audio", tags=["Audio Analysis"])

@router.post("/analyze", response_model=AudioAnalysisResponse)
async def analyze_audio(
    file: UploadFile = File(...),
    session_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Activity 3.1: Audio Signal Extraction & Analysis Endpoint.
    Loads audio, normalizes sample rate to 16 kHz, converts to mono,
    segments waveform, computes RMS energy, estimates speech/silence,
    and returns structured signal characteristics.
    """
    safe_filename = validate_audio_file(file)
    contents = await file.read()
    check_file_size(contents, max_bytes=settings.MAX_UPLOAD_SIZE_BYTES)

    # Save to disk temporarily if persistent storage is configured or for debugging
    temp_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    with open(temp_path, "wb") as f:
        f.write(contents)

    try:
        # Run Audio Analyzer
        result = audio_analyzer.analyze(temp_path, filename=safe_filename)
        
        # Persist to SQLite
        analysis_record = AudioAnalysis(
            session_id=session_id,
            filename=safe_filename,
            file_path=temp_path,
            duration_seconds=result["duration_seconds"],
            original_sample_rate=result["original_sample_rate"],
            processed_sample_rate=result["processed_sample_rate"],
            original_channels=result["original_channels"],
            processed_channels=result["processed_channels"],
            rms_energy_mean=result["rms_energy_mean"],
            speech_ratio=result["speech_ratio"],
            silence_ratio=result["silence_ratio"],
            segments_json=json.dumps(result["segments"]),
            waveform_downsampled_json=json.dumps(result["waveform_downsampled"]),
            status=result["status"],
            error_message=result["error_message"]
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

        # Clean up raw recording if persistent storage is disabled (Privacy safeguard)
        if not settings.ENABLE_PERSISTENT_RECORDING_STORAGE:
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except Exception:
                pass

        result["id"] = analysis_record.id
        result["session_id"] = session_id
        result["created_at"] = analysis_record.created_at
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio signal extraction error: {str(e)}")

@router.get("/{analysis_id}", response_model=AudioAnalysisResponse)
def get_audio_analysis(analysis_id: int, db: Session = Depends(get_db)):
    rec = db.query(AudioAnalysis).filter(AudioAnalysis.id == analysis_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Audio analysis record not found.")

    segments = json.loads(rec.segments_json) if rec.segments_json else []
    waveform = json.loads(rec.waveform_downsampled_json) if rec.waveform_downsampled_json else []

    return AudioAnalysisResponse(
        id=rec.id,
        session_id=rec.session_id,
        filename=rec.filename,
        duration_seconds=rec.duration_seconds,
        original_sample_rate=rec.original_sample_rate,
        processed_sample_rate=rec.processed_sample_rate,
        original_channels=rec.original_channels,
        processed_channels=rec.processed_channels,
        rms_energy_mean=rec.rms_energy_mean,
        speech_ratio=rec.speech_ratio,
        silence_ratio=rec.silence_ratio,
        segments=segments,
        waveform_downsampled=waveform,
        status=rec.status,
        error_message=rec.error_message,
        created_at=rec.created_at
    )
