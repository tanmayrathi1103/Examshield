from pydantic import BaseModel, Field, validator, model_validator
from datetime import datetime
from typing import Optional, List
import uuid
from app.core.enums import ExamStatus, AssignmentStatus

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

class ExamResponse(ExamBase):
    id: uuid.UUID
    status: ExamStatus
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExamListResponse(BaseModel):
    items: List[ExamResponse]
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
