import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.question import (
    QuestionCreate, 
    QuestionUpdate, 
    QuestionResponse, 
    QuestionListResponse,
    BulkQuestionCreate,
    QuestionImportResponse,
    QuestionReorderRequest
)
from app.services.question_service import QuestionService
from app.core.enums import UserRole

router = APIRouter(prefix="/questions", tags=["Questions"])

def get_question_service(db: Session = Depends(get_db)) -> QuestionService:
    return QuestionService(db)

def require_staff(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.FACULTY]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return current_user

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    question_in: QuestionCreate,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    return service.create_question(question_in, current_user.id, current_user.role)

@router.get("/{id}", response_model=QuestionResponse)
def get_question(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: QuestionService = Depends(get_question_service)
):
    return service.get_question_by_id(id)

@router.put("/{id}", response_model=QuestionResponse)
def update_question(
    id: uuid.UUID,
    question_in: QuestionUpdate,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    return service.update_question(id, question_in, current_user.id, current_user.role)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    id: uuid.UUID,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    service.delete_question(id, current_user.id, current_user.role)

@router.post("/{id}/duplicate", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def duplicate_question(
    id: uuid.UUID,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    return service.duplicate_question(id, current_user.id, current_user.role)

@router.post("/bulk", response_model=QuestionImportResponse, status_code=status.HTTP_201_CREATED)
def bulk_create_questions(
    bulk_in: BulkQuestionCreate,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    return service.bulk_create_questions(bulk_in, current_user.id, current_user.role)

@router.post("/reorder", status_code=status.HTTP_200_OK)
def reorder_questions(
    exam_id: uuid.UUID,
    reorder_request: QuestionReorderRequest,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    service.reorder_questions(exam_id, reorder_request, current_user.id, current_user.role)
    return {"message": "Questions reordered successfully"}

# Using a new router for exams/{exam_id}/questions to avoid prefix conflicts if mounted properly in main.py,
# but can also be explicitly declared here without the prefix using an alternate APIRouter or explicit path.
# Since this router is prefixed with /questions, we will create a separate router or mount it accordingly.
exam_questions_router = APIRouter(tags=["Questions"])

@exam_questions_router.get("/exams/{exam_id}/questions", response_model=QuestionListResponse)
def list_questions_for_exam(
    exam_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff),
    service: QuestionService = Depends(get_question_service)
):
    questions, total = service.list_questions_for_exam(exam_id, current_user.id, current_user.role, skip, limit)
    return {"items": questions, "total": total}
