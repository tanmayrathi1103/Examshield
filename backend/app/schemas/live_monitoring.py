from pydantic import BaseModel, ConfigDict, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.enums import AttemptStatus

class LiveViolationEvent(BaseModel):
    id: UUID4
    event_type: str
    severity: str
    timestamp: datetime
    event_data: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class LiveStudentSessionResponse(BaseModel):
    attempt_id: UUID4
    student_id: UUID4
    student_name: str
    roll_no: Optional[str] = None
    department: Optional[str] = None
    status: AttemptStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    integrity_score: float = 100.0
    answered_questions: int = 0
    total_questions: int = 0
    violations_count: int = 0
    recent_events: List[LiveViolationEvent] = []

    model_config = ConfigDict(from_attributes=True)


class LiveExamMonitoringResponse(BaseModel):
    exam_id: UUID4
    exam_title: str
    exam_code: str
    active_count: int
    sessions: List[LiveStudentSessionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class LiveActiveStudentItem(BaseModel):
    student_id: UUID4
    student_name: str
    email: str
    roll_no: Optional[str] = None
    department: Optional[str] = None
    attempt_id: UUID4
    started_at: Optional[datetime] = None
    status: str
    violations_count: int = 0
    integrity_score: float = 100.0

    model_config = ConfigDict(from_attributes=True)


class LiveExamOverviewItem(BaseModel):
    exam_id: UUID4
    exam_title: str
    exam_code: str
    subject: Optional[str] = None
    status: str
    duration_minutes: int = 60
    total_marks: int = 100
    active_count: int = 0
    total_enrolled: int = 0
    students: List[LiveActiveStudentItem] = []

    model_config = ConfigDict(from_attributes=True)


class LiveMonitoringOverviewResponse(BaseModel):
    total_active_students: int
    active_exams_count: int
    exams: List[LiveExamOverviewItem] = []

    model_config = ConfigDict(from_attributes=True)

