from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database.session import get_db
from app.core.dependencies import require_staff, get_current_student, get_active_user
from app.models.user import User
from app.core.enums import UserRole
from app.services.report_service import ReportService
from app.schemas.report import (
    ExamReportSummary,
    StudentExamPerformanceResponse,
    StudentDetailReportResponse,
    QuestionAnalyticsResponse
)

router = APIRouter()

@router.get("/{exam_id}/report/my-report", response_model=StudentDetailReportResponse)
def get_my_student_report(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Allow an authenticated student to view their own exam performance and compliance report.
    """
    try:
        service = ReportService(db)
        return service.get_student_detail_report(exam_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while generating your report")

@router.get("/{exam_id}/report", response_model=ExamReportSummary)
def get_exam_report_summary(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    try:
        service = ReportService(db)
        return service.get_exam_summary(exam_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while generating the report summary")


@router.get("/{exam_id}/report/students", response_model=StudentExamPerformanceResponse)
def get_exam_students_report(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    try:
        service = ReportService(db)
        return service.get_student_performance(exam_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while generating the students report")


@router.get("/{exam_id}/report/students/{student_id}", response_model=StudentDetailReportResponse)
def get_student_detail_report(
    exam_id: uuid.UUID,
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    is_staff = current_user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FACULTY)
    is_own_report = current_user.id == student_id
    if not (is_staff or is_own_report):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    try:
        service = ReportService(db)
        return service.get_student_detail_report(exam_id, student_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while generating the student detail report")


@router.get("/{exam_id}/report/questions", response_model=QuestionAnalyticsResponse)
def get_question_analytics(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    try:
        service = ReportService(db)
        return service.get_question_analytics(exam_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while generating question analytics")
