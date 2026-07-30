from sqlalchemy import String, ForeignKey, Date, Integer, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from typing import Optional
from datetime import date

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin
from app.core.enums import Gender, Semester, Branch

class StudentProfile(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "student_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    enrollment_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    branch: Mapped[Branch] = mapped_column(SQLAlchemyEnum(Branch))
    semester: Mapped[Semester] = mapped_column(SQLAlchemyEnum(Semester))
    year: Mapped[int] = mapped_column(Integer)
    section: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[Gender]] = mapped_column(SQLAlchemyEnum(Gender), nullable=True)

    user = relationship("User", back_populates="student_profile")
