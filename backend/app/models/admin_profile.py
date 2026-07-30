from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin

class AdminProfile(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "admin_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    admin_level: Mapped[int] = mapped_column(Integer, default=1)

    user = relationship("User", back_populates="admin_profile")
