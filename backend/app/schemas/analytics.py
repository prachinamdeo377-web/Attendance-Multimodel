from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AttendanceTrendItem(BaseModel):
    session_id: int
    session_code: str
    session_title: str
    date: str
    total_enrolled: int
    present_count: int
    attendance_rate: float

class EngagementTrendItem(BaseModel):
    session_id: int
    session_code: str
    session_title: str
    date: str
    engagement_score: float
    visual_score: float
    audio_score: float

class AnalyticsOverview(BaseModel):
    total_sessions: int
    total_enrolled_students: int
    average_attendance_rate: float
    average_engagement_score: float
    recent_sessions: List[dict]
    attendance_trends: List[AttendanceTrendItem]
    engagement_trends: List[EngagementTrendItem]
