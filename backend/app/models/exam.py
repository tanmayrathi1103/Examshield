from sqlalchemy import String, Integer, ForeignKey, Text, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin
from app.core.enums import ExamStatus

class Exam(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    exam_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    total_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    passing_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    start_time: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    status: Mapped[ExamStatus] = mapped_column(SQLAlchemyEnum(ExamStatus), default=ExamStatus.DRAFT, index=True, nullable=False)
    
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)

    creator = relationship("User", foreign_keys=[created_by])
    assignments = relationship("ExamAssignment", back_populates="exam", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan", order_by="Question.order_number")
