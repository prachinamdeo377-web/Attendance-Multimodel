from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    student_id: str
    name: str
    email: Optional[str] = None
    department: Optional[str] = "Artificial Intelligence & Data Science"
    year_of_study: Optional[int] = 3
    is_active: Optional[bool] = True

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
