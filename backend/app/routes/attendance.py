from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app.models.session import Session as SessionModel
from app.models.student import Student
from app.models.attendance import Attendance
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    AttendanceBulkCreate
)
from app.services.report_service import report_service

router = APIRouter(prefix="", tags=["Attendance"])

@router.get("/sessions/{session_id}/attendance", response_model=List[AttendanceResponse])
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")

    records = db.query(Attendance, Student)\
        .join(Student, Attendance.student_id == Student.id)\
        .filter(Attendance.session_id == session_id)\
        .order_by(Student.student_id).all()

    result = []
    for att, stu in records:
        resp = AttendanceResponse(
            id=att.id,
            session_id=att.session_id,
            student_id=att.student_id,
            status=att.status,
            source=att.source,
            notes=att.notes,
            check_in_time=att.check_in_time,
            created_at=att.created_at,
            updated_at=att.updated_at,
            student_code=stu.student_id,
            student_name=stu.name,
            student_department=stu.department
        )
        result.append(resp)
    return result

@router.post("/sessions/{session_id}/attendance", response_model=AttendanceResponse, status_code=201)
def record_attendance(session_id: int, att_in: AttendanceCreate, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    student = db.query(Student).filter(Student.id == att_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    existing = db.query(Attendance).filter(
        Attendance.session_id == session_id,
        Attendance.student_id == att_in.student_id
    ).first()

    if existing:
        # Update existing record to prevent duplicate entries while keeping it auditable
        existing.status = att_in.status or existing.status
        existing.source = att_in.source or existing.source
        existing.notes = att_in.notes or existing.notes
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        att_record = existing
    else:
        att_record = Attendance(
            session_id=session_id,
            student_id=att_in.student_id,
            status=att_in.status or "PRESENT",
            source=att_in.source or "MANUAL",
            notes=att_in.notes,
            check_in_time=datetime.now(timezone.utc)
        )
        db.add(att_record)
        db.commit()
        db.refresh(att_record)

    return AttendanceResponse(
        id=att_record.id,
        session_id=att_record.session_id,
        student_id=att_record.student_id,
        status=att_record.status,
        source=att_record.source,
        notes=att_record.notes,
        check_in_time=att_record.check_in_time,
        created_at=att_record.created_at,
        updated_at=att_record.updated_at,
        student_code=student.student_id,
        student_name=student.name,
        student_department=student.department
    )

@router.post("/sessions/{session_id}/attendance/bulk")
def record_bulk_attendance(session_id: int, bulk_in: AttendanceBulkCreate, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")

    updated_count = 0
    created_count = 0

    for item in bulk_in.records:
        existing = db.query(Attendance).filter(
            Attendance.session_id == session_id,
            Attendance.student_id == item.student_id
        ).first()

        if existing:
            existing.status = item.status
            existing.source = item.source
            existing.notes = item.notes
            existing.updated_at = datetime.now(timezone.utc)
            updated_count += 1
        else:
            new_rec = Attendance(
                session_id=session_id,
                student_id=item.student_id,
                status=item.status,
                source=item.source,
                notes=item.notes,
                check_in_time=datetime.now(timezone.utc)
            )
            db.add(new_rec)
            created_count += 1

    db.commit()
    return {
        "message": "Bulk attendance updated successfully.",
        "created": created_count,
        "updated": updated_count
    }

@router.get("/sessions/{session_id}/attendance/export")
def export_attendance_csv(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")

    records = db.query(Attendance, Student)\
        .join(Student, Attendance.student_id == Student.id)\
        .filter(Attendance.session_id == session_id)\
        .order_by(Student.student_id).all()

    att_dicts = []
    for att, stu in records:
        att_dicts.append({
            "student_code": stu.student_id,
            "student_name": stu.name,
            "student_department": stu.department,
            "status": att.status,
            "check_in_time": att.check_in_time.strftime("%Y-%m-%d %H:%M:%S") if att.check_in_time else "",
            "source": att.source,
            "notes": att.notes
        })

    session_info = {
        "session_code": session_obj.session_code,
        "course_name": session_obj.course_name,
        "title": session_obj.title
    }

    csv_data = report_service.generate_attendance_csv(session_info, att_dicts)
    filename = f"attendance_{session_obj.session_code}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
