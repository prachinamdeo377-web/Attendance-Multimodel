from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class SessionBase(BaseModel):
    title: str
    course_name: Optional[str] = "AI & Computer Vision Lab"
    instructor_name: Optional[str] = "Prof. A. Sharma"
    notes: Optional[str] = None
    consent_confirmed: Optional[bool] = True

class SessionCreate(SessionBase):
    session_code: Optional[str] = None

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    course_name: Optional[str] = None
    instructor_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    consent_confirmed: Optional[bool] = None

class SessionResponse(SessionBase):
    id: int
    session_code: str
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
