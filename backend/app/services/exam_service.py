import uuid
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional

from app.models.exam import Exam
from app.models.exam_assignment import ExamAssignment
from app.schemas.exam import ExamCreate, ExamUpdate, ExamAssignmentCreate
from app.core.enums import ExamStatus, AssignmentStatus, UserRole

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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam code already exists")

    def update_exam(self, exam_id: uuid.UUID, exam_in: ExamUpdate, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.get_exam_by_id(exam_id)
        
        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this exam")
            
        update_data = exam_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(exam, field, value)
            
        # Re-validate marks and dates
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
            
        exam.is_deleted = True
        self.db.commit()
        logger.info(f"Exam {exam.id} logically deleted by {user_id}")

    def publish_exam(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to publish this exam")
            
        exam.status = ExamStatus.ACTIVE
        self.db.commit()
        self.db.refresh(exam)
        logger.info(f"Exam {exam.id} published")
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
        exams = query.offset(skip).limit(limit).all()
        return exams, total

    def list_exams_for_faculty(self, faculty_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[Exam], int]:
        query = self.db.query(Exam).filter(Exam.is_deleted == False, Exam.created_by == faculty_id)
        total = query.count()
        exams = query.offset(skip).limit(limit).all()
        return exams, total

    def list_exams_for_student(self, student_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[Exam], int]:
        query = self.db.query(Exam).join(ExamAssignment).filter(
            Exam.is_deleted == False, 
            ExamAssignment.student_id == student_id,
            ExamAssignment.is_deleted == False
        )
        total = query.count()
        exams = query.offset(skip).limit(limit).all()
        return exams, total

    def assign_students_to_exam(self, exam_id: uuid.UUID, student_ids: List[uuid.UUID], faculty_id: uuid.UUID, role: UserRole) -> List[ExamAssignment]:
        exam = self.get_exam_by_id(exam_id)
        if role != UserRole.ADMIN and exam.created_by != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
            
        assignments = []
        for s_id in student_ids:
            existing = self.db.query(ExamAssignment).filter(
                ExamAssignment.exam_id == exam_id, 
                ExamAssignment.student_id == s_id,
                ExamAssignment.is_deleted == False
            ).first()
            if not existing:
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

    def get_assignments_for_exam(self, exam_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[ExamAssignment], int]:
        # Validate exam exists
        self.get_exam_by_id(exam_id)
        query = self.db.query(ExamAssignment).filter(ExamAssignment.exam_id == exam_id, ExamAssignment.is_deleted == False)
        total = query.count()
        return query.offset(skip).limit(limit).all(), total

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
