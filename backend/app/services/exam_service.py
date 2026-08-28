import uuid
import logging
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, select
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any

from app.models.exam import Exam
from app.models.exam_assignment import ExamAssignment
from app.models.question import Question
from app.models.exam_attempt import ExamAttempt
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.schemas.exam import ExamCreate, ExamUpdate, ExamAssignmentCreate
from app.core.enums import ExamStatus, AssignmentStatus, UserRole, AttemptStatus

logger = logging.getLogger(__name__)


class ExamService:
    def __init__(self, db: Session):
        self.db = db

    def get_exam_by_id(self, exam_id: uuid.UUID) -> Exam:
        exam = self.db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
        return exam

    def get_exam_by_code(self, exam_code: str) -> Exam:
        exam = self.db.query(Exam).filter(Exam.exam_code == exam_code.strip().upper(), Exam.is_deleted == False).first()
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
        return exam

    def create_exam(self, exam_in: ExamCreate, faculty_id: uuid.UUID) -> Exam:
        try:
            db_exam = Exam(
                **exam_in.model_dump(),
                created_by=faculty_id
            )
            self.db.add(db_exam)
            self.db.commit()
            self.db.refresh(db_exam)
            logger.info(f"Exam {db_exam.id} created by {faculty_id}")
            return db_exam
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam code already exists. Please use a unique exam code.")

    def update_exam(self, exam_id: uuid.UUID, exam_in: ExamUpdate, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.get_exam_by_id(exam_id)

        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this exam")

        update_data = exam_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(exam, field, value)

        if exam.passing_marks > exam.total_marks:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passing marks cannot be greater than total marks")
        if exam.start_time and exam.end_time and exam.end_time <= exam.start_time:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time")

        try:
            self.db.commit()
            self.db.refresh(exam)
            logger.info(f"Exam {exam.id} updated by {user_id}")
            return exam
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error")

    def delete_exam(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> None:
        exam = self.get_exam_by_id(exam_id)

        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this exam")

        # Removed active status check to allow deletion from frontend


        exam.is_deleted = True
        
        # Cascade soft delete to questions and assignments
        from app.models.question import Question
        from app.models.exam_assignment import ExamAssignment
        self.db.query(Question).filter(Question.exam_id == exam_id).update({"is_deleted": True})
        self.db.query(ExamAssignment).filter(ExamAssignment.exam_id == exam_id).update({"is_deleted": True})
        
        self.db.commit()
        logger.info(f"Exam {exam.id} and its associated records logically deleted by {user_id}")

    def publish_exam(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to publish this exam")

        # Validation rules
        errors = []

        # 1. Must have at least one active question
        question_count = self.db.query(Question).filter(
            Question.exam_id == exam_id,
            Question.is_deleted == False,
            Question.is_active == True
        ).count()
        if question_count == 0:
            errors.append("Exam must have at least one question before publishing")

        # 2. Must have valid duration
        if not exam.duration_minutes or exam.duration_minutes <= 0:
            errors.append("Exam must have a valid duration (greater than 0 minutes)")

        # 3. Must have valid marks
        if not exam.total_marks or exam.total_marks <= 0:
            errors.append("Exam must have valid total marks")

        # 4. Passing marks must be valid
        if exam.passing_marks < 0:
            errors.append("Passing marks cannot be negative")
        if exam.passing_marks > exam.total_marks:
            errors.append("Passing marks cannot exceed total marks")

        # 5. Must have a schedule (start_time and end_time)
        if not exam.start_time:
            errors.append("Exam must have a scheduled start time before publishing")
        if not exam.end_time:
            errors.append("Exam must have a scheduled end time before publishing")
        if exam.start_time and exam.end_time and exam.end_time <= exam.start_time:
            errors.append("End time must be strictly after start time")

        # 6. Must have title and subject
        if not exam.title or not exam.title.strip():
            errors.append("Exam must have a valid title")
        if not exam.subject or not exam.subject.strip():
            errors.append("Exam must have a subject specified")

        if errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"message": "Cannot publish exam", "errors": errors}
            )

        exam.status = ExamStatus.ACTIVE
        self.db.commit()
        self.db.refresh(exam)
        logger.info(f"Exam {exam.id} published by {user_id}")
        return exam

    def schedule_exam(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to schedule this exam")

        exam.status = ExamStatus.SCHEDULED
        self.db.commit()
        self.db.refresh(exam)
        logger.info(f"Exam {exam.id} scheduled")
        return exam

    def archive_exam(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        exam.status = ExamStatus.ARCHIVED
        self.db.commit()
        self.db.refresh(exam)
        return exam

    def list_exams(self, skip: int = 0, limit: int = 100) -> tuple[List[Exam], int]:
        query = self.db.query(Exam).filter(Exam.is_deleted == False)
        total = query.count()
        exams = query.order_by(Exam.created_at.desc()).offset(skip).limit(limit).all()
        return exams, total

    def list_exams_for_faculty(self, faculty_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[Exam], int]:
        query = self.db.query(Exam).filter(Exam.is_deleted == False, Exam.created_by == faculty_id)
        total = query.count()
        exams = query.order_by(Exam.created_at.desc()).offset(skip).limit(limit).all()
        return exams, total

    def list_exams_for_student(self, student_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[Exam], int]:
        """Students only see ACTIVE or SCHEDULED published exams they are assigned to."""
        from app.models.exam_attempt import ExamAttempt
        
        query = self.db.query(Exam, ExamAttempt).join(
            ExamAssignment, Exam.id == ExamAssignment.exam_id
        ).outerjoin(
            ExamAttempt,
            (ExamAttempt.exam_id == Exam.id) & (ExamAttempt.student_id == student_id) & (ExamAttempt.is_deleted == False)
        ).filter(
            Exam.is_deleted == False,
            Exam.status.in_([ExamStatus.ACTIVE, ExamStatus.SCHEDULED]),
            ExamAssignment.student_id == student_id,
            ExamAssignment.is_deleted == False
        )
        total = query.count()
        results = query.order_by(Exam.start_time.asc()).offset(skip).limit(limit).all()
        
        exams = []
        for exam, attempt in results:
            exam_data = {c.name: getattr(exam, c.name) for c in exam.__table__.columns}
            exam_data["student_attempt_status"] = attempt.status.value if attempt else None
            exam_data["student_attempt_id"] = attempt.id if attempt else None
            exams.append(exam_data)
            
        return exams, total

    def assign_students_to_exam(self, exam_id: uuid.UUID, student_ids: List[uuid.UUID], faculty_id: uuid.UUID, role: UserRole) -> List[ExamAssignment]:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        assignments = []
        for s_id in student_ids:
            # Check for ANY existing assignment (including soft-deleted ones)
            existing = self.db.query(ExamAssignment).filter(
                ExamAssignment.exam_id == exam_id,
                ExamAssignment.student_id == s_id
            ).first()
            
            if existing:
                if existing.is_deleted:
                    existing.is_deleted = False
                    assignments.append(existing)
            else:
                new_assignment = ExamAssignment(exam_id=exam_id, student_id=s_id)
                self.db.add(new_assignment)
                assignments.append(new_assignment)

        try:
            self.db.commit()
            for a in assignments:
                self.db.refresh(a)
            logger.info(f"Assigned {len(assignments)} students to exam {exam_id}")
            return assignments
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database error assigning students")

    def remove_student_from_exam(self, exam_id: uuid.UUID, student_id: uuid.UUID, faculty_id: uuid.UUID, role: UserRole) -> None:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        assignment = self.db.query(ExamAssignment).filter(
            ExamAssignment.exam_id == exam_id,
            ExamAssignment.student_id == student_id,
            ExamAssignment.is_deleted == False
        ).first()

        if not assignment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

        assignment.is_deleted = True
        self.db.commit()
        logger.info(f"Student {student_id} removed from exam {exam_id}")

    def get_assignments_for_exam(self, exam_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[ExamAssignment], int]:
        self.get_exam_by_id(exam_id)
        query = self.db.query(ExamAssignment).filter(
            ExamAssignment.exam_id == exam_id,
            ExamAssignment.is_deleted == False
        )
        total = query.count()
        return query.offset(skip).limit(limit).all(), total

    def get_students_for_exam(self, exam_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Return all students with their assignment status for the given exam."""
        self.get_exam_by_id(exam_id)

        # Get all student users with profiles
        students = (
            self.db.query(User, StudentProfile)
            .outerjoin(StudentProfile, User.id == StudentProfile.user_id)
            .filter(User.role == "student", User.is_deleted == False, User.is_active == True)
            .all()
        )

        # Get assigned student IDs for this exam
        assigned_ids = set(
            row.student_id for row in self.db.query(ExamAssignment).filter(
                ExamAssignment.exam_id == exam_id,
                ExamAssignment.is_deleted == False
            ).all()
        )

        result = []
        for user, profile in students:
            result.append({
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "enrollment_number": profile.enrollment_number if profile else None,
                "branch": profile.branch.value if profile and profile.branch else None,
                "semester": profile.semester.value if profile and profile.semester else None,
                "is_assigned": user.id in assigned_ids,
            })

        return result

    def get_faculty_stats(self, faculty_id: uuid.UUID) -> Dict[str, Any]:
        """Live dashboard statistics for a faculty member."""
        base_filter = [Exam.is_deleted == False, Exam.created_by == faculty_id]

        total_exams = self.db.query(func.count(Exam.id)).filter(*base_filter).scalar() or 0
        draft_exams = self.db.query(func.count(Exam.id)).filter(*base_filter, Exam.status == ExamStatus.DRAFT).scalar() or 0
        active_exams = self.db.query(func.count(Exam.id)).filter(*base_filter, Exam.status == ExamStatus.ACTIVE).scalar() or 0
        scheduled_exams = self.db.query(func.count(Exam.id)).filter(*base_filter, Exam.status == ExamStatus.SCHEDULED).scalar() or 0
        completed_exams = self.db.query(func.count(Exam.id)).filter(*base_filter, Exam.status == ExamStatus.COMPLETED).scalar() or 0

        # Questions across all faculty exams
        exam_ids_subquery = self.db.query(Exam.id).filter(*base_filter).subquery()
        total_questions = self.db.query(func.count(Question.id)).filter(
            Question.exam_id.in_(exam_ids_subquery),
            Question.is_deleted == False
        ).scalar() or 0

        # Students assigned across all faculty exams
        students_assigned = self.db.query(func.count(ExamAssignment.id)).filter(
            ExamAssignment.exam_id.in_(exam_ids_subquery),
            ExamAssignment.is_deleted == False
        ).scalar() or 0

        # Completed attempts
        completed_attempts = self.db.query(func.count(ExamAttempt.id)).filter(
            ExamAttempt.exam_id.in_(exam_ids_subquery),
            ExamAttempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]),
            ExamAttempt.is_deleted == False
        ).scalar() or 0

        return {
            "total_exams": total_exams,
            "draft_exams": draft_exams,
            "active_exams": active_exams,
            "scheduled_exams": scheduled_exams,
            "completed_exams": completed_exams,
            "total_questions": total_questions,
            "students_assigned": students_assigned,
            "completed_attempts": completed_attempts,
        }
