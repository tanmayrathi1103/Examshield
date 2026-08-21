import pytest
import numpy as np
import cv2
import base64
import uuid
from unittest.mock import patch
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from fastapi import status

from app.main import app
from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.core.biometric_security import BiometricSecurity
from app.ai.face_recognition.face_service import face_recognition_service, FaceProcessingError
from app.database.session import SessionLocal
from app.models.user import User
from app.models.student_biometric import StudentBiometric, BiometricVerificationLog, BiometricRateLimit
from app.core.enums import UserRole

client = TestClient(app)

# Helper: Generate realistic quality synthetic test image (sharpness, lighting)
def generate_synthetic_face_base64() -> str:
    """Generates a synthetic realistic test image."""
    img = np.ones((320, 320, 3), dtype=np.uint8) * 160
    # Add high texture detail to pass Laplacian variance check
    noise = np.random.randint(-15, 15, (320, 320, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Draw simple facial shape
    cv2.circle(img, (160, 160), 75, (220, 190, 170), -1)
    cv2.circle(img, (135, 140), 8, (40, 40, 40), -1)
    cv2.circle(img, (185, 140), 8, (40, 40, 40), -1)
    cv2.ellipse(img, (160, 195), (25, 10), 0, 0, 180, (50, 50, 180), -1)
    
    _, buf = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode('utf-8')

# Helper: Generate blurry image
def generate_blurry_image_base64() -> str:
    img = np.ones((320, 320, 3), dtype=np.uint8) * 128  # Smooth/blank image has low Laplacian variance
    _, buf = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode('utf-8')

# Helper: Generate dark image
def generate_dark_image_base64() -> str:
    img = np.zeros((320, 320, 3), dtype=np.uint8)
    _, buf = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode('utf-8')

# Unit Tests (Preserved and updated)
def test_biometric_security_encryption_roundtrip():
    """Verifies that base64 image strings encrypt and decrypt successfully."""
    base64_str = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
    encrypted_str, key_version = BiometricSecurity.encrypt_image_base64(base64_str)
    
    assert isinstance(encrypted_str, str)
    assert key_version == "v1"
    
    decrypted_str = BiometricSecurity.decrypt_image_base64(encrypted_str, key_version)
    assert decrypted_str == base64_str

def test_quality_checks_dark_and_blurry():
    """Verifies quality check rejects dark or low-variance images."""
    dark_img = np.zeros((320, 320, 3), dtype=np.uint8)
    with pytest.raises(FaceProcessingError) as exc:
        face_recognition_service.check_image_quality(dark_img)
    assert exc.value.code == "UNDER_EXPOSED"

    # Smooth blank image (blur)
    blank_img = np.ones((320, 320, 3), dtype=np.uint8) * 128
    with pytest.raises(FaceProcessingError) as exc2:
        face_recognition_service.check_image_quality(blank_img)
    assert exc2.value.code == "BLURRY"

def test_cosine_similarity_identical_and_orthogonal():
    """Verifies cosine similarity computation."""
    v1 = [1.0] + [0.0]*127
    v2 = [1.0] + [0.0]*127
    v3 = [0.0, 1.0] + [0.0]*126
    
    sim_match = face_recognition_service.compute_cosine_similarity(v1, v2)
    assert sim_match == 1.0
    
    sim_diff = face_recognition_service.compute_cosine_similarity(v1, v3)
    assert sim_diff == 0.0

def test_liveness_detection_is_deprecated():
    """Verifies that the deprecated liveness check always returns True."""
    img = np.ones((320, 320, 3), dtype=np.uint8) * 128
    assert face_recognition_service.verify_liveness(img, []) is True
    assert face_recognition_service.verify_liveness(img, [img] * 6) is True


# API Integration Tests Fixture
@pytest.fixture
def test_student_session():
    """
    Creates a unique test student user and returns a tuple:
    (db_session, user_object, auth_headers_dict, created_user_ids_list)
    Handles clean db session and marks user ID for teardown.
    """
    db = SessionLocal()
    created_user_ids = []
    
    # Generate unique credentials
    unique_id = uuid.uuid4()
    email = f"test_student_{unique_id.hex[:8]}@example.com"
    phone = f"+1555{unique_id.hex[:7]}"
    pwd_hash = hash_password("ValidPassword123!")
    
    # Insert student user directly into database
    user = User(
        id=unique_id,
        full_name="Test Student Biometric",
        email=email,
        phone_number=phone,
        password_hash=pwd_hash,
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    created_user_ids.append(user.id)
    
    # Generate JWT token
    token = create_access_token(subject=str(user.id))
    headers = {"Authorization": f"Bearer {token}"}
    
    yield db, user, headers, created_user_ids
    
    # Teardown: Clean all tables associated with this user
    for uid in created_user_ids:
        try:
            db.query(BiometricVerificationLog).filter(BiometricVerificationLog.user_id == uid).delete()
            db.query(BiometricRateLimit).filter(BiometricRateLimit.user_id == uid).delete()
            db.query(StudentBiometric).filter(StudentBiometric.user_id == uid).delete()
            db.query(User).filter(User.id == uid).delete()
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Teardown error for user {uid}: {e}")
            
    db.close()


def test_api_biometrics_register_validation_and_quality(test_student_session):
    db, user, headers, _ = test_student_session
    
    # 1. No Consent Test
    image_data = generate_synthetic_face_base64()
    response = client.post(
        "/api/v1/biometrics/register",
        headers=headers,
        json={"image_base64": image_data, "consent": False}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "consent" in response.json()["detail"].lower()
    
    # 2. Dark Frame Test
    dark_image = generate_dark_image_base64()
    response = client.post(
        "/api/v1/biometrics/register",
        headers=headers,
        json={"image_base64": dark_image, "consent": True}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "dark" in response.json()["detail"].lower()
    
    # 3. Blurry Frame Test
    blurry_image = generate_blurry_image_base64()
    response = client.post(
        "/api/v1/biometrics/register",
        headers=headers,
        json={"image_base64": blurry_image, "consent": True}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "blurry" in response.json()["detail"].lower()


def test_api_biometrics_register_and_verify_flow(test_student_session):
    db, user, headers, _ = test_student_session
    
    # Setup mock face detection and embedding extraction
    # Embedding: a unit vector where first element is 1.0
    mock_emb1 = [1.0] + [0.0]*127
    
    with patch.object(face_recognition_service, 'detect_face', return_value=(np.zeros(15), 0.98)), \
         patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb1):
         
        # 1. Register face biometrics
        image_data = generate_synthetic_face_base64()
        response = client.post(
            "/api/v1/biometrics/register",
            headers=headers,
            json={"image_base64": image_data, "consent": True}
        )
        assert response.status_code == status.HTTP_201_CREATED
        reg_data = response.json()
        assert reg_data["success"] is True
        assert reg_data["quality_score"] > 0
        
        # Verify enrollment status via status endpoint
        status_resp = client.get("/api/v1/biometrics/status", headers=headers)
        assert status_resp.status_code == status.HTTP_200_OK
        assert status_resp.json()["is_registered"] is True
        
        # 2. Verify face with matching face
        verify_resp = client.post(
            "/api/v1/biometrics/verify",
            headers=headers,
            json={"image_base64": image_data}
        )
        assert verify_resp.status_code == status.HTTP_200_OK
        assert verify_resp.json()["verified"] is True
        assert verify_resp.json()["similarity_score"] >= 0.99
        
        # 3. Verify face with mismatched face
        mock_emb2 = [0.0, 1.0] + [0.0]*126
        call_count = 0
        def mock_mismatch_extract(img, face_row=None):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return mock_emb2 # Verification scan frame
            return mock_emb1 # Stored template frame
            
        with patch.object(face_recognition_service, 'extract_embedding', side_effect=mock_mismatch_extract):
            verify_resp_fail = client.post(
                "/api/v1/biometrics/verify",
                headers=headers,
                json={"image_base64": image_data}
            )
            assert verify_resp_fail.status_code == status.HTTP_200_OK
            assert verify_resp_fail.json()["verified"] is False
            assert verify_resp_fail.json()["similarity_score"] < 0.1
            assert "failed" in verify_resp_fail.json()["message"].lower()


def test_api_biometrics_verify_ignores_liveness_frames(test_student_session):
    """Verifies that verification succeeds directly even if liveness frames are passed (ignored)."""
    db, user, headers, _ = test_student_session
    mock_emb = [1.0] + [0.0]*127
    
    # We mock detect_face to return straight orientation by default
    mock_face_straight = np.zeros(15, dtype=np.float32)
    mock_face_straight[0:4] = [80, 80, 160, 160]
    mock_face_straight[4] = 100.0
    mock_face_straight[6] = 200.0
    mock_face_straight[8] = 150.0
    mock_face_straight[14] = 0.98
    
    with patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb), \
         patch.object(face_recognition_service, 'detect_face', return_value=(mock_face_straight, 0.98)):
         
        # Enroll user
        img_base64 = generate_synthetic_face_base64()
        client.post("/api/v1/biometrics/register", headers=headers, json={"image_base64": img_base64, "consent": True})
        
        # Verify passing liveness_frames - they should be completely ignored and verification should pass
        response = client.post(
            "/api/v1/biometrics/verify",
            headers=headers,
            json={
                "image_base64": img_base64,
                "liveness_frames": [img_base64]
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["verified"] is True


def test_api_biometrics_re_registration_override(test_student_session):
    db, user, headers, _ = test_student_session
    mock_emb1 = [1.0] + [0.0]*127
    mock_emb2 = [0.0, 1.0] + [0.0]*126 # orthogonal mismatch
    
    with patch.object(face_recognition_service, 'detect_face', return_value=(np.zeros(15), 0.98)):
         
        # Enroll user with template 1
        with patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb1):
            img_base64 = generate_synthetic_face_base64()
            res = client.post("/api/v1/biometrics/register", headers=headers, json={"image_base64": img_base64, "consent": True})
            assert res.status_code == status.HTTP_201_CREATED
            
        # Re-register without override using different face template -> Conflict 409 expected
        call_count = 0
        def mock_reg_extract(img, face_row=None):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return mock_emb1 # old template
            return mock_emb2 # new template
            
        with patch.object(face_recognition_service, 'extract_embedding', side_effect=mock_reg_extract):
            res_fail = client.post(
                "/api/v1/biometrics/register",
                headers=headers,
                json={"image_base64": img_base64, "consent": True, "override_re_register": False}
            )
            assert res_fail.status_code == status.HTTP_409_CONFLICT
            assert "does not match" in res_fail.json()["detail"].lower()
            
        # Re-register with override using different face template -> Success 201 expected
        with patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb2):
            res_ok = client.post(
                "/api/v1/biometrics/register",
                headers=headers,
                json={"image_base64": img_base64, "consent": True, "override_re_register": True}
            )
            assert res_ok.status_code == status.HTTP_201_CREATED
            
            # Verify status has updated
            status_resp = client.get("/api/v1/biometrics/status", headers=headers)
            assert status_resp.json()["is_registered"] is True
            
            # Check DB directly to confirm previous template soft-deleted
            active_biometrics = db.query(StudentBiometric).filter(
                StudentBiometric.user_id == user.id,
                StudentBiometric.is_active == True,
                StudentBiometric.is_deleted == False
            ).all()
            assert len(active_biometrics) == 1
            
            deleted_biometrics = db.query(StudentBiometric).filter(
                StudentBiometric.user_id == user.id,
                StudentBiometric.is_deleted == True
            ).all()
            assert len(deleted_biometrics) >= 1


def test_api_biometrics_rate_limiting_and_window_reset(test_student_session):
    db, user, headers, _ = test_student_session
    mock_emb = [1.0] + [0.0]*127
    
    with patch.object(face_recognition_service, 'detect_face', return_value=(np.zeros(15), 0.98)), \
         patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb):
         
        img_base64 = generate_synthetic_face_base64()
        
        # Enroll user
        client.post("/api/v1/biometrics/register", headers=headers, json={"image_base64": img_base64, "consent": True})
        
        # Trigger 5 failed verification attempts to lock verification rate limit (max is 5 attempts)
        mock_mismatch = [0.0, 1.0] + [0.0]*126
        call_idx = 0
        def mock_verify_extract(img, face_row=None):
            nonlocal call_idx
            call_idx += 1
            if call_idx % 2 == 1:
                return mock_mismatch # new frame
            return mock_emb # stored template
            
        with patch.object(face_recognition_service, 'extract_embedding', side_effect=mock_verify_extract):
            for i in range(5):
                verify_resp = client.post("/api/v1/biometrics/verify", headers=headers, json={"image_base64": img_base64})
                assert verify_resp.status_code == status.HTTP_200_OK
                assert verify_resp.json()["verified"] is False
                
            # 6th attempt should trigger rate lock (429 Too Many Requests)
            verify_resp_lock = client.post("/api/v1/biometrics/verify", headers=headers, json={"image_base64": img_base64})
            assert verify_resp_lock.status_code == status.HTTP_429_TOO_MANY_REQUESTS
            assert "too many attempts" in verify_resp_lock.json()["detail"].lower() or "rate limit" in verify_resp_lock.json()["detail"].lower()
            
        # Simulate time moving past the 15-minute window by updating rate limits in DB directly
        rate_record = db.query(BiometricRateLimit).filter(
            BiometricRateLimit.user_id == user.id,
            BiometricRateLimit.endpoint == "verify"
        ).first()
        assert rate_record is not None
        
        # Reset rate limit locked_until and window_start to be 20 minutes in the past
        rate_record.window_start = datetime.now(timezone.utc) - timedelta(minutes=20)
        rate_record.locked_until = None
        rate_record.attempt_count = 0
        db.add(rate_record)
        db.commit()
        
        # Verify that access is restored and attempts are allowed again
        verify_resp_restored = client.post("/api/v1/biometrics/verify", headers=headers, json={"image_base64": img_base64})
        assert verify_resp_restored.status_code == status.HTTP_200_OK


def test_api_biometrics_gdpr_erasure(test_student_session):
    db, user, headers, _ = test_student_session
    mock_emb = [1.0] + [0.0]*127
    
    with patch.object(face_recognition_service, 'detect_face', return_value=(np.zeros(15), 0.98)), \
         patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb):
         
        img_base64 = generate_synthetic_face_base64()
        
        # Enroll user
        client.post("/api/v1/biometrics/register", headers=headers, json={"image_base64": img_base64, "consent": True})
        
        # Verify enrollment is active
        status_resp = client.get("/api/v1/biometrics/status", headers=headers)
        assert status_resp.json()["is_registered"] is True
        
        # Perform erasure
        del_resp = client.delete("/api/v1/biometrics/my-data", headers=headers)
        assert del_resp.status_code == status.HTTP_200_OK
        assert del_resp.json()["success"] is True
        
        # Assert status is now unregistered
        status_resp_del = client.get("/api/v1/biometrics/status", headers=headers)
        assert status_resp_del.json()["is_registered"] is False
        
        # Verify that verify call returns 404 (access revoked)
        verify_resp_del = client.post("/api/v1/biometrics/verify", headers=headers, json={"image_base64": img_base64})
        assert verify_resp_del.status_code == status.HTTP_404_NOT_FOUND


def test_encryption_at_rest_and_no_leakage(test_student_session):
    db, user, headers, _ = test_student_session
    mock_emb = [0.15] * 128
    
    with patch.object(face_recognition_service, 'detect_face', return_value=(np.zeros(15), 0.98)), \
         patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb):
         
        img_base64 = generate_synthetic_face_base64()
        
        # Register to store biometric raw image
        client.post("/api/v1/biometrics/register", headers=headers, json={"image_base64": img_base64, "consent": True})
        
        # Retrieve db record directly
        biometric_rec = db.query(StudentBiometric).filter(StudentBiometric.user_id == user.id).first()
        assert biometric_rec is not None
        
        # 1. Assert raw base64 string is not stored in raw format (opaque ciphertext string instead)
        assert isinstance(biometric_rec.encrypted_embedding, str)
        assert "generate_synthetic" not in biometric_rec.encrypted_embedding
        assert len(biometric_rec.encrypted_embedding) > 50 # Ciphertext
        
        # Decrypt to ensure it resolves to original values
        decrypted = BiometricSecurity.decrypt_image_base64(biometric_rec.encrypted_embedding, biometric_rec.key_version)
        assert decrypted == img_base64
        
        # 2. Run a verification check to generate a verification log
        client.post("/api/v1/biometrics/verify", headers=headers, json={"image_base64": img_base64})
        
        # Retrieve verification log directly
        log_rec = db.query(BiometricVerificationLog).filter(BiometricVerificationLog.user_id == user.id).first()
        assert log_rec is not None
        
        # 3. Assert verification log contains score and status, but absolutely NO biometric embeddings or images
        assert log_rec.similarity_score is not None
        assert log_rec.match_result is True
        
        # Ensure log columns don't store embedding or base64 frame data (by verifying no such attributes exist or are populated)
        log_columns = [col.name for col in BiometricVerificationLog.__table__.columns]
        for c in log_columns:
            assert "embedding" not in c.lower()
            assert "vector" not in c.lower()
            assert "image" not in c.lower()
            assert "frame" not in c.lower()


def test_cryptographic_key_rotation(test_student_session):
    """
    Tests that:
    1. Base64 strings can be encrypted under one key version (v1).
    2. A new key version (v2) is introduced.
    3. Old records created under (v1) can still be successfully decrypted (backward compatibility).
    4. New records are encrypted and decrypted under (v2).
    """
    db, user, headers, _ = test_student_session
    mock_base64 = "data:image/jpeg;base64,RotatedImageBase64..."
    
    # Phase 1: Encrypt under v1 (current settings key)
    encrypted_v1, version_v1 = BiometricSecurity.encrypt_image_base64(mock_base64, key_version="v1")
    assert version_v1 == "v1"
    
    # Phase 2: Introduce key rotation (inject v2 key version dynamically)
    new_v2_key = "DjHY5zYAg_wK0hND2jo0xYvJdZi2_KR1_ah5cNguUxM=" # Same key format or valid Fernet key
    # Inject into BiometricSecurity keys mapping
    BiometricSecurity._keys["v2"] = new_v2_key
    
    # Encrypt a new vector with key version v2
    encrypted_v2, version_v2 = BiometricSecurity.encrypt_image_base64(mock_base64, key_version="v2")
    assert version_v2 == "v2"
    assert encrypted_v1 != encrypted_v2
    
    # Phase 3: Decrypt old v1 vector using version check mapping
    decrypted_v1 = BiometricSecurity.decrypt_image_base64(encrypted_v1, key_version="v1")
    assert decrypted_v1 == mock_base64
    
    # Phase 4: Decrypt new v2 vector
    decrypted_v2 = BiometricSecurity.decrypt_image_base64(encrypted_v2, key_version="v2")
    assert decrypted_v2 == mock_base64

    # Clean up static class mapping to avoid test side effects
    if "v2" in BiometricSecurity._keys:
        del BiometricSecurity._keys["v2"]


def test_api_biometrics_migration_enforcement(test_student_session):
    """
    Tests that:
    1. A legacy SFace template (unwrapped raw list) in the database triggers MIGRATION_REQUIRED.
    2. The verify endpoint returns a clear 400 Upgrade/Migration prompt.
    """
    db, user, headers, _ = test_student_session
    mock_emb = [1.0] + [0.0]*127
    
    # Directly encrypt in legacy format (unwrapped list serialization)
    import json
    version = "v1"
    cipher = BiometricSecurity._get_cipher(version)
    serialized = json.dumps(mock_emb).encode('utf-8')
    legacy_encrypted = cipher.encrypt(serialized).decode('utf-8')
    
    # Insert legacy SFace template
    db.query(StudentBiometric).filter(StudentBiometric.user_id == user.id).delete()
    db.commit()
    
    legacy_biometric = StudentBiometric(
        user_id=user.id,
        encrypted_embedding=legacy_encrypted,
        key_version=version,
        face_detected_confidence=0.98,
        image_quality_score=95.0,
        consent_given=True,
        is_active=True
    )
    db.add(legacy_biometric)
    db.commit()
    
    # Perform verification
    img_base64 = generate_synthetic_face_base64()
    
    # Mock face checks for base64 inputs
    mock_face_straight = np.zeros(15, dtype=np.float32)
    mock_face_straight[0:4] = [80, 80, 160, 160]
    mock_face_straight[4] = 100.0
    mock_face_straight[6] = 200.0
    mock_face_straight[8] = 150.0
    mock_face_straight[14] = 0.98
        
    with patch.object(face_recognition_service, 'extract_embedding', return_value=mock_emb), \
         patch.object(face_recognition_service, 'detect_face', return_value=(mock_face_straight, 0.98)):
         
        response = client.post(
            "/api/v1/biometrics/verify",
            headers=headers,
            json={
                "image_base64": img_base64,
                "liveness_frames": []
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "outdated biometric template" in response.json()["detail"].lower()


def test_api_biometrics_gdpr_erasure_purges_bytes(test_student_session):
    """Verifies that GDPR Right to Erasure completely clears raw image data from the record."""
    db, user, headers, _ = test_student_session
    img_base64 = generate_synthetic_face_base64()
    
    # We mock face detection checks to avoid image quality errors
    mock_face_straight = np.zeros(15, dtype=np.float32)
    mock_face_straight[0:4] = [80, 80, 160, 160]
    mock_face_straight[4] = 100.0
    mock_face_straight[6] = 200.0
    mock_face_straight[8] = 150.0
    mock_face_straight[14] = 0.98
    
    with patch.object(face_recognition_service, 'detect_face', return_value=(mock_face_straight, 0.98)):
        # 1. Register to save raw image
        reg_resp = client.post("/api/v1/biometrics/register", headers=headers, json={"image_base64": img_base64, "consent": True})
        assert reg_resp.status_code == status.HTTP_201_CREATED
        
        # Verify DB record has encrypted_embedding populated
        biometric_rec = db.query(StudentBiometric).filter(StudentBiometric.user_id == user.id, StudentBiometric.is_active == True).first()
        assert biometric_rec is not None
        assert len(biometric_rec.encrypted_embedding) > 50
        
        # 2. Call delete endpoint
        del_resp = client.delete("/api/v1/biometrics/my-data", headers=headers)
        assert del_resp.status_code == status.HTTP_200_OK
        
        # Refresh DB session
        db.refresh(biometric_rec)
        
        # Assert values are purged (empty string / None)
        assert biometric_rec.encrypted_embedding == ""
        assert biometric_rec.encrypted_audit_image is None
        assert biometric_rec.is_deleted is True
        assert biometric_rec.is_active is False

