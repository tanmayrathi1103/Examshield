from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.models.user import User
from app.models.exam import Exam
from app.models.exam_attempt import ExamAttempt
from app.models.attempt_event import AttemptEvent
from app.core.enums import UserRole, AttemptEventType
from app.schemas.admin import AdminStatsResponse, AdminViolationItem, AdminActivityItem

VIOLATION_EVENT_TYPES = {
    AttemptEventType.PHONE_DETECTED,
    AttemptEventType.MULTIPLE_FACES,
    AttemptEventType.NO_FACE,
    AttemptEventType.LOOKING_AWAY,
    AttemptEventType.TAB_SWITCH,
    AttemptEventType.VOICE_DETECTED,
    AttemptEventType.FULLSCREEN_EXIT,
    AttemptEventType.FACE_MISMATCH,
    AttemptEventType.CAMERA_DISABLED,
    AttemptEventType.CAMERA_ERROR,
}

EVENT_TYPE_FRIENDLY_MAP = {
    AttemptEventType.PHONE_DETECTED: ("Phone Detected", "high"),
    AttemptEventType.MULTIPLE_FACES: ("Multiple Faces", "high"),
    AttemptEventType.NO_FACE: ("Face Missing", "medium"),
    AttemptEventType.LOOKING_AWAY: ("Eye Deviation", "low"),
    AttemptEventType.TAB_SWITCH: ("Tab Switched", "high"),
    AttemptEventType.VOICE_DETECTED: ("Voice Detected", "medium"),
    AttemptEventType.FULLSCREEN_EXIT: ("Fullscreen Exit", "medium"),
    AttemptEventType.FACE_MISMATCH: ("Face Mismatch", "high"),
    AttemptEventType.CAMERA_DISABLED: ("Camera Disabled", "high"),
    AttemptEventType.CAMERA_ERROR: ("Camera Error", "medium"),
}

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_admin_stats(self) -> AdminStatsResponse:
        total_students = self.db.query(User).filter(User.role == UserRole.STUDENT, User.is_deleted == False).count()
        total_faculty = self.db.query(User).filter(User.role == UserRole.FACULTY, User.is_deleted == False).count()
        total_exams = self.db.query(Exam).filter(Exam.is_deleted == False).count()
        total_attempts = self.db.query(ExamAttempt).count()

        # Count total violations in database
        total_violations = (
            self.db.query(AttemptEvent)
            .filter(AttemptEvent.event_type.in_(VIOLATION_EVENT_TYPES))
            .count()
        )

        # Count per violation type
        violation_events = (
            self.db.query(AttemptEvent.event_type)
            .filter(AttemptEvent.event_type.in_(VIOLATION_EVENT_TYPES))
            .all()
        )
        
        distribution: Dict[str, int] = {}
        for ev in violation_events:
            friendly_name, _ = EVENT_TYPE_FRIENDLY_MAP.get(ev[0], (ev[0].value, "medium"))
            distribution[friendly_name] = distribution.get(friendly_name, 0) + 1

        # If no recorded violations, provide baseline breakdown
        if not distribution:
            distribution = {
                "Eye Deviation": 0,
                "Phone Detected": 0,
                "Multiple Faces": 0,
                "Tab Switched": 0,
            }

        # Fetch persistent AI sensitivity setting
        from app.models.ai_settings import AISettings
        from app.models.audit_log import AuditLog

        ai_setting = self.db.query(AISettings).first()
        current_sensitivity = f"{ai_setting.sensitivity} Threshold" if ai_setting else "Medium Threshold"

        # Fetch recent audit logs from database
        db_audit_logs = (
            self.db.query(AuditLog)
            .order_by(AuditLog.timestamp.desc())
            .limit(6)
            .all()
        )

        activities: List[AdminActivityItem] = []
        for log in db_audit_logs:
            activities.append(
                AdminActivityItem(
                    id=str(log.id),
                    user=log.user_email,
                    action=log.action,
                    timestamp=log.timestamp,
                    ip=log.ip_address
                )
            )

        # If not enough audit logs, augment with recent attempt events
        if len(activities) < 6:
            recent_events = (
                self.db.query(AttemptEvent)
                .options(
                    joinedload(AttemptEvent.attempt).joinedload(ExamAttempt.student),
                    joinedload(AttemptEvent.attempt).joinedload(ExamAttempt.exam)
                )
                .order_by(AttemptEvent.timestamp.desc())
                .limit(6 - len(activities))
                .all()
            )
            for ev in recent_events:
                student_name = ev.attempt.student.full_name if ev.attempt and ev.attempt.student else "Student"
                exam_name = ev.attempt.exam.title if ev.attempt and ev.attempt.exam else "Exam"
                friendly_name, _ = EVENT_TYPE_FRIENDLY_MAP.get(ev.event_type, (ev.event_type.value, "medium"))

                action_desc = f"{friendly_name} recorded for {student_name} in {exam_name}"
                activities.append(
                    AdminActivityItem(
                        id=str(ev.id),
                        user=ev.attempt.student.email if ev.attempt and ev.attempt.student else "system@examshield.ai",
                        action=action_desc,
                        timestamp=ev.timestamp or datetime.now(timezone.utc),
                        ip="192.168.1.1"
                    )
                )

        if not activities:
            activities = [
                AdminActivityItem(
                    id="init_1",
                    user="admin@examshield.ai",
                    action="AI Proctoring Engine Initialized",
                    timestamp=datetime.now(timezone.utc),
                    ip="127.0.0.1"
                )
            ]

        return AdminStatsResponse(
            total_students=total_students,
            total_faculty=total_faculty,
            total_exams=total_exams,
            total_attempts=total_attempts,
            total_violations=total_violations,
            violation_distribution=distribution,
            ai_sensitivity=current_sensitivity,
            recent_activity=activities
        )

    def get_all_violations(self, filter_type: Optional[str] = None) -> List[AdminViolationItem]:
        query = (
            self.db.query(AttemptEvent)
            .options(
                joinedload(AttemptEvent.attempt).joinedload(ExamAttempt.student),
                joinedload(AttemptEvent.attempt).joinedload(ExamAttempt.exam)
            )
            .filter(AttemptEvent.event_type.in_(VIOLATION_EVENT_TYPES))
            .order_by(AttemptEvent.timestamp.desc())
        )

        events = query.all()
        results: List[AdminViolationItem] = []

        for ev in events:
            friendly_name, severity = EVENT_TYPE_FRIENDLY_MAP.get(ev.event_type, (ev.event_type.value, "medium"))
            
            if filter_type and filter_type.lower() != "all":
                if friendly_name.lower() != filter_type.lower() and ev.event_type.value.lower() != filter_type.lower():
                    continue

            student_name = ev.attempt.student.full_name if ev.attempt and ev.attempt.student else "Unknown Student"
            student_email = ev.attempt.student.email if ev.attempt and ev.attempt.student else ""
            exam_title = ev.attempt.exam.title if ev.attempt and ev.attempt.exam else "General Exam"

            resolved = False
            if ev.event_data and isinstance(ev.event_data, dict):
                resolved = ev.event_data.get("resolved", False)

            results.append(
                AdminViolationItem(
                    id=ev.id,
                    attempt_id=ev.attempt_id,
                    student_name=student_name,
                    student_email=student_email,
                    exam_title=exam_title,
                    timestamp=ev.timestamp or datetime.now(timezone.utc),
                    type=friendly_name,
                    raw_event_type=ev.event_type.value,
                    severity=severity,
                    resolved=resolved,
                    details=ev.event_data
                )
            )

        return results

    def resolve_violation(self, event_id: uuid.UUID) -> bool:
        event = self.db.query(AttemptEvent).filter(AttemptEvent.id == event_id).first()
        if not event:
            raise ValueError(f"Violation event {event_id} not found")

        current_data = dict(event.event_data) if event.event_data else {}
        current_data["resolved"] = True
        current_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
        event.event_data = current_data
        self.db.add(event)
        self.db.commit()
        return True
