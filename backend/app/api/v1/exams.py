import uuid
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_faculty, get_current_student, get_current_user, get_current_admin
from app.models.user import User
from app.schemas.exam import (
    ExamCreate, ExamUpdate, ExamResponse, ExamListResponse,
    StudentExamListResponse,
    ExamAssignmentCreate, ExamAssignmentResponse, ExamAssignmentListResponse,
    StudentForAssignment, StudentForAssignmentList, ExamStatsResponse
)
from app.services.exam_service import ExamService

router = APIRouter(prefix="/exams", tags=["Exams"])


def require_staff(current_user: User = Depends(get_current_user)):
    if current_user.role.value not in ["admin", "faculty"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return current_user


# ─── Faculty / Admin Stats ────────────────────────────────────────────────────

@router.get("/stats", response_model=ExamStatsResponse, tags=["Faculty Dashboard"])
def get_faculty_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    """Live dashboard statistics for faculty / admin."""
    service = ExamService(db)
    if current_user.role.value == "admin":
        # Admins get global stats — pass None for faculty_id so service fetches all
        stats = service.get_faculty_stats(current_user.id)
    else:
        stats = service.get_faculty_stats(current_user.id)
    return stats


# ─── Exam CRUD ────────────────────────────────────────────────────────────────

@router.get("", response_model=ExamListResponse)
def list_exams(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    service = ExamService(db)
    if current_user.role.value == "admin":
        exams, total = service.list_exams(skip=skip, limit=limit)
    elif current_user.role.value == "faculty":
        exams, total = service.list_exams_for_faculty(faculty_id=current_user.id, skip=skip, limit=limit)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return {"items": exams, "total": total}


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_faculty: User = Depends(get_current_faculty)
) -> Any:
    return ExamService(db).create_exam(exam_in=exam_in, faculty_id=current_faculty.id)


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return ExamService(db).get_exam_by_id(exam_id)


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: uuid.UUID,
    exam_in: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    return ExamService(db).update_exam(exam_id, exam_in, current_user.id, current_user.role)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> None:
    ExamService(db).delete_exam(exam_id, current_user.id, current_user.role)


# ─── Publish / Schedule ───────────────────────────────────────────────────────

@router.post("/{exam_id}/publish", response_model=ExamResponse)
def publish_exam(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    return ExamService(db).publish_exam(exam_id, current_user.id, current_user.role)


@router.post("/{exam_id}/schedule", response_model=ExamResponse)
def schedule_exam(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    return ExamService(db).schedule_exam(exam_id, current_user.id, current_user.role)


# ─── Student Assignment ───────────────────────────────────────────────────────

class AssignStudentsRequest(BaseModel):
    student_ids: List[uuid.UUID]


@router.post("/{exam_id}/assign", response_model=List[ExamAssignmentResponse])
def assign_students(
    exam_id: uuid.UUID,
    req: AssignStudentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    return ExamService(db).assign_students_to_exam(exam_id, req.student_ids, current_user.id, current_user.role)


@router.delete("/{exam_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student(
    exam_id: uuid.UUID,
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> None:
    """Remove a student assignment from an exam."""
    ExamService(db).remove_student_from_exam(exam_id, student_id, current_user.id, current_user.role)


@router.get("/{exam_id}/assignments", response_model=ExamAssignmentListResponse)
def get_assignments(
    exam_id: uuid.UUID,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    items, total = ExamService(db).get_assignments_for_exam(exam_id, skip=skip, limit=limit)
    return {"items": items, "total": total}


@router.get("/{exam_id}/students", response_model=StudentForAssignmentList)
def get_exam_students(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Any:
    """Get all students with their assignment status for the assign-students modal."""
    students = ExamService(db).get_students_for_exam(exam_id)
    return {"items": students, "total": len(students)}


# ─── Student-specific Exam Routes ────────────────────────────────────────────

student_router = APIRouter(prefix="/student/exams", tags=["Student Exams"])


@student_router.get("", response_model=StudentExamListResponse)
def student_list_exams(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_student: User = Depends(get_current_student)
) -> Any:
    """Return only ACTIVE/SCHEDULED exams assigned to this student."""
    exams, total = ExamService(db).list_exams_for_student(current_student.id, skip=skip, limit=limit)
    return {"items": exams, "total": total}


@student_router.get("/{exam_id}", response_model=ExamResponse)
def student_get_exam(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_student: User = Depends(get_current_student)
) -> Any:
    return ExamService(db).get_exam_by_id(exam_id)
