from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class AdminResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    admin_level: int

    model_config = {"from_attributes": True}

class StudentDirectoryItem(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone_number: str
    roll_no: str
    department: str
    semester: Optional[int] = None
    year: Optional[int] = None
    integrity_score: float
    status: str  # "active" | "suspended"
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class FacultyDirectoryItem(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone_number: str
    employee_id: str
    department: str
    designation: str
    assigned_courses: List[str]
    status: str  # "active" | "suspended"
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class UserStatusUpdate(BaseModel):
    is_active: bool

class AdminActivityItem(BaseModel):
    id: str
    user: str
    action: str
    timestamp: datetime
    ip: str = "127.0.0.1"

class AdminStatsResponse(BaseModel):
    total_students: int
    total_faculty: int
    total_exams: int
    total_attempts: int
    total_violations: int
    violation_distribution: Dict[str, int]
    ai_sensitivity: str
    recent_activity: List[AdminActivityItem]

class AdminViolationItem(BaseModel):
    id: uuid.UUID
    attempt_id: uuid.UUID
    student_name: str
    student_email: str
    exam_title: str
    timestamp: datetime
    type: str
    raw_event_type: str
    severity: str  # "low" | "medium" | "high"
    resolved: bool
    details: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}

class ViolationResolveResponse(BaseModel):
    id: uuid.UUID
    resolved: bool
    message: str
