import os
import sys
import pytest
import numpy as np
import soundfile as sf
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend root is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, get_db
from app.main import app
from app.services.audio_analysis import AudioAnalyzer
from app.services.video_analysis import VideoAnalyzer
from app.services.engagement_analysis import EngagementAnalyzer

# Setup temporary SQLite database for testing
TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "test_attendance_multimodal.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

@pytest.fixture
def client():
    return TestClient(app)

# 1. Health Endpoint Test
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["database"] == "HEALTHY"

# 2. Student CRUD & Duplicate Check
def test_student_flow(client):
    payload = {
        "student_id": "TEST-001",
        "name": "Jane Doe",
        "email": "jane.doe@univ.edu",
        "department": "Artificial Intelligence",
        "year_of_study": 3
    }
    # Create student
    res = client.post("/api/students", json=payload)
    assert res.status_code == 201
    created = res.json()
    assert created["student_id"] == "TEST-001"
    assert created["name"] == "Jane Doe"

    # Attempt duplicate registration -> should fail with 400
    res_dup = client.post("/api/students", json=payload)
    assert res_dup.status_code == 400

    # List students
    res_list = client.get("/api/students")
    assert res_list.status_code == 200
    assert any(s["student_id"] == "TEST-001" for s in res_list.json())

# 3. Session Lifecycle (Create -> Start -> Stop)
def test_session_lifecycle(client):
    session_data = {
        "title": "Computer Vision Lecture",
        "course_name": "AI 301",
        "instructor_name": "Prof. Smith"
    }
    # Create session
    res = client.post("/api/sessions", json=session_data)
    assert res.status_code == 201
    sess = res.json()
    session_id = sess["id"]
    assert sess["status"] == "SCHEDULED"

    # Start session
    res_start = client.post(f"/api/sessions/{session_id}/start")
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "LIVE"
    assert res_start.json()["start_time"] is not None

    # Stop session
    res_stop = client.post(f"/api/sessions/{session_id}/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "COMPLETED"
    assert res_stop.json()["end_time"] is not None

# 4. Attendance Recording & Duplicate Prevention
def test_attendance_recording(client):
    # Create session & student
    s_res = client.post("/api/sessions", json={"title": "Lab 1", "course_name": "AI 101"})
    session_id = s_res.json()["id"]

    stu_res = client.post("/api/students", json={"student_id": "ATT-001", "name": "Alice Bob"})
    student_id = stu_res.json()["id"]

    # Mark attendance
    att_payload = {
        "session_id": session_id,
        "student_id": student_id,
        "status": "PRESENT",
        "source": "MANUAL",
        "notes": "First check-in"
    }
    res = client.post(f"/api/sessions/{session_id}/attendance", json=att_payload)
    assert res.status_code == 201
    att_data = res.json()
    assert att_data["status"] == "PRESENT"
    assert att_data["student_code"] == "ATT-001"

    # Duplicate check: Posting again should update existing without raising duplicate key error
    att_payload["status"] = "LATE"
    att_payload["notes"] = "Arrived 5m late"
    res_update = client.post(f"/api/sessions/{session_id}/attendance", json=att_payload)
    assert res_update.status_code == 201
    assert res_update.json()["status"] == "LATE"

    # Verify session attendance list
    list_res = client.get(f"/api/sessions/{session_id}/attendance")
    assert list_res.status_code == 200
    records = list_res.json()
    assert len(records) == 1
    assert records[0]["status"] == "LATE"

# 5. Activity 3.1 Audio Analysis Unit Tests
def test_audio_analysis_sine_wave():
    analyzer = AudioAnalyzer(target_sample_rate=16000, segment_duration_seconds=1.0)

    # Generate synthetic 2-second audio (1 sec sine tone, 1 sec pure silence)
    sr = 16000
    t_tone = np.linspace(0, 1.0, sr, endpoint=False)
    tone = 0.5 * np.sin(2 * np.pi * 440.0 * t_tone)  # 440 Hz A4
    silence = np.zeros(sr)
    synthetic_audio = np.concatenate([tone, silence]).astype(np.float32)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_name = tmp.name

    try:
        sf.write(tmp_name, synthetic_audio, sr)
        result = analyzer.analyze(tmp_name, filename="synthetic.wav")

        assert result["status"] == "COMPLETED"
        assert result["duration_seconds"] == 2.0
        assert result["processed_sample_rate"] == 16000
        assert len(result["segments"]) == 2

        # Segment 0 (tone) should have higher RMS energy than Segment 1 (silence)
        assert result["segments"][0]["rms_energy"] > result["segments"][1]["rms_energy"]
        assert result["segments"][1]["rms_energy"] < 0.01
        assert len(result["waveform_downsampled"]) > 0
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def test_silent_audio():
    analyzer = AudioAnalyzer(target_sample_rate=16000, segment_duration_seconds=1.0)
    sr = 16000
    silent_audio = np.zeros(sr * 2, dtype=np.float32)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_name = tmp.name

    try:
        sf.write(tmp_name, silent_audio, sr)
        result = analyzer.analyze(tmp_name, filename="silent.wav")

        assert result["status"] == "COMPLETED"
        assert result["rms_energy_mean"] == 0.0
        assert result["speech_ratio"] == 0.0
        assert result["silence_ratio"] == 1.0
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def test_invalid_audio_file():
    analyzer = AudioAnalyzer()
    result = analyzer.analyze("non_existent_file_path.wav", filename="ghost.wav")
    assert result["status"] == "FAILED"
    assert "Audio decode failed" in result["error_message"]

# 6. Invalid Video Handling
def test_invalid_video_file():
    analyzer = VideoAnalyzer()
    result = analyzer.analyze("non_existent_video.mp4", filename="fake.mp4")
    assert result["status"] == "FAILED"
    assert "File does not exist" in result["error_message"]

# 7. Engagement Indicator Calculation
def test_engagement_calculation():
    analyzer = EngagementAnalyzer(weight_visual=0.5, weight_audio=0.5)

    audio_res = {
        "status": "COMPLETED",
        "duration_seconds": 4.0,
        "segments": [
            {"start_seconds": 0.0, "end_seconds": 2.0, "rms_energy": 0.15, "speech_activity": True},
            {"start_seconds": 2.0, "end_seconds": 4.0, "rms_energy": 0.01, "speech_activity": False}
        ]
    }

    video_res = {
        "status": "COMPLETED",
        "duration_seconds": 4.0,
        "face_counts_timeline": [
            {"timestamp_seconds": 0.0, "face_count": 12},
            {"timestamp_seconds": 1.0, "face_count": 12},
            {"timestamp_seconds": 2.0, "face_count": 10},
            {"timestamp_seconds": 3.0, "face_count": 10}
        ]
    }

    res = analyzer.align_and_compute(session_id=99, audio_result=audio_res, video_result=video_res)
    assert res["session_id"] == 99
    assert res["overall_engagement_score"] > 0.0
    assert len(res["timeline"]) == 4
    assert res["formula_version"] == EngagementAnalyzer.FORMULA_VERSION
    assert "explainability" in res

# 8. Analytics Overview Endpoint
def test_analytics_overview(client):
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_sessions" in data
    assert "total_enrolled_students" in data
    assert "average_attendance_rate" in data
    assert "average_engagement_score" in data

# 9. Demo Data Seeding & Report Export Test
def test_demo_seeding_and_report(client):
    # Seed demo data
    res_seed = client.post("/api/demo/seed")
    assert res_seed.status_code == 200
    seed_data = res_seed.json()
    assert seed_data["students_available"] >= 10

    # Verify session list now contains seeded sessions
    sess_res = client.get("/api/sessions")
    assert sess_res.status_code == 200
    sessions = sess_res.json()
    assert len(sessions) >= 3

    # Test report export for the first session
    first_session_id = sessions[0]["id"]
    rep_res = client.get(f"/api/sessions/{first_session_id}/report?format=json")
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert "session" in rep_data
    assert "attendance" in rep_data

    # Test markdown report download
    md_res = client.get(f"/api/sessions/{first_session_id}/report?format=markdown")
    assert md_res.status_code == 200
    assert "Classroom Multimodal Session Report" in md_res.text

