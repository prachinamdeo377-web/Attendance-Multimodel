import json
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.student import Student
from app.models.session import Session as SessionModel
from app.models.attendance import Attendance
from app.models.analysis import AudioAnalysis, VideoAnalysis, EngagementAnalysis
from app.schemas.analytics import AnalyticsOverview, AttendanceTrendItem, EngagementTrendItem
from app.schemas.analysis import EngagementResponse
from app.services.engagement_analysis import engagement_analyzer
from app.services.report_service import report_service

router = APIRouter(prefix="", tags=["Analytics & Reports"])

@router.get("/analytics/overview", response_model=AnalyticsOverview)
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Computes real-time dashboard analytics across sessions, attendance records,
    and multimodal engagement indicators.
    """
    total_sessions = db.query(SessionModel).count()
    total_students = db.query(Student).filter(Student.is_active == True).count()

    # Calculate overall attendance rate
    all_attendance = db.query(Attendance).all()
    if all_attendance:
        present_count = sum(1 for a in all_attendance if a.status in ["PRESENT", "LATE"])
        attendance_rate = round((present_count / len(all_attendance)) * 100.0, 1)
    else:
        attendance_rate = 0.0

    # Calculate average engagement score across completed engagement records
    eng_records = db.query(EngagementAnalysis).all()
    if eng_records:
        avg_eng = round(float(sum(e.overall_engagement_score for e in eng_records) / len(eng_records)), 1)
    else:
        avg_eng = 0.0

    # Recent sessions (latest 5)
    recent_sessions_objs = db.query(SessionModel).order_by(SessionModel.created_at.desc()).limit(5).all()
    recent_sessions = []
    for s in recent_sessions_objs:
        recent_sessions.append({
            "id": s.id,
            "session_code": s.session_code,
            "title": s.title,
            "course_name": s.course_name,
            "status": s.status,
            "date": s.created_at.strftime("%b %d, %Y") if s.created_at else "N/A",
            "duration_seconds": s.duration_seconds
        })

    # Attendance trends per session
    completed_sessions = db.query(SessionModel).order_by(SessionModel.created_at.asc()).limit(10).all()
    attendance_trends = []
    engagement_trends = []

    for s in completed_sessions:
        s_att = db.query(Attendance).filter(Attendance.session_id == s.id).all()
        pres = sum(1 for a in s_att if a.status in ["PRESENT", "LATE"])
        rate = round((pres / max(1, len(s_att))) * 100.0, 1) if s_att else 0.0

        attendance_trends.append(AttendanceTrendItem(
            session_id=s.id,
            session_code=s.session_code,
            session_title=s.title,
            date=s.created_at.strftime("%b %d") if s.created_at else "N/A",
            total_enrolled=max(total_students, len(s_att)),
            present_count=pres,
            attendance_rate=rate
        ))

        eng = db.query(EngagementAnalysis).filter(EngagementAnalysis.session_id == s.id).first()
        if eng:
            engagement_trends.append(EngagementTrendItem(
                session_id=s.id,
                session_code=s.session_code,
                session_title=s.title,
                date=s.created_at.strftime("%b %d") if s.created_at else "N/A",
                engagement_score=eng.overall_engagement_score,
                visual_score=eng.visual_indicator_score,
                audio_score=eng.audio_indicator_score
            ))

    return AnalyticsOverview(
        total_sessions=total_sessions,
        total_enrolled_students=total_students,
        average_attendance_rate=attendance_rate,
        average_engagement_score=avg_eng,
        recent_sessions=recent_sessions,
        attendance_trends=attendance_trends,
        engagement_trends=engagement_trends
    )

@router.get("/sessions/{session_id}/engagement", response_model=EngagementResponse)
def get_or_compute_session_engagement(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Check if existing analysis is already stored
    existing_eng = db.query(EngagementAnalysis).filter(EngagementAnalysis.session_id == session_id).first()
    if existing_eng:
        return EngagementResponse(
            id=existing_eng.id,
            session_id=existing_eng.session_id,
            overall_engagement_score=existing_eng.overall_engagement_score,
            visual_indicator_score=existing_eng.visual_indicator_score,
            audio_indicator_score=existing_eng.audio_indicator_score,
            timeline=json.loads(existing_eng.timeline_json) if existing_eng.timeline_json else [],
            explainability=json.loads(existing_eng.explainability_json) if existing_eng.explainability_json else {},
            warnings=json.loads(existing_eng.warnings_json) if existing_eng.warnings_json else [],
            formula_version=existing_eng.formula_version,
            created_at=existing_eng.created_at
        )

    # Fetch associated audio and video analysis
    audio_rec = db.query(AudioAnalysis).filter(AudioAnalysis.session_id == session_id).order_by(AudioAnalysis.id.desc()).first()
    video_rec = db.query(VideoAnalysis).filter(VideoAnalysis.session_id == session_id).order_by(VideoAnalysis.id.desc()).first()

    audio_dict = None
    if audio_rec:
        audio_dict = {
            "status": audio_rec.status,
            "duration_seconds": audio_rec.duration_seconds,
            "segments": json.loads(audio_rec.segments_json) if audio_rec.segments_json else []
        }

    video_dict = None
    if video_rec:
        video_dict = {
            "status": video_rec.status,
            "duration_seconds": video_rec.duration_seconds,
            "face_counts_timeline": json.loads(video_rec.face_counts_timeline_json) if video_rec.face_counts_timeline_json else []
        }

    computed = engagement_analyzer.align_and_compute(session_id, audio_dict, video_dict)

    # Save to database
    eng_model = EngagementAnalysis(
        session_id=session_id,
        overall_engagement_score=computed["overall_engagement_score"],
        visual_indicator_score=computed["visual_indicator_score"],
        audio_indicator_score=computed["audio_indicator_score"],
        timeline_json=json.dumps(computed["timeline"]),
        explainability_json=json.dumps(computed["explainability"]),
        warnings_json=json.dumps(computed["warnings"]),
        formula_version=computed["formula_version"]
    )
    db.add(eng_model)
    db.commit()
    db.refresh(eng_model)

    computed["id"] = eng_model.id
    computed["created_at"] = eng_model.created_at
    return computed

@router.get("/sessions/{session_id}/report")
def get_session_report(session_id: int, format: str = "json", db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Gather components
    attendances = db.query(Attendance).filter(Attendance.session_id == session_id).all()
    present_count = sum(1 for a in attendances if a.status in ["PRESENT", "LATE"])
    total_enrolled = db.query(Student).filter(Student.is_active == True).count()
    rate = round((present_count / max(1, len(attendances))) * 100.0, 1) if attendances else 0.0

    att_stats = {
        "total_enrolled": total_enrolled,
        "recorded_count": len(attendances),
        "present_count": present_count,
        "absent_count": len(attendances) - present_count,
        "attendance_rate": rate
    }

    audio_rec = db.query(AudioAnalysis).filter(AudioAnalysis.session_id == session_id).order_by(AudioAnalysis.id.desc()).first()
    audio_stats = None
    if audio_rec:
        audio_stats = {
            "filename": audio_rec.filename,
            "status": audio_rec.status,
            "duration_seconds": audio_rec.duration_seconds,
            "original_channels": audio_rec.original_channels,
            "processed_channels": audio_rec.processed_channels,
            "original_sample_rate": audio_rec.original_sample_rate,
            "processed_sample_rate": audio_rec.processed_sample_rate,
            "rms_energy_mean": audio_rec.rms_energy_mean,
            "speech_ratio": audio_rec.speech_ratio,
            "silence_ratio": audio_rec.silence_ratio
        }

    video_rec = db.query(VideoAnalysis).filter(VideoAnalysis.session_id == session_id).order_by(VideoAnalysis.id.desc()).first()
    video_stats = None
    if video_rec:
        video_stats = {
            "filename": video_rec.filename,
            "status": video_rec.status,
            "duration_seconds": video_rec.duration_seconds,
            "fps": video_rec.fps,
            "width": video_rec.width,
            "height": video_rec.height,
            "sampled_frames_count": video_rec.sampled_frames_count,
            "sampling_interval_seconds": video_rec.sampling_interval_seconds,
            "average_face_count": video_rec.average_face_count,
            "max_face_count": video_rec.max_face_count,
            "detection_method": video_rec.detection_method
        }

    eng_rec = db.query(EngagementAnalysis).filter(EngagementAnalysis.session_id == session_id).first()
    eng_stats = None
    if eng_rec:
        eng_stats = {
            "overall_engagement_score": eng_rec.overall_engagement_score,
            "visual_indicator_score": eng_rec.visual_indicator_score,
            "audio_indicator_score": eng_rec.audio_indicator_score,
            "formula_version": eng_rec.formula_version,
            "explainability": json.loads(eng_rec.explainability_json) if eng_rec.explainability_json else {},
            "warnings": json.loads(eng_rec.warnings_json) if eng_rec.warnings_json else []
        }

    session_dict = {
        "session_code": session_obj.session_code,
        "title": session_obj.title,
        "course_name": session_obj.course_name,
        "instructor_name": session_obj.instructor_name,
        "status": session_obj.status
    }

    if format.lower() == "markdown":
        md = report_service.generate_comprehensive_report_markdown(
            session_dict, att_stats, audio_stats, video_stats, eng_stats
        )
        return Response(
            content=md,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=report_{session_obj.session_code}.md"}
        )

    return {
        "session": session_dict,
        "attendance": att_stats,
        "audio": audio_stats,
        "video": video_stats,
        "engagement": eng_stats
    }

@router.get("/sessions/{session_id}/timeline/export")
def export_session_timeline_csv(session_id: int, db: Session = Depends(get_db)):
    eng_rec = db.query(EngagementAnalysis).filter(EngagementAnalysis.session_id == session_id).first()
    if not eng_rec or not eng_rec.timeline_json:
        raise HTTPException(status_code=404, detail="No engagement timeline points available for this session.")

    timeline = json.loads(eng_rec.timeline_json)
    csv_data = report_service.generate_timeline_csv(timeline)

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=timeline_session_{session_id}.csv"}
    )
