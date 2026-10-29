import os
import sys
import numpy as np
import pytest

# Ensure project root is in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from core.database import init_db, get_db_session, Student, Session, Attendance
from core.vision_pipeline import vision_pipeline
from core.audio_pipeline import audio_pipeline
from core.engagement_fusion import engagement_fusion
from core.demo_data import seed_demo_data


def test_database_initialization():
    init_db()
    db = get_db_session()
    try:
        # Should be able to query tables without error
        assert db.query(Student).count() >= 0
        assert db.query(Session).count() >= 0
    finally:
        db.close()


def test_audio_pipeline_synthetic():
    # Generate 4.0-second synthetic audio
    audio_bytes = audio_pipeline.generate_synthetic_audio_bytes(duration_sec=4.0)
    assert len(audio_bytes) > 0

    # Process with Librosa
    res = audio_pipeline.process_audio(audio_bytes, original_filename="test_synthetic.wav")
    assert res["processed_sample_rate"] == 16000
    assert res["processed_channels"] == 1
    assert res["duration_seconds"] >= 3.9
    assert len(res["segments"]) >= 2
    assert "rms_energy_mean" in res
    assert "speech_ratio" in res
    assert len(res["waveform_preview"]) > 0


def test_vision_pipeline_dummy_image():
    # 480x640 blank image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    annotated, detections, attention = vision_pipeline.process_image(img)
    assert annotated.shape == (480, 640, 3)
    assert isinstance(detections, list)
    assert 0.0 <= attention <= 100.0


def test_engagement_fusion_calculation():
    syn = engagement_fusion.synthesize(
        visual_score=85.0,
        acoustic_score=70.0,
        attendance_ratio=0.95,
        session_duration_sec=120.0
    )
    assert 0.0 <= syn["overall_engagement_score"] <= 100.0
    assert syn["tier"] in ["HIGH_ENGAGEMENT", "MODERATE_ENGAGEMENT", "PASSIVE_SESSION"]
    assert len(syn["timeline"]) == 5
    assert "ethical_notice" in syn


def test_demo_data_seeding():
    res = seed_demo_data()
    assert res["success"] is True
    assert res["total_students"] >= 12
    assert res["total_sessions"] >= 3
