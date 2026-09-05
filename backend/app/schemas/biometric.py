from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class BiometricRegisterRequest(BaseModel):
    image_base64: str = Field(..., min_length=100, description="Base64 encoded JPEG/PNG frame")
    consent: bool = Field(..., description="Explicit student consent for biometric enrollment")
    override_re_register: bool = Field(False, description="Flag to confirm re-registration overwrite")

class BiometricRegisterResponse(BaseModel):
    success: bool
    message: str
    quality_score: float
    registered_at: datetime

class BiometricVerifyRequest(BaseModel):
    image_base64: str = Field(..., min_length=100, description="Base64 encoded camera frame")
    liveness_frames: Optional[List[str]] = Field(None, description="Optional consecutive frames for motion/blink liveness validation")
    exam_id: Optional[uuid.UUID] = Field(None, description="Optional active exam context")

class BiometricVerifyResponse(BaseModel):
    verified: bool
    similarity_score: float
    confidence: str
    match_threshold: float
    retries_left: int
    message: str
    locked_until: Optional[datetime] = None
class HeadPose(BaseModel):
    yaw: float
    pitch: float
    roll: float
    direction: str

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class DetectedObject(BaseModel):
    label: str
    confidence: float
    bounding_box: BoundingBox

class BiometricAnalyzeFrameRequest(BaseModel):
    frame: str = Field(..., description="Base64 encoded camera frame")

class BiometricAnalyzeFrameResponse(BaseModel):
    face_count: int
    status: str
    head_pose: Optional[HeadPose] = None
    objects: List[DetectedObject] = Field(default_factory=list)

class BiometricStatusResponse(BaseModel):
    is_registered: bool
    registered_at: Optional[datetime] = None
    quality_score: Optional[float] = None
    consent_given: bool = False
    key_version: Optional[str] = None

class BiometricDeleteResponse(BaseModel):
    success: bool
    message: str
    erased_at: datetime
