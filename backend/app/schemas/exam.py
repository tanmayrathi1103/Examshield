from pydantic import BaseModel, Field, validator, model_validator
from datetime import datetime
from typing import Optional, List, Any, Dict
import uuid
from app.core.enums import ExamStatus, AssignmentStatus, AttemptStatus


class ExamBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=100)
    exam_code: str = Field(..., max_length=50)
    duration_minutes: int = Field(..., gt=0)
    total_marks: int = Field(..., gt=0)
    passing_marks: int = Field(..., ge=0)
    instructions: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    @model_validator(mode='after')
    def validate_marks(self) -> 'ExamBase':
        if self.passing_marks > self.total_marks:
            raise ValueError('passing_marks cannot be greater than total_marks')
        return self

    @model_validator(mode='after')
    def validate_dates(self) -> 'ExamBase':
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValueError('end_time must be strictly after start_time')
        return self

    @validator('start_time', 'end_time', pre=False)
    def make_naive_utc(cls, v):
        if v and v.tzinfo:
            from datetime import timezone
            v = v.astimezone(timezone.utc).replace(tzinfo=None)
        return v

    @validator('exam_code')
    def normalize_exam_code(cls, v):
        return v.strip().upper()


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=100)
    duration_minutes: Optional[int] = Field(None, gt=0)
    total_marks: Optional[int] = Field(None, gt=0)
    passing_marks: Optional[int] = Field(None, ge=0)
    instructions: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[ExamStatus] = None

    @validator('start_time', 'end_time', pre=False)
    def make_naive_utc(cls, v):
        if v and v.tzinfo:
            from datetime import timezone
            v = v.astimezone(timezone.utc).replace(tzinfo=None)
        return v


class ExamResponse(ExamBase):
    id: uuid.UUID
    status: ExamStatus
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def ensure_timezone(self) -> 'ExamResponse':
        from datetime import timezone
        if getattr(self, 'start_time', None) and self.start_time.tzinfo is None:
            self.start_time = self.start_time.replace(tzinfo=timezone.utc)
        if getattr(self, 'end_time', None) and self.end_time.tzinfo is None:
            self.end_time = self.end_time.replace(tzinfo=timezone.utc)
        if getattr(self, 'created_at', None) and self.created_at.tzinfo is None:
            self.created_at = self.created_at.replace(tzinfo=timezone.utc)
        if getattr(self, 'updated_at', None) and self.updated_at.tzinfo is None:
            self.updated_at = self.updated_at.replace(tzinfo=timezone.utc)
        return self


class ExamListResponse(BaseModel):
    items: List[ExamResponse]
    total: int


class StudentExamResponse(ExamResponse):
    student_attempt_status: Optional[AttemptStatus] = None
    student_attempt_id: Optional[uuid.UUID] = None

class StudentExamListResponse(BaseModel):
    items: List[StudentExamResponse]
    total: int


class ExamAssignmentBase(BaseModel):
    exam_id: uuid.UUID
    student_id: uuid.UUID


class ExamAssignmentCreate(ExamAssignmentBase):
    pass


class ExamAssignmentResponse(ExamAssignmentBase):
    id: uuid.UUID
    assigned_at: datetime
    assignment_status: AssignmentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExamAssignmentListResponse(BaseModel):
    items: List[ExamAssignmentResponse]
    total: int


# Student data for assignment modal
class StudentForAssignment(BaseModel):
    id: str
    full_name: str
    email: str
    enrollment_number: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    is_assigned: bool = False


class StudentForAssignmentList(BaseModel):
    items: List[StudentForAssignment]
    total: int


# Faculty dashboard statistics
class ExamStatsResponse(BaseModel):
    total_exams: int = 0
    draft_exams: int = 0
    active_exams: int = 0
    scheduled_exams: int = 0
    completed_exams: int = 0
    total_questions: int = 0
    students_assigned: int = 0
    completed_attempts: int = 0
