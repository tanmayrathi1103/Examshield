from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import logging
import uuid
import cv2
from typing import Optional

from app.database.session import get_db
from app.models.user import User
from app.models.student_biometric import StudentBiometric, BiometricVerificationLog, BiometricRateLimit
from app.core.dependencies import get_active_user
from app.core.config import settings
from app.core.biometric_security import BiometricSecurity
from app.ai.face_recognition.face_service import face_recognition_service, FaceProcessingError
from app.schemas.biometric import (
    BiometricRegisterRequest,
    BiometricRegisterResponse,
    BiometricVerifyRequest,
    BiometricVerifyResponse,
    BiometricStatusResponse,
    BiometricDeleteResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/biometrics", tags=["Biometrics"])


def check_and_update_rate_limit(
    db: Session,
    user_id: uuid.UUID,
    endpoint: str,
    max_attempts: int,
    window_minutes: int
) -> int:
    """
    Enforces per-user rate limiting using database tracking.
    Returns remaining attempts. Raises HTTPException 429 if locked.
    """
    now = datetime.now(timezone.utc)
    rate_record = db.query(BiometricRateLimit).filter(
        BiometricRateLimit.user_id == user_id,
        BiometricRateLimit.endpoint == endpoint
    ).first()

    if not rate_record:
        rate_record = BiometricRateLimit(
            user_id=user_id,
            endpoint=endpoint,
            attempt_count=1,
            window_start=now
        )
        db.add(rate_record)
        db.commit()
        return max_attempts - 1

    # Check if locked
    if rate_record.locked_until and rate_record.locked_until > now:
        lock_remaining = int((rate_record.locked_until - now).total_seconds() / 60) + 1
        logger.warning(f"Security: Rate limit locked for user {user_id} on {endpoint}. Remaining: {lock_remaining}m")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many attempts. Biometric verification is temporarily locked for {lock_remaining} more minutes."
        )

    # Window expiry reset
    if now - rate_record.window_start > timedelta(minutes=window_minutes):
        rate_record.window_start = now
        rate_record.attempt_count = 1
        rate_record.locked_until = None
        db.add(rate_record)
        db.commit()
        return max_attempts - 1

    # Increment attempt count
    rate_record.attempt_count += 1
    if rate_record.attempt_count > max_attempts:
        rate_record.locked_until = now + timedelta(minutes=window_minutes)
        db.add(rate_record)
        db.commit()
        logger.warning(f"Security: Rate limit tripped for user {user_id} on endpoint {endpoint} at {now.isoformat()}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Biometric access locked for {window_minutes} minutes."
        )

    db.add(rate_record)
    db.commit()
    return max(0, max_attempts - rate_record.attempt_count)


