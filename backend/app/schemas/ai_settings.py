from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class AISettingsSchema(BaseModel):
    id: uuid.UUID
    face_detection: bool = True
    eye_tracking: bool = True
    phone_detection: bool = True
    voice_detection: bool = True
    multi_face_detection: bool = True
    tab_lockout: bool = True
    sensitivity: str = Field(default="Medium", pattern="^(Low|Medium|High)$")
    allowed_violations: int = 3
    warnings_before_submit: int = 2
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class AISettingsUpdate(BaseModel):
    face_detection: Optional[bool] = None
    eye_tracking: Optional[bool] = None
    phone_detection: Optional[bool] = None
    voice_detection: Optional[bool] = None
    multi_face_detection: Optional[bool] = None
    tab_lockout: Optional[bool] = None
    sensitivity: Optional[str] = Field(None, pattern="^(Low|Medium|High)$")
    allowed_violations: Optional[int] = None
    warnings_before_submit: Optional[int] = None

class AuditLogItem(BaseModel):
    id: str
    user: str
    action: str
    timestamp: datetime
    ip: str

    model_config = {"from_attributes": True}

class AuditLogCreate(BaseModel):
    action: str
    ip: Optional[str] = "127.0.0.1"
