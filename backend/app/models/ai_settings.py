from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from typing import Optional

from app.models.base import Base
from app.core.mixins import TimestampMixin

class AISettings(Base, TimestampMixin):
    __tablename__ = "ai_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    face_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    eye_tracking: Mapped[bool] = mapped_column(Boolean, default=True)
    phone_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    voice_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    multi_face_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    tab_lockout: Mapped[bool] = mapped_column(Boolean, default=True)
    sensitivity: Mapped[str] = mapped_column(String(20), default="Medium")  # Low, Medium, High
    allowed_violations: Mapped[int] = mapped_column(Integer, default=3)
    warnings_before_submit: Mapped[int] = mapped_column(Integer, default=2)

    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = relationship("User", foreign_keys=[updated_by_id])
