from sqlalchemy import String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional
import uuid

from app.models.base import Base
from app.core.mixins import TimestampMixin, SoftDeleteMixin

class StudentBiometric(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "student_biometrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # Encrypted biometric vector & key version
    encrypted_embedding: Mapped[str] = mapped_column(Text, nullable=False)
    key_version: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    
    # Optional encrypted audit thumbnail for authorized manual review only
    encrypted_audit_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata & Quality
    face_detected_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    image_quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    # GDPR & Consent
    consent_given: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    consent_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Active status (only one active registration per user at a time)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    user = relationship("User", back_populates="biometrics")


class BiometricVerificationLog(Base):
    """
    Dedicated audit log for similarity scores and verification attempts.
    Never stores embedding vectors or raw images.
    """
    __tablename__ = "biometric_verification_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    exam_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("exams.id", ondelete="SET NULL"), nullable=True)
    
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    match_result: Mapped[bool] = mapped_column(Boolean, nullable=False)
    liveness_passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    client_ip: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class BiometricRateLimit(Base):
    """
    Tracks rate-limiting per user for verify and register endpoints.
    """
    __tablename__ = "biometric_rate_limits"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    endpoint: Mapped[str] = mapped_column(String(50), index=True) # "verify" or "register"
    
    attempt_count: Mapped[int] = mapped_column(default=1)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
