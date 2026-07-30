from sqlalchemy import ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin
from app.core.enums import AssignmentStatus

class ExamAssignment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "exam_assignments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    exam_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    assigned_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc), nullable=False)
    assignment_status: Mapped[AssignmentStatus] = mapped_column(SQLAlchemyEnum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, nullable=False)

    exam = relationship("Exam", back_populates="assignments")
    student = relationship("User", foreign_keys=[student_id])
