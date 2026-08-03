from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
import uuid

from app.core.dependencies import get_db, get_current_student
from app.models.user import User
from app.schemas.attempt import (
    ExamAttemptResponse,
    ExamAttemptSummary,
    StudentAnswerUpdate,
    StudentAnswerResponse
)
from app.services.attempt_service import AttemptService

router = APIRouter()

@router.post("/exams/{exam_id}/start", response_model=ExamAttemptResponse)
def start_exam_attempt(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> Any:
    """
    Start or resume an exam attempt for the logged-in student.
    """
    try:
        service = AttemptService(db)
        attempt = service.get_or_create_attempt(student_id=current_user.id, exam_id=exam_id)
        return attempt
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.get("/attempts/{attempt_id}", response_model=ExamAttemptResponse)
def get_exam_attempt(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> Any:
    """
    Get a specific exam attempt details (including answers for state rehydration).
    """
    service = AttemptService(db)
    attempt = service.db.get(ExamAttemptResponse, attempt_id) # Using attempt model internally would be better
    # Note: proper way is to use the model, but since we just need the attempt from DB
    from app.models.exam_attempt import ExamAttempt
    attempt = db.get(ExamAttempt, attempt_id)
    if not attempt or attempt.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    return attempt

@router.patch("/attempts/{attempt_id}/answer", response_model=StudentAnswerResponse)
def update_student_answer(
    attempt_id: uuid.UUID,
    question_id: uuid.UUID,
    answer_data: StudentAnswerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> Any:
    """
    Auto-save an answer for a specific question in an attempt.
    """
    try:
        service = AttemptService(db)
        # security check
        from app.models.exam_attempt import ExamAttempt
        attempt = db.get(ExamAttempt, attempt_id)
        if not attempt or attempt.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
            
        answer = service.update_answer(attempt_id, question_id, answer_data)
        return answer
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post("/attempts/{attempt_id}/submit", response_model=ExamAttemptResponse)
def submit_exam_attempt(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> Any:
    """
    Finalize and submit the exam attempt.
    """
    try:
        service = AttemptService(db)
        from app.models.exam_attempt import ExamAttempt
        attempt = db.get(ExamAttempt, attempt_id)
        if not attempt or attempt.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
            
        attempt = service.submit_attempt(attempt_id)
        return attempt
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.get("/attempts/{attempt_id}/summary", response_model=ExamAttemptSummary)
def get_attempt_summary(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> Any:
    """
    Get the summary of a submitted exam attempt.
    """
    try:
        service = AttemptService(db)
        from app.models.exam_attempt import ExamAttempt
        attempt = db.get(ExamAttempt, attempt_id)
        if not attempt or attempt.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
            
        summary = service.get_attempt_summary(attempt_id)
        return summary
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
