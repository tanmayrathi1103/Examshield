from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

from app.models.exam_attempt import ExamAttempt
from app.models.student_answer import StudentAnswer
from app.models.exam_assignment import ExamAssignment
from app.models.exam import Exam
from app.models.question import Question, QuestionOption
from app.models.attempt_event import AttemptEvent
from app.core.enums import AttemptStatus, AssignmentStatus, AttemptEventType, QuestionType, ExamStatus
from app.schemas.attempt import StudentAnswerUpdate, ExamAttemptSummary


class AttemptService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_attempt(self, student_id: uuid.UUID, exam_id: uuid.UUID) -> ExamAttempt:
        # Check if attempt already exists
        existing_attempt = self.db.scalars(
            select(ExamAttempt).where(
                and_(
                    ExamAttempt.student_id == student_id,
                    ExamAttempt.exam_id == exam_id,
                    ExamAttempt.is_deleted == False
                )
            )
        ).first()

        if existing_attempt:
            # Resume logic
            if existing_attempt.status in [AttemptStatus.NOT_STARTED, AttemptStatus.IN_PROGRESS, AttemptStatus.PAUSED]:
                if existing_attempt.expires_at and datetime.now(timezone.utc) >= existing_attempt.expires_at:
                    return self.auto_submit_attempt(existing_attempt.id)

                existing_attempt.status = AttemptStatus.IN_PROGRESS

                # Log resume event
                event = AttemptEvent(
                    attempt_id=existing_attempt.id,
                    event_type=AttemptEventType.RESUMED,
                    event_data={"resumed_at": datetime.now(timezone.utc).isoformat()}
                )
                self.db.add(event)
                self.db.commit()
                self.db.refresh(existing_attempt)
                return existing_attempt
            else:
                raise ValueError(f"Exam already {existing_attempt.status.value}")

        # Need to create a new attempt
        assignment = self.db.scalars(
            select(ExamAssignment).where(
                and_(
                    ExamAssignment.student_id == student_id,
                    ExamAssignment.exam_id == exam_id,
                    ExamAssignment.is_deleted == False
                )
            )
        ).first()

        if not assignment:
            raise ValueError("Student is not assigned to this exam")

        exam = self.db.get(Exam, exam_id)
        if not exam:
            raise ValueError("Exam not found")

        # Exam must be published (ACTIVE or SCHEDULED)
        if exam.status not in [ExamStatus.ACTIVE, ExamStatus.SCHEDULED]:
            raise ValueError("Exam is not published yet")

        # Time window logic
        now = datetime.now(timezone.utc)
        if exam.start_time:
            # Make start_time timezone aware if not
            start_time = exam.start_time
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            if now < start_time:
                raise ValueError("Exam window has not opened yet")

        if exam.end_time:
            end_time = exam.end_time
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            if now > end_time:
                raise ValueError("Exam window has closed")

        # Count active questions for this exam (use relationship length)
        active_questions = self.db.scalars(
            select(Question).where(
                and_(
                    Question.exam_id == exam_id,
                    Question.is_deleted == False,
                    Question.is_active == True
                )
            )
        ).all()
        total_q = len(active_questions)

        # Create new attempt
        expires_at = None
        if exam.duration_minutes:
            expires_at = now + timedelta(minutes=exam.duration_minutes)
            if exam.end_time:
                end_time = exam.end_time
                if end_time.tzinfo is None:
                    end_time = end_time.replace(tzinfo=timezone.utc)
                if expires_at > end_time:
                    expires_at = end_time

        attempt = ExamAttempt(
            student_id=student_id,
            exam_id=exam_id,
            assignment_id=assignment.id,
            status=AttemptStatus.IN_PROGRESS,
            started_at=now,
            expires_at=expires_at,
            total_questions=total_q,
            answered_questions=0
        )
        self.db.add(attempt)

        # Log start event
        self.db.flush()  # get attempt.id
        event = AttemptEvent(
            attempt_id=attempt.id,
            event_type=AttemptEventType.STARTED,
            event_data={"started_at": now.isoformat()}
        )
        self.db.add(event)

        # Pre-populate student answers for all active questions
        for q in active_questions:
            ans = StudentAnswer(
                attempt_id=attempt.id,
                question_id=q.id,
                is_answered=False,
                is_marked_for_review=False
            )
            self.db.add(ans)

        assignment.status = AssignmentStatus.STARTED

        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def update_answer(self, attempt_id: uuid.UUID, question_id: uuid.UUID, answer_data: StudentAnswerUpdate) -> StudentAnswer:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt or attempt.status not in [AttemptStatus.IN_PROGRESS, AttemptStatus.PAUSED]:
            raise ValueError("Invalid attempt or exam already submitted")

        if attempt.expires_at:
            expires_at = attempt.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) >= expires_at:
                self.auto_submit_attempt(attempt_id)
                raise ValueError("Exam time has expired")

        answer = self.db.scalars(
            select(StudentAnswer).where(
                and_(
                    StudentAnswer.attempt_id == attempt_id,
                    StudentAnswer.question_id == question_id
                )
            )
        ).first()

        if not answer:
            raise ValueError("Answer record not found")

        was_answered = answer.is_answered

        if answer_data.selected_option is not None:
            answer.selected_option = answer_data.selected_option
            answer.is_answered = True
            answer.descriptive_answer = None
        elif answer_data.descriptive_answer is not None:
            answer.descriptive_answer = answer_data.descriptive_answer
            answer.is_answered = True
            answer.selected_option = None

        if answer_data.is_marked_for_review is not None:
            answer.is_marked_for_review = answer_data.is_marked_for_review

        answer.answered_at = datetime.now(timezone.utc)

        if not was_answered and answer.is_answered:
            attempt.answered_questions += 1

        self.db.commit()
        self.db.refresh(answer)
        return answer

    def auto_submit_attempt(self, attempt_id: uuid.UUID) -> ExamAttempt:
        return self._submit_attempt(attempt_id, auto=True)

    def submit_attempt(self, attempt_id: uuid.UUID) -> ExamAttempt:
        return self._submit_attempt(attempt_id, auto=False)

    def _submit_attempt(self, attempt_id: uuid.UUID, auto: bool) -> ExamAttempt:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt or attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]:
            return attempt  # already submitted

        attempt.status = AttemptStatus.AUTO_SUBMITTED if auto else AttemptStatus.SUBMITTED
        attempt.submitted_at = datetime.now(timezone.utc)

        # Log submit event
        event_type = AttemptEventType.AUTO_SUBMITTED if auto else AttemptEventType.SUBMITTED
        event = AttemptEvent(
            attempt_id=attempt.id,
            event_type=event_type,
            event_data={"submitted_at": attempt.submitted_at.isoformat()}
        )
        self.db.add(event)

        # Evaluate objective questions
        self._evaluate_attempt(attempt)

        # Update assignment status
        if attempt.assignment:
            attempt.assignment.status = AssignmentStatus.SUBMITTED

        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def _evaluate_attempt(self, attempt: ExamAttempt):
        from app.services.evaluation_service import EvaluationService
        # Fetch all questions for this exam
        questions = {
            q.id: q for q in self.db.scalars(
                select(Question).where(
                    and_(Question.exam_id == attempt.exam_id, Question.is_deleted == False)
                )
            ).all()
        }

        score = 0.0

        for answer in attempt.answers:
            q = questions.get(answer.question_id)
            if not q:
                continue

            status, marks = EvaluationService.evaluate_answer(answer, q)
            score += marks

        attempt.score = score
        total_possible = sum(q.marks for q in questions.values())
        if total_possible > 0:
            attempt.percentage = (score / total_possible) * 100
        else:
            attempt.percentage = 0.0

    def get_attempt_summary(self, attempt_id: uuid.UUID) -> ExamAttemptSummary:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt:
            raise ValueError("Attempt not found")

        return ExamAttemptSummary(
            id=attempt.id,
            status=attempt.status,
            score=attempt.score,
            percentage=attempt.percentage,
            total_questions=attempt.total_questions,
            answered_questions=attempt.answered_questions,
            submitted_at=attempt.submitted_at,
            risk_score=attempt.risk_score
        )
