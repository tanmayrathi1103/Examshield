from pydantic import BaseModel, Field, UUID4, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.enums import AttemptStatus, AttemptEventType

class StudentAnswerBase(BaseModel):
    question_id: UUID4
    selected_option: Optional[str] = None
    descriptive_answer: Optional[str] = None
    is_marked_for_review: bool = False
    is_answered: bool = False

class StudentAnswerCreate(StudentAnswerBase):
    pass

class StudentAnswerUpdate(BaseModel):
    selected_option: Optional[str] = None
    descriptive_answer: Optional[str] = None
    is_marked_for_review: Optional[bool] = None

class StudentAnswerResponse(StudentAnswerBase):
    id: UUID4
    attempt_id: UUID4
    answered_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class AttemptEventCreate(BaseModel):
    event_type: AttemptEventType
    event_data: Optional[Dict[str, Any]] = None

class AttemptEventResponse(AttemptEventCreate):
    id: UUID4
    attempt_id: UUID4
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ExamAttemptBase(BaseModel):
    status: AttemptStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    score: Optional[float] = None
    percentage: Optional[float] = None
    total_questions: int = 0
    answered_questions: int = 0
    
    # AI Fields
    risk_score: Optional[float] = None
    face_verified: Optional[bool] = None
    fullscreen_status: Optional[bool] = None
    camera_status: Optional[bool] = None

class ExamAttemptCreate(BaseModel):
    exam_id: UUID4

class ExamAttemptResponse(ExamAttemptBase):
    id: UUID4
    assignment_id: UUID4
    student_id: UUID4
    exam_id: UUID4
    answers: List[StudentAnswerResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class ExamAttemptSummary(BaseModel):
    id: UUID4
    status: AttemptStatus
    score: Optional[float]
    percentage: Optional[float]
    total_questions: int
    answered_questions: int
    submitted_at: Optional[datetime]
    risk_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class StudentExamHistoryItem(BaseModel):
    attempt_id: UUID4
    exam_id: UUID4
    title: str
    exam_code: str
    subject: str
    duration_minutes: int
    status: AttemptStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    total_marks: float = 0.0
    passing_marks: float = 0.0
    percentage: Optional[float] = None
    result: str = "PENDING"
    integrity_score: float = 100.0
    violations_count: int = 0
    total_questions: int = 0
    answered_questions: int = 0

    model_config = ConfigDict(from_attributes=True)

