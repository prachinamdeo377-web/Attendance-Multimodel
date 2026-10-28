import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.config import settings
from app.utils.file_validation import validate_video_file, check_file_size
from app.services.video_analysis import video_analyzer
from app.models.analysis import VideoAnalysis
from app.schemas.analysis import VideoAnalysisResponse

router = APIRouter(prefix="/video", tags=["Video Analysis"])

@router.post("/analyze", response_model=VideoAnalysisResponse)
async def analyze_video(
    file: UploadFile = File(...),
    session_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Computer Vision Video Frame Extraction & Face Detection Endpoint.
    Samples video frames at configured interval, detects faces via OpenCV,
    computes face counts over time, generates annotated previews, and saves metadata.
    """
    safe_filename = validate_video_file(file)
    contents = await file.read()
    check_file_size(contents, max_bytes=settings.MAX_UPLOAD_SIZE_BYTES)

    temp_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    with open(temp_path, "wb") as f:
        f.write(contents)

    try:
        result = video_analyzer.analyze(temp_path, filename=safe_filename)

        analysis_record = VideoAnalysis(
            session_id=session_id,
            filename=safe_filename,
            file_path=temp_path,
            duration_seconds=result["duration_seconds"],
            fps=result["fps"],
            width=result["width"],
            height=result["height"],
            sampled_frames_count=result["sampled_frames_count"],
            sampling_interval_seconds=result["sampling_interval_seconds"],
            average_face_count=result["average_face_count"],
            max_face_count=result["max_face_count"],
            min_face_count=result["min_face_count"],
            face_counts_timeline_json=json.dumps(result["face_counts_timeline"]),
            preview_frames_json=json.dumps(result["preview_frames"]),
            detection_method=result["detection_method"],
            status=result["status"],
            error_message=result["error_message"]
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

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
        raise HTTPException(status_code=500, detail=f"Video analysis error: {str(e)}")

@router.get("/{analysis_id}", response_model=VideoAnalysisResponse)
def get_video_analysis(analysis_id: int, db: Session = Depends(get_db)):
    rec = db.query(VideoAnalysis).filter(VideoAnalysis.id == analysis_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Video analysis record not found.")

    timeline = json.loads(rec.face_counts_timeline_json) if rec.face_counts_timeline_json else []
    previews = json.loads(rec.preview_frames_json) if rec.preview_frames_json else []

    return VideoAnalysisResponse(
        id=rec.id,
        session_id=rec.session_id,
        filename=rec.filename,
        duration_seconds=rec.duration_seconds,
        fps=rec.fps,
        width=rec.width,
        height=rec.height,
        sampled_frames_count=rec.sampled_frames_count,
        sampling_interval_seconds=rec.sampling_interval_seconds,
        average_face_count=rec.average_face_count,
        max_face_count=rec.max_face_count,
        min_face_count=rec.min_face_count,
        face_counts_timeline=timeline,
        preview_frames=previews,
        detection_method=rec.detection_method,
        status=rec.status,
        error_message=rec.error_message,
        created_at=rec.created_at
    )
