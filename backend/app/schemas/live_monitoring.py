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
