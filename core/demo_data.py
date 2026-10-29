from datetime import datetime, timezone, timedelta
from core.database import get_db_session, Student, Session, Attendance, AudioAnalysis, VideoAnalysis, EngagementAnalysis

SAMPLE_STUDENTS = [
    {"student_id": "CS-2024-001", "name": "Aarav Sharma", "email": "aarav.sharma@univ.edu", "department": "Artificial Intelligence", "year_of_study": 3},
    {"student_id": "CS-2024-002", "name": "Diya Patel", "email": "diya.patel@univ.edu", "department": "Artificial Intelligence", "year_of_study": 3},
    {"student_id": "CS-2024-003", "name": "Rohan Verma", "email": "rohan.verma@univ.edu", "department": "Computer Science & Engg", "year_of_study": 3},
    {"student_id": "CS-2024-004", "name": "Ananya Iyer", "email": "ananya.iyer@univ.edu", "department": "Data Science", "year_of_study": 4},
    {"student_id": "CS-2024-005", "name": "Kabir Mehta", "email": "kabir.mehta@univ.edu", "department": "Computer Science & Engg", "year_of_study": 3},
    {"student_id": "CS-2024-006", "name": "Sneha Kulkarni", "email": "sneha.k@univ.edu", "department": "Artificial Intelligence", "year_of_study": 2},
    {"student_id": "CS-2024-007", "name": "Aditya Rao", "email": "aditya.rao@univ.edu", "department": "Robotics & Automation", "year_of_study": 3},
    {"student_id": "CS-2024-008", "name": "Pooja Nair", "email": "pooja.nair@univ.edu", "department": "Data Science", "year_of_study": 3},
    {"student_id": "CS-2024-009", "name": "Vikram Singh", "email": "vikram.s@univ.edu", "department": "Artificial Intelligence", "year_of_study": 4},
    {"student_id": "CS-2024-010", "name": "Meera Joshi", "email": "meera.j@univ.edu", "department": "Computer Science & Engg", "year_of_study": 2},
    {"student_id": "CS-2024-011", "name": "Tanmay Deshmukh", "email": "tanmay.d@univ.edu", "department": "Robotics & Automation", "year_of_study": 3},
    {"student_id": "CS-2024-012", "name": "Ishita Sen", "email": "ishita.sen@univ.edu", "department": "Data Science", "year_of_study": 3},
]


def seed_demo_data() -> dict:
    db = get_db_session()
    try:
        # 1. Seed Students
        enrolled_students = []
        for s_data in SAMPLE_STUDENTS:
            existing = db.query(Student).filter(Student.student_id == s_data["student_id"]).first()
            if not existing:
                student = Student(**s_data)
                db.add(student)
                db.flush()
                enrolled_students.append(student)
            else:
                enrolled_students.append(existing)

        # 2. Seed Sample Sessions
        now = datetime.now(timezone.utc)
        sample_sessions = [
            {
                "session_code": "SESS-AI-01",
                "title": "Computer Vision & MediaPipe Lab",
                "course_name": "CS401 - Multimodal AI",
                "instructor_name": "Dr. Prachi Namdeo",
                "status": "COMPLETED",
                "duration_seconds": 3600.0,
                "start_time": now - timedelta(days=2, hours=3),
                "end_time": now - timedelta(days=2, hours=2),
                "notes": "Covered MediaPipe face detection, landmark meshes, and OpenCV frame extraction."
            },
            {
                "session_code": "SESS-AI-02",
                "title": "Activity 3.1: Librosa Acoustic Energy Lab",
                "course_name": "CS402 - Speech & Audio Signals",
                "instructor_name": "Prof. A. Sharma",
                "status": "COMPLETED",
                "duration_seconds": 3300.0,
                "start_time": now - timedelta(days=1, hours=4),
                "end_time": now - timedelta(days=1, hours=3),
                "notes": "Normalized 16kHz audio sample rate and windowed 2.0s RMS speech-activity detection."
            },
            {
                "session_code": "SESS-AI-03",
                "title": "Live Interactive Seminar: Smart Classrooms",
                "course_name": "CS405 - Educational Telemetry",
                "instructor_name": "Dr. Prachi Namdeo",
                "status": "LIVE",
                "duration_seconds": 1800.0,
                "start_time": now - timedelta(minutes=30),
                "end_time": None,
                "notes": "Ongoing live demonstration session with camera and microphone telemetry."
            }
        ]

        created_sessions = []
        for sess_data in sample_sessions:
            existing = db.query(Session).filter(Session.session_code == sess_data["session_code"]).first()
            if not existing:
                sess = Session(**sess_data)
                db.add(sess)
                db.flush()
                created_sessions.append(sess)
            else:
                created_sessions.append(existing)

        # 3. Seed Attendance Records
        for sess in created_sessions:
            for i, student in enumerate(enrolled_students):
                existing_att = db.query(Attendance).filter(
                    Attendance.session_id == sess.id,
                    Attendance.student_id == student.id
                ).first()
                if not existing_att:
                    # Realistic distribution: 80% Present, 10% Late, 10% Absent
                    status = "PRESENT" if i < 9 else ("LATE" if i == 9 or i == 10 else "ABSENT")
                    att = Attendance(
                        session_id=sess.id,
                        student_id=student.id,
                        status=status,
                        source="CONSENT_VERIFIED"
                    )
                    db.add(att)

        db.commit()

        total_students = db.query(Student).count()
        total_sessions = db.query(Session).count()
        total_attendances = db.query(Attendance).count()

        return {
            "success": True,
            "total_students": total_students,
            "total_sessions": total_sessions,
            "total_attendances": total_attendances
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
