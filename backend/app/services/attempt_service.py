from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

from app.models.exam_attempt import ExamAttempt
from app.models.student_answer import StudentAnswer
from app.models.exam_assignment import ExamAssignment
from app.models.exam import Exam
from app.models.question import Question, QuestionOption
from app.models.attempt_event import AttemptEvent
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.core.enums import AttemptStatus, AssignmentStatus, AttemptEventType, QuestionType, ExamStatus
from app.schemas.attempt import StudentAnswerUpdate, ExamAttemptSummary, StudentExamHistoryItem
from app.schemas.live_monitoring import (
    LiveExamMonitoringResponse,
    LiveStudentSessionResponse,
    LiveViolationEvent
)
from app.core.websocket_manager import ws_manager


class AttemptService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_attempt(self, student_id: uuid.UUID, exam_id: uuid.UUID, is_verification_step: bool = False) -> ExamAttempt:
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
            if not is_verification_step and not existing_attempt.face_verified:
                raise ValueError("FACE_VERIFICATION_REQUIRED")

            # Resume logic
            if existing_attempt.status in [AttemptStatus.NOT_STARTED, AttemptStatus.IN_PROGRESS, AttemptStatus.PAUSED]:
                if existing_attempt.expires_at and datetime.now(timezone.utc) >= existing_attempt.expires_at:
                    return self.auto_submit_attempt(existing_attempt.id)

                if existing_attempt.status == AttemptStatus.NOT_STARTED and not is_verification_step:
                    now = datetime.now(timezone.utc)
                    existing_attempt.status = AttemptStatus.IN_PROGRESS
                    existing_attempt.started_at = now
                    exam = self.db.get(Exam, existing_attempt.exam_id)
                    if exam and exam.duration_minutes:
                        expires_at = now + timedelta(minutes=exam.duration_minutes)
                        if exam.end_time:
                            end_time = exam.end_time
                            if end_time.tzinfo is None:
                                end_time = end_time.replace(tzinfo=timezone.utc)
                            if expires_at > end_time:
                                expires_at = end_time
                        existing_attempt.expires_at = expires_at

                    event = AttemptEvent(
                        attempt_id=existing_attempt.id,
                        event_type=AttemptEventType.STARTED,
                        event_data={"started_at": now.isoformat()}
                    )
                    self.db.add(event)
                elif existing_attempt.status != AttemptStatus.IN_PROGRESS:
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

        # Create new attempt in NOT_STARTED state
        attempt = ExamAttempt(
            student_id=student_id,
            exam_id=exam_id,
            assignment_id=assignment.id,
            status=AttemptStatus.NOT_STARTED,
            started_at=None,
            expires_at=None,
            total_questions=total_q,
            answered_questions=0,
            face_verified=False
        )
        self.db.add(attempt)
        self.db.flush()  # get attempt.id

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
        
        if not is_verification_step:
            raise ValueError("FACE_VERIFICATION_REQUIRED")

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

    def log_event(self, attempt_id: uuid.UUID, student_id: uuid.UUID, event_type: Any, event_data: dict) -> AttemptEvent:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt.student_id != student_id:
            raise ValueError("Unauthorized attempt access")
        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise ValueError(f"Cannot log events for attempt in {attempt.status} state")

        if isinstance(event_type, str):
            lowered = event_type.lower()
            if "tab" in lowered or "copy" in lowered or "context" in lowered or "click" in lowered:
                event_type_enum = AttemptEventType.TAB_SWITCH
            elif "fullscreen" in lowered:
                event_type_enum = AttemptEventType.FULLSCREEN_EXIT
            elif "deviation" in lowered or "gaze" in lowered or "look" in lowered:
                event_type_enum = AttemptEventType.LOOKING_AWAY
            elif "phone" in lowered or "mobile" in lowered:
                event_type_enum = AttemptEventType.PHONE_DETECTED
            elif "mismatch" in lowered:
                event_type_enum = AttemptEventType.FACE_MISMATCH
            elif "multi" in lowered:
                event_type_enum = AttemptEventType.MULTIPLE_FACES
            elif "no_face" in lowered or "missing" in lowered:
                event_type_enum = AttemptEventType.NO_FACE
            elif "voice" in lowered or "audio" in lowered or "sound" in lowered:
                event_type_enum = AttemptEventType.VOICE_DETECTED
            elif "disconnect" in lowered or "disabled" in lowered:
                event_type_enum = AttemptEventType.CAMERA_DISABLED
            elif "error" in lowered:
                event_type_enum = AttemptEventType.CAMERA_ERROR
            else:
                try:
                    event_type_enum = AttemptEventType(lowered)
                except ValueError:
                    event_type_enum = AttemptEventType.LOOKING_AWAY
        else:
            if isinstance(event_type, AttemptEventType):
                event_type_enum = event_type
            else:
                try:
                    event_type_enum = AttemptEventType(str(event_type).lower())
                except Exception:
                    event_type_enum = AttemptEventType.LOOKING_AWAY

        event = AttemptEvent(
            attempt_id=attempt_id,
            event_type=event_type_enum,
            event_data=event_data,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        # Query updated total violation count directly from DB
        current_violation_count = self.db.scalar(
            select(func.count(AttemptEvent.id)).where(
                and_(
                    AttemptEvent.attempt_id == attempt.id,
                    AttemptEvent.event_type.notin_([
                        AttemptEventType.STARTED,
                        AttemptEventType.RESUMED,
                        AttemptEventType.SUBMITTED,
                        AttemptEventType.AUTO_SUBMITTED,
                        AttemptEventType.PROCTORING_STARTED
                    ])
                )
            )
        ) or 0

        # Update attempt risk score dynamically
        attempt.risk_score = float(min(100.0, current_violation_count * 10.0))
        self.db.commit()

        # Broadcast real-time violation event to observing proctors
        try:
            severity = event_data.get("severity", "MEDIUM") if isinstance(event_data, dict) else "MEDIUM"
            student = attempt.student or self.db.get(User, student_id)
            student_name = student.full_name if student else "Student"
            profile = getattr(student, "student_profile", None) if student else None
            roll_no = profile.enrollment_number if profile else None

            ws_manager.dispatch_broadcast_to_proctors(str(attempt.exam_id), {
                "type": "VIOLATION_EVENT",
                "attempt_id": str(attempt.id),
                "student_id": str(student_id),
                "student_name": student_name,
                "roll_no": roll_no,
                "event_type": event_type_enum.value if hasattr(event_type_enum, "value") else str(event_type_enum),
                "severity": severity,
                "violations_count": current_violation_count,
                "timestamp": event.timestamp.isoformat(),
                "event_data": event_data
            })
        except Exception as ws_err:
            logger.warning(f"Failed to dispatch WebSocket proctor broadcast: {ws_err}")

        return event

    def get_attempt_summary(self, attempt_id: uuid.UUID) -> ExamAttemptSummary:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt:
            raise ValueError("Attempt not found")

        return ExamAttemptSummary(
            id=attempt.id,
            exam_id=attempt.exam_id,
            status=attempt.status,
            score=attempt.score,
            percentage=attempt.percentage,
            total_questions=attempt.total_questions,
            answered_questions=attempt.answered_questions,
            submitted_at=attempt.submitted_at,
            risk_score=attempt.risk_score
        )

    def get_student_exam_history(self, student_id: uuid.UUID) -> List[StudentExamHistoryItem]:
        attempts = self.db.scalars(
            select(ExamAttempt).where(
                and_(
                    ExamAttempt.student_id == student_id,
                    ExamAttempt.is_deleted == False
                )
            ).order_by(ExamAttempt.created_at.desc())
        ).all()

        history = []
        for attempt in attempts:
            exam = attempt.exam
            if not exam:
                exam = self.db.get(Exam, attempt.exam_id)
            if not exam:
                continue

            total_marks = float(exam.total_marks or 0.0)
            passing_marks = float(exam.passing_marks or 0.0)
            
            if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]:
                if attempt.score is not None:
                    result = "PASS" if attempt.score >= passing_marks else "FAIL"
                else:
                    result = "UNDER_REVIEW"
            else:
                result = "PENDING"

            violations_count = len(attempt.events) if attempt.events else 0
            
            if attempt.risk_score is not None:
                integrity_score = max(0.0, min(100.0, 100.0 - float(attempt.risk_score)))
            else:
                deduction = violations_count * 10.0
                integrity_score = max(20.0, 100.0 - deduction)

            q_count = attempt.total_questions
            if not q_count and exam.questions:
                q_count = len([q for q in exam.questions if not q.is_deleted])

            history.append(StudentExamHistoryItem(
                attempt_id=attempt.id,
                exam_id=exam.id,
                title=exam.title,
                exam_code=exam.exam_code,
                subject=exam.subject,
                duration_minutes=exam.duration_minutes,
                status=attempt.status,
                started_at=attempt.started_at,
                submitted_at=attempt.submitted_at,
                score=attempt.score,
                total_marks=total_marks,
                passing_marks=passing_marks,
                percentage=attempt.percentage,
                result=result,
                integrity_score=round(integrity_score, 1),
                violations_count=violations_count,
                total_questions=q_count or 0,
                answered_questions=attempt.answered_questions or 0
            ))

        return history

    def get_live_monitoring_sessions(self, exam_id: uuid.UUID) -> LiveExamMonitoringResponse:
        exam = self.db.get(Exam, exam_id)
        if not exam:
            raise ValueError("Exam not found")

        # Fetch all attempts for this exam with student and profile
        attempts = self.db.execute(
            select(ExamAttempt, User, StudentProfile)
            .join(User, ExamAttempt.student_id == User.id)
            .outerjoin(StudentProfile, User.id == StudentProfile.user_id)
            .where(
                and_(
                    ExamAttempt.exam_id == exam_id,
                    ExamAttempt.is_deleted == False
                )
            )
            .order_by(ExamAttempt.started_at.desc().nullslast())
        ).all()

        sessions = []
        active_count = 0

        for attempt, user, profile in attempts:
            if attempt.status in [AttemptStatus.IN_PROGRESS, AttemptStatus.PAUSED]:
                active_count += 1

            # Fetch recent events
            events = self.db.scalars(
                select(AttemptEvent)
                .where(AttemptEvent.attempt_id == attempt.id)
                .order_by(AttemptEvent.timestamp.desc())
                .limit(15)
            ).all()

            violation_events = []
            for ev in events:
                severity = "medium"
                ev_data = ev.event_data or {}
                if isinstance(ev_data, dict):
                    severity = ev_data.get("severity", "medium").lower()

                ev_type_val = ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type)
                ev_type_upper = ev_type_val.upper()
                if any(k in ev_type_upper for k in ["PHONE", "MULTIPLE", "MISMATCH", "CAMERA_ERROR"]):
                    severity = "high"

                violation_events.append(LiveViolationEvent(
                    id=ev.id,
                    event_type=ev_type_val,
                    severity=severity,
                    timestamp=ev.timestamp,
                    event_data=ev_data
                ))

            # Total non-lifecycle violations count directly from DB
            all_violations_count = self.db.scalar(
                select(func.count(AttemptEvent.id)).where(
                    and_(
                        AttemptEvent.attempt_id == attempt.id,
                        AttemptEvent.event_type.notin_([
                            AttemptEventType.STARTED,
                            AttemptEventType.RESUMED,
                            AttemptEventType.SUBMITTED,
                            AttemptEventType.AUTO_SUBMITTED,
                            AttemptEventType.PROCTORING_STARTED
                        ])
                    )
                )
            ) or 0

            # Integrity score calculation
            if attempt.risk_score is not None:
                integrity = max(0.0, min(100.0, 100.0 - float(attempt.risk_score)))
            else:
                integrity = max(20.0, 100.0 - (all_violations_count * 10.0))

            q_total = attempt.total_questions
            if not q_total and exam.questions:
                q_total = len([q for q in exam.questions if not q.is_deleted])

            sessions.append(LiveStudentSessionResponse(
                attempt_id=attempt.id,
                student_id=user.id,
                student_name=user.full_name,
                roll_no=profile.enrollment_number if profile else None,
                department=profile.branch.value if profile and profile.branch else None,
                status=attempt.status,
                started_at=attempt.started_at,
                submitted_at=attempt.submitted_at,
                integrity_score=round(integrity, 1),
                answered_questions=attempt.answered_questions or 0,
                total_questions=q_total or 0,
                violations_count=all_violations_count,
                recent_events=violation_events
            ))

        return LiveExamMonitoringResponse(
            exam_id=exam.id,
            exam_title=exam.title,
            exam_code=exam.exam_code,
            active_count=active_count,
            sessions=sessions
        )

    def toggle_suspend_attempt(self, attempt_id: uuid.UUID) -> ExamAttempt:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]:
            raise ValueError(f"Cannot suspend attempt that is already {attempt.status.value}")

        if attempt.status == AttemptStatus.PAUSED:
            attempt.status = AttemptStatus.IN_PROGRESS
            ev_type = AttemptEventType.RESUMED
            action = "resumed_by_proctor"
        else:
            attempt.status = AttemptStatus.PAUSED
            ev_type = AttemptEventType.PAUSED
            action = "suspended_by_proctor"

        event = AttemptEvent(
            attempt_id=attempt.id,
            event_type=ev_type,
            event_data={"action": action, "severity": "HIGH", "timestamp": datetime.now(timezone.utc).isoformat()}
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(attempt)

        # Broadcast instant status to student channel and proctors
        try:
            ws_manager.dispatch_send_to_student(str(attempt.exam_id), str(attempt.id), {
                "type": "STATUS_CHANGED",
                "status": attempt.status.value,
                "message": f"Your exam attempt has been {attempt.status.value} by the proctor."
            })
            ws_manager.dispatch_broadcast_to_proctors(str(attempt.exam_id), {
                "type": "SESSION_UPDATED",
                "attempt_id": str(attempt.id),
                "status": attempt.status.value
            })
        except Exception as ws_err:
            logger.warning(f"Failed to dispatch status update via WebSocket: {ws_err}")

        return attempt

    def force_submit_attempt(self, attempt_id: uuid.UUID) -> ExamAttempt:
        attempt = self.db.get(ExamAttempt, attempt_id)
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]:
            return attempt

        # Finalize as auto submitted
        submitted_attempt = self._submit_attempt(attempt_id, auto=True)
        event = AttemptEvent(
            attempt_id=attempt_id,
            event_type=AttemptEventType.AUTO_SUBMITTED,
            event_data={"action": "force_submitted_by_proctor", "severity": "HIGH", "timestamp": datetime.now(timezone.utc).isoformat()}
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(submitted_attempt)

        # Broadcast instant force submission to student channel and proctors
        try:
            ws_manager.dispatch_send_to_student(str(submitted_attempt.exam_id), str(submitted_attempt.id), {
                "type": "FORCE_SUBMITTED",
                "status": submitted_attempt.status.value,
                "message": "Your exam attempt has been force-submitted by the proctor."
            })
            ws_manager.dispatch_broadcast_to_proctors(str(submitted_attempt.exam_id), {
                "type": "SESSION_UPDATED",
                "attempt_id": str(submitted_attempt.id),
                "status": submitted_attempt.status.value
            })
        except Exception as ws_err:
            logger.warning(f"Failed to dispatch force submit via WebSocket: {ws_err}")

        return submitted_attempt