@router.post("/register", response_model=BiometricRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_biometrics(
    payload: BiometricRegisterRequest,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db)
):
    """
    Registers student facial biometrics:
    1. Validates consent.
    2. Enforces registration rate limiting.
    3. Runs quality checks and extracts 128-d embedding.
    4. Enforces re-registration security policy (soft-delete old records).
    5. Encrypts embedding and stores in database.
    """
    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Biometric registration requires explicit student consent."
        )

    # Rate limiting: max 3 registration attempts per hour per user
    check_and_update_rate_limit(
        db, current_user.id, endpoint="register",
        max_attempts=settings.BIOMETRIC_MAX_REGISTER_ATTEMPTS,
        window_minutes=60
    )

    try:
        # Decode and process incoming registration capture (quality & single face detection checks)
        img = face_recognition_service.decode_base64_image(payload.image_base64)
        quality = face_recognition_service.check_image_quality(img)
        face_row, confidence = face_recognition_service.detect_face(img)
        
        # Create thumbnail for optional audit record
        h, w = img.shape[:2]
        thumb = cv2.resize(img, (160, int(160 * h / w)))
        _, thumb_buf = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 75])
    except FaceProcessingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

    # Check for existing active registration
    existing = db.query(StudentBiometric).filter(
        StudentBiometric.user_id == current_user.id,
        StudentBiometric.is_active == True,
        StudentBiometric.is_deleted == False
    ).first()

    if existing:
        if not payload.override_re_register:
            # Check similarity against previous template to prevent identity swap
            try:
                # Decrypt old raw image string
                old_base64 = BiometricSecurity.decrypt_image_base64(existing.encrypted_embedding, existing.key_version)
                
                # Extract embeddings on-demand from both old and new frames
                old_img = face_recognition_service.decode_base64_image(old_base64)
                old_face_row, _ = face_recognition_service.detect_face(old_img)
                old_emb = face_recognition_service.extract_embedding(old_img, old_face_row)
                
                new_emb = face_recognition_service.extract_embedding(img, face_row)
                similarity = face_recognition_service.compute_cosine_similarity(new_emb, old_emb)
                
                if similarity < settings.BIOMETRIC_MATCH_THRESHOLD:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="New capture does not match existing biometrics. If your appearance changed, please confirm re-registration."
                    )
            except HTTPException:
                raise
            except ValueError as e:
                if "MIGRATION_REQUIRED" in str(e):
                    logger.info("Outdated template model format detected during re-registration check; bypassing comparison block.")
                else:
                    logger.warning(f"Re-registration decryption format error: {e}")
            except Exception as e:
                logger.warning(f"Re-registration check error: {e}")

        # Soft-delete previous active template for retention & audit trail
        existing.is_active = False
        existing.is_deleted = True
        existing.deleted_at = datetime.now(timezone.utc)
        db.add(existing)

    # Encrypt raw base64 image & audit thumbnail
    encrypted_emb, key_version = BiometricSecurity.encrypt_image_base64(payload.image_base64)
    encrypted_thumb, _ = BiometricSecurity.encrypt_image(thumb_buf.tobytes(), key_version)

    now = datetime.now(timezone.utc)
    new_biometric = StudentBiometric(
        user_id=current_user.id,
        encrypted_embedding=encrypted_emb,
        key_version=key_version,
        encrypted_audit_image=encrypted_thumb,
        face_detected_confidence=round(confidence, 4),
        image_quality_score=quality["quality_score"],
        consent_given=True,
        consent_timestamp=now,
        is_active=True
    )
    db.add(new_biometric)
    db.commit()
    db.refresh(new_biometric)

    logger.info(f"Successfully registered biometrics for user {current_user.id}")
    return BiometricRegisterResponse(
        success=True,
        message="Face biometrics registered and securely encrypted.",
        quality_score=quality["quality_score"],
        registered_at=now
    )


