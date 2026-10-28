import json
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.student import Student
from app.models.session import Session as SessionModel
from app.models.attendance import Attendance
from app.models.analysis import AudioAnalysis, VideoAnalysis, EngagementAnalysis

router = APIRouter(prefix="/demo", tags=["Demo Mode"])

SAMPLE_STUDENTS = [
    {"student_id": "AIML-2024-001", "name": "Aarav Sharma", "email": "aarav.s@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-002", "name": "Diya Patel", "email": "diya.p@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-003", "name": "Rohan Iyer", "email": "rohan.i@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-004", "name": "Ananya Reddy", "email": "ananya.r@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-005", "name": "Kabir Verma", "email": "kabir.v@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-006", "name": "Ishita Sen", "email": "ishita.s@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-007", "name": "Siddharth Nair", "email": "siddharth.n@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-008", "name": "Pooja Hegde", "email": "pooja.h@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-009", "name": "Aditya Joshi", "email": "aditya.j@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-010", "name": "Meera Kapoor", "email": "meera.k@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-011", "name": "Vikram Sethi", "email": "vikram.s@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
    {"student_id": "AIML-2024-012", "name": "Tanvi Rao", "email": "tanvi.r@univ.edu", "department": "AI & Data Science", "year_of_study": 3},
]

SAMPLE_SESSIONS = [
    {
        "session_code": "SES-AI301-LAB1",
        "title": "Computer Vision: Facial Landmark Extraction Lab",
        "course_name": "Deep Learning & Vision (AI301)",
        "instructor_name": "Prof. A. Sharma",
        "status": "COMPLETED",
        "days_ago": 6,
        "duration_seconds": 3200.0,
        "eng_score": 84.5
    },
    {
        "session_code": "SES-AI302-LEC2",
        "title": "Speech & Acoustic Signal Processing Lecture",
        "course_name": "Speech Processing & NLP (AI302)",
        "instructor_name": "Dr. R. Bannerjee",
        "status": "COMPLETED",
        "days_ago": 4,
        "duration_seconds": 3600.0,
        "eng_score": 78.2
    },
    {
        "session_code": "SES-AI303-SEM1",
        "title": "Multimodal Systems in Smart Classrooms Seminar",
        "course_name": "Advanced AI Seminars (AI303)",
        "instructor_name": "Prof. S. Kulkarni",
        "status": "COMPLETED",
        "days_ago": 2,
        "duration_seconds": 2900.0,
        "eng_score": 91.0
    },
    {
        "session_code": "SES-AI304-REV1",
        "title": "Midterm Review & Hands-on Attendance Demo",
        "course_name": "AI Systems Capstone (AI304)",
        "instructor_name": "Prof. A. Sharma",
        "status": "SCHEDULED",
        "days_ago": 0,
        "duration_seconds": 0.0,
        "eng_score": None
    }
]

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Populates sample students, sessions, attendances, and multimodal analyses
    for an immediate, complete college project evaluation.
    """
    # 1. Seed Students
    created_students = []
    for s_data in SAMPLE_STUDENTS:
        existing = db.query(Student).filter(Student.student_id == s_data["student_id"]).first()
        if not existing:
            stu = Student(**s_data)
            db.add(stu)
            db.commit()
            db.refresh(stu)
            created_students.append(stu)
        else:
            created_students.append(existing)

    now = datetime.now(timezone.utc)
    created_sessions_count = 0

    # 2. Seed Sessions & Multimodal data
    for sess_info in SAMPLE_SESSIONS:
        existing_sess = db.query(SessionModel).filter(SessionModel.session_code == sess_info["session_code"]).first()
        if existing_sess:
            continue

        created_date = now - timedelta(days=sess_info["days_ago"])
        sess = SessionModel(
            session_code=sess_info["session_code"],
            title=sess_info["title"],
            course_name=sess_info["course_name"],
            instructor_name=sess_info["instructor_name"],
            status=sess_info["status"],
            start_time=created_date if sess_info["status"] == "COMPLETED" else None,
            end_time=(created_date + timedelta(seconds=sess_info["duration_seconds"])) if sess_info["status"] == "COMPLETED" else None,
            duration_seconds=sess_info["duration_seconds"],
            consent_confirmed=True,
            created_at=created_date
        )
        db.add(sess)
        db.commit()
        db.refresh(sess)
        created_sessions_count += 1

        # Seed attendance for completed sessions
        if sess_info["status"] == "COMPLETED":
            for idx, stu in enumerate(created_students):
                # 85% attendance rate
                status = "PRESENT" if (idx % 6 != 0) else "ABSENT"
                att = Attendance(
                    session_id=sess.id,
                    student_id=stu.id,
                    status=status,
                    source="CONSENT_VERIFIED" if (idx % 2 == 0) else "MANUAL",
                    check_in_time=created_date + timedelta(minutes=random.randint(1, 10)),
                    notes="Verified in lab demo" if status == "PRESENT" else "Excused illness"
                )
                db.add(att)

            # Seed demo audio analysis
            demo_audio_segments = [
                {"start_seconds": float(i * 2), "end_seconds": float((i + 1) * 2), "rms_energy": round(random.uniform(0.02, 0.18), 4), "speech_activity": random.random() > 0.4}
                for i in range(30)
            ]
            waveform_pts = [round(random.uniform(0.1, 0.9), 2) for _ in range(80)]
            aud = AudioAnalysis(
                session_id=sess.id,
                filename="demo_classroom_audio.wav",
                file_path=None,
                duration_seconds=60.0,
                original_sample_rate=44100,
                processed_sample_rate=16000,
                original_channels=2,
                processed_channels=1,
                rms_energy_mean=0.084,
                speech_ratio=0.52,
                silence_ratio=0.48,
                segments_json=json.dumps(demo_audio_segments),
                waveform_downsampled_json=json.dumps(waveform_pts),
                status="COMPLETED"
            )
            db.add(aud)

            # Seed demo video analysis
            demo_video_timeline = [
                {"timestamp_seconds": float(i), "face_count": random.randint(9, 12), "confidence_mean": 0.88}
                for i in range(60)
            ]
            vid = VideoAnalysis(
                session_id=sess.id,
                filename="demo_classroom_video.mp4",
                file_path=None,
                duration_seconds=60.0,
                fps=30.0,
                width=1280,
                height=720,
                sampled_frames_count=60,
                sampling_interval_seconds=1.0,
                average_face_count=10.6,
                max_face_count=12,
                min_face_count=9,
                face_counts_timeline_json=json.dumps(demo_video_timeline),
                preview_frames_json=json.dumps([]),
                detection_method="HAAR_CASCADE_OPENCV",
                status="COMPLETED"
            )
            db.add(vid)

            # Seed demo engagement analysis
            timeline_pts = [
                {
                    "timestamp_seconds": float(i),
                    "rms_energy": round(random.uniform(0.02, 0.15), 4),
                    "speech_active": random.random() > 0.4,
                    "face_count": random.randint(9, 12),
                    "visual_active": True,
                    "point_engagement_score": round(random.uniform(70.0, 95.0), 1)
                }
                for i in range(60)
            ]
            eng = EngagementAnalysis(
                session_id=sess.id,
                overall_engagement_score=sess_info["eng_score"] or 82.0,
                visual_indicator_score=85.0,
                audio_indicator_score=79.0,
                timeline_json=json.dumps(timeline_pts),
                explainability_json=json.dumps({
                    "formula_name": "Demo Multimodal Acoustic-Visual Heuristic Fusion",
                    "weights": {"visual_presence_weight": 0.5, "acoustic_activity_weight": 0.5},
                    "features_used": ["Detected Face Count Density", "RMS Acoustic Energy", "Acoustic Speech Activity Estimations"],
                    "interpretation_guide": "Demo simulated data indicating active lab discussion and steady visual presence."
                }),
                warnings_json=json.dumps(["[DEMO MODE] This session's telemetry was populated via the sample data generator."]),
                formula_version="v1.2-demo-seed"
            )
            db.add(eng)

            db.commit()

    return {
        "message": "Demo data initialized successfully.",
        "students_available": len(created_students),
        "sessions_seeded": created_sessions_count
    }
