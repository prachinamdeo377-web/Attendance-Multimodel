from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AttendanceBase(BaseModel):
    session_id: int
    student_id: int
    status: Optional[str] = "PRESENT"  # PRESENT, ABSENT, LATE, EXCUSED
    source: Optional[str] = "MANUAL"   # MANUAL, CONSENT_VERIFIED, BATCH_IMPORT
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    check_in_time: datetime
    created_at: datetime
    updated_at: datetime

    # Included student details for convenience
    student_code: Optional[str] = None
    student_name: Optional[str] = None
    student_department: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AttendanceBulkItem(BaseModel):
    student_id: int
    status: str = "PRESENT"
    source: str = "MANUAL"
    notes: Optional[str] = None

class AttendanceBulkCreate(BaseModel):
    session_id: int
    records: list[AttendanceBulkItem]