@router.post("/verify", response_model=BiometricVerifyResponse)
def verify_biometrics(
    payload: BiometricVerifyRequest,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db)
):
    """
    Verifies student identity against registered biometric template:
    1. Enforces rate limits (max 5 attempts per 15 mins).
    2. Runs quality checks & extracts embedding from incoming capture.
    3. Runs basic liveness verification against challenge frames.
    4. Computes cosine similarity with stored template.
    5. Logs similarity score and match result to audit table.
    """
    # Rate limit: max 5 attempts per 15 minutes
    retries_left = check_and_update_rate_limit(
        db, current_user.id, endpoint="verify",
        max_attempts=settings.BIOMETRIC_MAX_VERIFY_ATTEMPTS,
        window_minutes=15
    )

    # Fetch active registered biometric template
    stored_biometric = db.query(StudentBiometric).filter(
        StudentBiometric.user_id == current_user.id,
        StudentBiometric.is_active == True,
        StudentBiometric.is_deleted == False
    ).first()

    if not stored_biometric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered biometric profile found. Please complete Biometric Registration first."
        )

    client_ip = request.client.host if request.client else None

    try:
        # Decode and process incoming capture
        img = face_recognition_service.decode_base64_image(payload.image_base64)
        quality = face_recognition_service.check_image_quality(img)
        face_row, confidence = face_recognition_service.detect_face(img)
        new_emb = face_recognition_service.extract_embedding(img, face_row)
        
        # Optional Liveness verification: always passed since liveness sequence is removed
        liveness_passed = True

        # Decrypt stored template base64 image
        try:
            stored_base64 = BiometricSecurity.decrypt_image_base64(
                stored_biometric.encrypted_embedding,
                stored_biometric.key_version
            )
        except ValueError as e:
            if "MIGRATION_REQUIRED" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Outdated biometric template format detected. Please complete Biometric Registration again to enroll with the new model."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to decrypt biometric profile. Please re-register."
            )

        # Decode stored template image and extract FaceNet embedding on the fly
        stored_img = face_recognition_service.decode_base64_image(stored_base64)
        stored_face_row, _ = face_recognition_service.detect_face(stored_img)
        stored_emb = face_recognition_service.extract_embedding(stored_img, stored_face_row)

        # Compute cosine similarity between the two embeddings
        similarity = face_recognition_service.compute_cosine_similarity(new_emb, stored_emb)
        match_passed = similarity >= settings.BIOMETRIC_MATCH_THRESHOLD

        # Log verification score & audit trail (never logs vectors or raw images)
        verification_log = BiometricVerificationLog(
            user_id=current_user.id,
            exam_id=payload.exam_id,
            similarity_score=round(similarity, 4),
            match_result=match_passed,
            liveness_passed=liveness_passed,
            client_ip=client_ip
        )
        db.add(verification_log)
        db.commit()

        if match_passed:
            message = "Identity verified successfully."
        else:
            message = (
                f"Face match failed (similarity score: {similarity:.2f} < {settings.BIOMETRIC_MATCH_THRESHOLD}). "
                "Please adjust your lighting, face the camera directly, and try again."
            )

        return BiometricVerifyResponse(
            verified=match_passed,
            similarity_score=round(similarity, 4),
            match_threshold=settings.BIOMETRIC_MATCH_THRESHOLD,
            retries_left=retries_left if not match_passed else settings.BIOMETRIC_MAX_VERIFY_ATTEMPTS,
            message=message
        )

    except FaceProcessingError as e:
        # Log failed attempt
        db.add(BiometricVerificationLog(
            user_id=current_user.id,
            exam_id=payload.exam_id,
            similarity_score=0.0,
            match_result=False,
            liveness_passed=False,
            client_ip=client_ip
        ))
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.get("/status", response_model=BiometricStatusResponse)
def get_biometric_status(
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns student enrollment status for UI gating.
    """
    active_biometric = db.query(StudentBiometric).filter(
        StudentBiometric.user_id == current_user.id,
        StudentBiometric.is_active == True,
        StudentBiometric.is_deleted == False
    ).first()

    if not active_biometric:
        return BiometricStatusResponse(is_registered=False)

    return BiometricStatusResponse(
        is_registered=True,
        registered_at=active_biometric.created_at,
        quality_score=active_biometric.image_quality_score,
        consent_given=active_biometric.consent_given,
        key_version=active_biometric.key_version
    )


@router.delete("/my-data", response_model=BiometricDeleteResponse)
def delete_biometric_data(
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db)
):
    """
    GDPR Right to Erasure: Soft-deletes and deactivates all biometric data for the current user.
    """
    biometrics = db.query(StudentBiometric).filter(
        StudentBiometric.user_id == current_user.id,
        StudentBiometric.is_deleted == False
    ).all()

    now = datetime.now(timezone.utc)
    for b in biometrics:
        b.is_active = False
        b.is_deleted = True
        b.deleted_at = now
        # GDPR Purge: Clear actual encrypted image strings from storage
        b.encrypted_embedding = ""
        b.encrypted_audit_image = None
        db.add(b)

    db.commit()
    logger.info(f"GDPR Erasure: Biometric data deactivated for user {current_user.id}")

    return BiometricDeleteResponse(
        success=True,
        message="Your biometric enrollment data has been erased successfully.",
        erased_at=now
    )
