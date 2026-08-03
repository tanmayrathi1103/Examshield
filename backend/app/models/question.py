from sqlalchemy import String, Integer, ForeignKey, Text, Enum as SQLAlchemyEnum, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin
from app.core.enums import QuestionType, Difficulty

class Question(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    exam_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), index=True, nullable=False)
    
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(SQLAlchemyEnum(QuestionType), index=True, nullable=False)
    marks: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    negative_marks: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    difficulty: Mapped[Difficulty] = mapped_column(SQLAlchemyEnum(Difficulty), default=Difficulty.MEDIUM, index=True, nullable=False)
    
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    exam = relationship("Exam", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", order_by="QuestionOption.display_order")


class QuestionOption(Base, TimestampMixin):
    __tablename__ = "question_options"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True, nullable=False)
    
    option_label: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    question = relationship("Question", back_populates="options")
