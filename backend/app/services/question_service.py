import uuid
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List

from app.models.exam import Exam
from app.models.question import Question, QuestionOption
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionOptionCreate, BulkQuestionCreate, QuestionReorderRequest
from app.core.enums import QuestionType, UserRole

logger = logging.getLogger(__name__)


class QuestionService:
    def __init__(self, db: Session):
        self.db = db

    def _verify_exam_access(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> Exam:
        exam = self.db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

        if role == UserRole.STUDENT:
            from app.models.exam_assignment import ExamAssignment
            assignment = self.db.query(ExamAssignment).filter(
                ExamAssignment.exam_id == exam_id,
                ExamAssignment.student_id == user_id,
                ExamAssignment.is_deleted == False
            ).first()
            if not assignment:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this exam")
            from app.core.enums import ExamStatus
            if exam.status not in [ExamStatus.ACTIVE, ExamStatus.SCHEDULED]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Exam is not active")
        elif role != UserRole.ADMIN and exam.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage questions for this exam")
        return exam

    def get_question_by_id(self, question_id: uuid.UUID) -> Question:
        question = self.db.query(Question).filter(Question.id == question_id, Question.is_deleted == False).first()
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        return question

    def _next_order_number(self, exam_id: uuid.UUID) -> int:
        """Auto-calculate the next available order number for an exam."""
        max_order = self.db.query(func.max(Question.order_number)).filter(
            Question.exam_id == exam_id,
            Question.is_deleted == False
        ).scalar()
        return (max_order or 0) + 1

    def _generate_true_false_options(self, question_id: uuid.UUID, correct_answer: bool) -> List[QuestionOption]:
        return [
            QuestionOption(question_id=question_id, option_label="A", option_text="True", is_correct=(correct_answer is True), display_order=1),
            QuestionOption(question_id=question_id, option_label="B", option_text="False", is_correct=(correct_answer is False), display_order=2)
        ]

    def create_question(self, question_in: QuestionCreate, user_id: uuid.UUID, role: UserRole) -> Question:
        self._verify_exam_access(question_in.exam_id, user_id, role)

        try:
            # Always auto-assign order_number (ignore whatever client sends)
            next_order = self._next_order_number(question_in.exam_id)

            db_question = Question(
                exam_id=question_in.exam_id,
                question_text=question_in.question_text,
                question_type=question_in.question_type,
                marks=question_in.marks,
                negative_marks=question_in.negative_marks,
                difficulty=question_in.difficulty,
                image_url=question_in.image_url,
                explanation=question_in.explanation,
                order_number=next_order,
                is_required=question_in.is_required,
                is_active=question_in.is_active
            )
            self.db.add(db_question)
            self.db.flush()

            if question_in.question_type == QuestionType.MCQ and question_in.options:
                labels = set()
                for opt in question_in.options:
                    if opt.option_label:
                        if opt.option_label in labels:
                            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate option labels")
                        labels.add(opt.option_label)

                    db_option = QuestionOption(
                        question_id=db_question.id,
                        option_label=opt.option_label,
                        option_text=opt.option_text,
                        is_correct=opt.is_correct,
                        display_order=opt.display_order
                    )
                    self.db.add(db_option)

            elif question_in.question_type == QuestionType.TRUE_FALSE:
                tf_options = self._generate_true_false_options(db_question.id, question_in.correct_answer)
                self.db.add_all(tf_options)

            self.db.commit()
            self.db.refresh(db_question)
            logger.info(f"Question {db_question.id} created for exam {db_question.exam_id} by user {user_id}")
            return db_question
        except HTTPException:
            self.db.rollback()
            raise
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error")

    def update_question(self, question_id: uuid.UUID, question_in: QuestionUpdate, user_id: uuid.UUID, role: UserRole) -> Question:
        question = self.get_question_by_id(question_id)
        self._verify_exam_access(question.exam_id, user_id, role)

        update_data = question_in.model_dump(exclude_unset=True, exclude={"options", "correct_answer"})

        for field, value in update_data.items():
            setattr(question, field, value)

        # Re-validate options if question_type changed or options provided
        if 'question_type' in update_data or question_in.options is not None or question_in.correct_answer is not None:
            q_type = question.question_type

            # Delete old options
            self.db.query(QuestionOption).filter(QuestionOption.question_id == question.id).delete()

            if q_type == QuestionType.MCQ:
                if question_in.options:
                    correct_count = sum(1 for opt in question_in.options if opt.is_correct)
                    if correct_count != 1:
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MCQ must have exactly one correct option")

                    labels = set()
                    for opt in question_in.options:
                        if opt.option_label:
                            if opt.option_label in labels:
                                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate option labels")
                            labels.add(opt.option_label)

                        db_option = QuestionOption(
                            question_id=question.id,
                            option_label=opt.option_label,
                            option_text=opt.option_text,
                            is_correct=opt.is_correct,
                            display_order=opt.display_order
                        )
                        self.db.add(db_option)
                else:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MCQ requires options")

            elif q_type == QuestionType.TRUE_FALSE:
                if question_in.correct_answer is None:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="True/False requires correct_answer")
                tf_options = self._generate_true_false_options(question.id, question_in.correct_answer)
                self.db.add_all(tf_options)

        try:
            self.db.commit()
            self.db.refresh(question)
            logger.info(f"Question {question.id} updated by {user_id}")
            return question
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error")

    def delete_question(self, question_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> None:
        question = self.get_question_by_id(question_id)
        self._verify_exam_access(question.exam_id, user_id, role)

        question.is_deleted = True
        self.db.commit()
        logger.info(f"Question {question.id} logically deleted by {user_id}")

    def list_questions_for_exam(self, exam_id: uuid.UUID, user_id: uuid.UUID, role: UserRole, skip: int = 0, limit: int = 100) -> tuple[List[Question], int]:
        self._verify_exam_access(exam_id, user_id, role)

        query = self.db.query(Question).filter(
            Question.exam_id == exam_id,
            Question.is_deleted == False
        ).order_by(Question.order_number)
        total = query.count()
        questions = query.offset(skip).limit(limit).all()
        return questions, total

    def duplicate_question(self, question_id: uuid.UUID, user_id: uuid.UUID, role: UserRole) -> Question:
        original = self.get_question_by_id(question_id)
        self._verify_exam_access(original.exam_id, user_id, role)

        next_order = self._next_order_number(original.exam_id)

        new_question = Question(
            exam_id=original.exam_id,
            question_text=f"{original.question_text} (Copy)",
            question_type=original.question_type,
            marks=original.marks,
            negative_marks=original.negative_marks,
            difficulty=original.difficulty,
            image_url=original.image_url,
            explanation=original.explanation,
            order_number=next_order,
            is_required=original.is_required,
            is_active=original.is_active
        )
        self.db.add(new_question)
        self.db.flush()

        for opt in original.options:
            new_opt = QuestionOption(
                question_id=new_question.id,
                option_label=opt.option_label,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                display_order=opt.display_order
            )
            self.db.add(new_opt)

        self.db.commit()
        self.db.refresh(new_question)
        logger.info(f"Question {original.id} duplicated into {new_question.id} by {user_id}")
        return new_question

    def bulk_create_questions(self, bulk_in: BulkQuestionCreate, user_id: uuid.UUID, role: UserRole):
        self._verify_exam_access(bulk_in.exam_id, user_id, role)

        success_count = 0
        failed_count = 0
        errors = []

        for i, q_in in enumerate(bulk_in.questions):
            try:
                next_order = self._next_order_number(bulk_in.exam_id)
                db_question = Question(
                    exam_id=bulk_in.exam_id,
                    question_text=q_in.question_text,
                    question_type=q_in.question_type,
                    marks=q_in.marks,
                    negative_marks=q_in.negative_marks,
                    difficulty=q_in.difficulty,
                    image_url=q_in.image_url,
                    explanation=q_in.explanation,
                    order_number=next_order,
                    is_required=q_in.is_required,
                    is_active=q_in.is_active
                )
                self.db.add(db_question)
                self.db.flush()

                if q_in.question_type == QuestionType.MCQ and q_in.options:
                    labels = set()
                    for opt in q_in.options:
                        if opt.option_label:
                            if opt.option_label in labels:
                                raise ValueError("Duplicate option labels")
                            labels.add(opt.option_label)

                        db_option = QuestionOption(
                            question_id=db_question.id,
                            option_label=opt.option_label,
                            option_text=opt.option_text,
                            is_correct=opt.is_correct,
                            display_order=opt.display_order
                        )
                        self.db.add(db_option)

                elif q_in.question_type == QuestionType.TRUE_FALSE:
                    tf_options = self._generate_true_false_options(db_question.id, q_in.correct_answer)
                    self.db.add_all(tf_options)

                self.db.commit()
                success_count += 1
            except Exception as e:
                self.db.rollback()
                failed_count += 1
                errors.append(f"Row {i+1}: {str(e)}")

        logger.info(f"Bulk upload for exam {bulk_in.exam_id}: {success_count} success, {failed_count} failed")
        return {
            "total_imported": success_count,
            "total_failed": failed_count,
            "errors": errors
        }

    def reorder_questions(self, exam_id: uuid.UUID, reorder_request: QuestionReorderRequest, user_id: uuid.UUID, role: UserRole) -> None:
        self._verify_exam_access(exam_id, user_id, role)

        try:
            for item in reorder_request.items:
                question = self.db.query(Question).filter(
                    Question.id == item.question_id,
                    Question.exam_id == exam_id,
                    Question.is_deleted == False
                ).first()
                if question:
                    question.order_number = item.order_number

            self.db.commit()
            logger.info(f"Questions reordered for exam {exam_id} by {user_id}")
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error during reorder")
