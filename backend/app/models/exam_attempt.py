from sqlalchemy import ForeignKey, String, Integer, Float, Boolean, Enum as SQLAlchemyEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin
from app.core.enums import AttemptStatus

class ExamAttempt(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "exam_attempts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    assignment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exam_assignments.id"), nullable=False, index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    exam_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exams.id"), nullable=False, index=True)
    
    status: Mapped[AttemptStatus] = mapped_column(SQLAlchemyEnum(AttemptStatus), default=AttemptStatus.NOT_STARTED, nullable=False)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Scoring & Progress
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    answered_questions: Mapped[int] = mapped_column(Integer, default=0)
    
    # Future AI specific fields
    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    face_verified: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    fullscreen_status: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    camera_status: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    exam = relationship("Exam", foreign_keys=[exam_id])
    assignment = relationship("ExamAssignment", foreign_keys=[assignment_id])
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    events = relationship("AttemptEvent", back_populates="attempt", cascade="all, delete-orphan")
