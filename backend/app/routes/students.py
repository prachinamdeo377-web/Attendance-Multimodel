from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def get_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Student).filter(Student.is_active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Student.name.ilike(s)) | (Student.student_id.ilike(s)))
    if department:
        query = query.filter(Student.department == department)
    return query.order_by(Student.student_id).limit(limit).all()

@router.post("", response_model=StudentResponse, status_code=201)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.student_id == student_in.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student ID '{student_in.student_id}' already registered.")
    
    student = Student(**student_in.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    for key, value in student_in.model_dump(exclude_unset=True).items():
        setattr(student, key, value)
        
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    db.delete(student)
    db.commit()
    return {"message": f"Student '{student.student_id}' deleted successfully."}
