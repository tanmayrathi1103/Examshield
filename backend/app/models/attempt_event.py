from sqlalchemy import ForeignKey, String, Enum as SQLAlchemyEnum, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid

from app.models.base import Base
from app.core.enums import AttemptEventType

class AttemptEvent(Base):
    __tablename__ = "attempt_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    attempt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exam_attempts.id"), nullable=False, index=True)
    
    event_type: Mapped[AttemptEventType] = mapped_column(SQLAlchemyEnum(AttemptEventType), nullable=False)
    event_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="events")
