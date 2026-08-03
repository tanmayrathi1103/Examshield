from sqlalchemy import ForeignKey, String, Boolean, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin

class StudentAnswer(Base, TimestampMixin):
    __tablename__ = "student_answers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    attempt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exam_attempts.id"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id"), nullable=False, index=True)
    
    selected_option: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    descriptive_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    is_marked_for_review: Mapped[bool] = mapped_column(Boolean, default=False)
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False)
    
    answered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="answers")
    question = relationship("Question")
