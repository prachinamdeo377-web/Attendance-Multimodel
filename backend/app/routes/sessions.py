import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.session import Session as SessionModel
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("", response_model=List[SessionResponse])
def get_sessions(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(SessionModel)
    if status:
        query = query.filter(SessionModel.status == status.upper())
    return query.order_by(SessionModel.created_at.desc()).limit(limit).all()

@router.post("", response_model=SessionResponse, status_code=201)
def create_session(session_in: SessionCreate, db: Session = Depends(get_db)):
    code = session_in.session_code
    if not code:
        short_id = uuid.uuid4().hex[:6].upper()
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        code = f"SES-{date_str}-{short_id}"
    
    # Check if duplicate code exists
    if db.query(SessionModel).filter(SessionModel.session_code == code).first():
        raise HTTPException(status_code=400, detail=f"Session code '{code}' already exists.")
    
    new_session = SessionModel(
        session_code=code,
        title=session_in.title,
        course_name=session_in.course_name,
        instructor_name=session_in.instructor_name,
        notes=session_in.notes,
        consent_confirmed=session_in.consent_confirmed,
        status="SCHEDULED"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session_obj

@router.post("/{session_id}/start", response_model=SessionResponse)
def start_session(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    session_obj.status = "LIVE"
    session_obj.start_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session_obj)
    return session_obj

@router.post("/{session_id}/stop", response_model=SessionResponse)
def stop_session(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    end_time = datetime.now(timezone.utc)
    session_obj.status = "COMPLETED"
    session_obj.end_time = end_time
    
    if session_obj.start_time:
        st = session_obj.start_time
        if st.tzinfo is None and end_time.tzinfo is not None:
            st = st.replace(tzinfo=timezone.utc)
        elif st.tzinfo is not None and end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)
        duration = (end_time - st).total_seconds()
        session_obj.duration_seconds = max(0.0, duration)
    
    db.commit()
    db.refresh(session_obj)
    return session_obj

@router.put("/{session_id}", response_model=SessionResponse)
def update_session(session_id: int, session_in: SessionUpdate, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    for key, val in session_in.model_dump(exclude_unset=True).items():
        setattr(session_obj, key, val)
    db.commit()
    db.refresh(session_obj)
    return session_obj

@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    db.delete(session_obj)
    db.commit()
    return {"message": "Session deleted successfully."}
