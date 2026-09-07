from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import logging

from app.models.ai_settings import AISettings
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.ai_settings import AISettingsUpdate, AuditLogItem

logger = logging.getLogger(__name__)

class AISettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_settings(self) -> AISettings:
        """Fetch the single global AI settings row, or initialize it with production defaults."""
        settings = self.db.query(AISettings).first()
        if not settings:
            settings = AISettings(
                face_detection=True,
                eye_tracking=True,
                phone_detection=True,
                voice_detection=True,
                multi_face_detection=True,
                tab_lockout=True,
                sensitivity="Medium",
                allowed_violations=3,
                warnings_before_submit=2,
            )
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def update_settings(self, update_data: AISettingsUpdate, user: Optional[User] = None, client_ip: str = "127.0.0.1") -> AISettings:
        """Update AI settings and record an audit log trail entry."""
        settings = self.get_or_create_settings()
        changes = []

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                old_val = getattr(settings, key)
                if old_val != value:
                    setattr(settings, key, value)
                    changes.append(f"{key}: {old_val} -> {value}")

        if user:
            settings.updated_by_id = user.id

        if changes:
            self.db.commit()
            self.db.refresh(settings)

            # Record audit log
            user_email = user.email if user else "admin@examshield.ai"
            user_id = user.id if user else None
            action_summary = f"Updated AI Settings: {', '.join(changes)}"
            self.create_audit_log(
                user_email=user_email,
                action=action_summary,
                ip_address=client_ip,
                user_id=user_id
            )
            logger.info(f"AI Settings updated by {user_email}: {action_summary}")

        return settings

    def create_audit_log(
        self,
        user_email: str,
        action: str,
        ip_address: str = "127.0.0.1",
        user_id: Optional[uuid.UUID] = None
    ) -> AuditLog:
        """Write a new audit log record to the database."""
        audit_entry = AuditLog(
            user_email=user_email,
            action=action,
            ip_address=ip_address,
            user_id=user_id,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(audit_entry)
        self.db.commit()
        self.db.refresh(audit_entry)
        return audit_entry

    def get_audit_logs(self, limit: int = 50) -> List[AuditLogItem]:
        """Retrieve recent audit logs from database ordered chronologically descending."""
        logs = (
            self.db.query(AuditLog)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )
        
        # If no audit logs yet, generate an initial entry
        if not logs:
            initial = self.create_audit_log(
                user_email="system@examshield.ai",
                action="Database audit logging system initialized",
                ip_address="127.0.0.1"
            )
            logs = [initial]

        return [
            AuditLogItem(
                id=str(log.id),
                user=log.user_email,
                action=log.action,
                timestamp=log.timestamp,
                ip=log.ip_address
            )
            for log in logs
        ]
