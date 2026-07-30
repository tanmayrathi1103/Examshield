from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime
import uuid
from app.core.enums import QuestionType, Difficulty

class QuestionOptionBase(BaseModel):
    option_label: Optional[str] = Field(None, max_length=5)
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False
    display_order: int = Field(default=1, gt=0)

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionUpdate(BaseModel):
    option_label: Optional[str] = Field(None, max_length=5)
    option_text: Optional[str] = Field(None, min_length=1)
    is_correct: Optional[bool] = None
    display_order: Optional[int] = Field(None, gt=0)

class QuestionOptionResponse(QuestionOptionBase):
    id: uuid.UUID
    question_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    exam_id: uuid.UUID
    question_text: str = Field(..., min_length=1)
    question_type: QuestionType
    marks: int = Field(default=1, gt=0)
    negative_marks: int = Field(default=0, ge=0)
    difficulty: Difficulty = Difficulty.MEDIUM
    image_url: Optional[str] = Field(None, max_length=500)
    explanation: Optional[str] = None
    order_number: int = Field(default=1, gt=0)
    is_required: bool = True
    is_active: bool = True

class QuestionCreate(QuestionBase):
    options: Optional[List[QuestionOptionCreate]] = None
    correct_answer: Optional[bool] = None # Used for True/False questions

    @model_validator(mode='after')
    def validate_options(self) -> 'QuestionCreate':
        q_type = self.question_type
        
        if q_type == QuestionType.MCQ:
            if not self.options or len(self.options) < 2:
                raise ValueError("MCQ questions must contain at least two options")
            
            correct_options = [opt for opt in self.options if opt.is_correct]
            if len(correct_options) != 1:
                raise ValueError("MCQ questions must have exactly one correct option")
                
        elif q_type == QuestionType.TRUE_FALSE:
            if self.options:
                raise ValueError("True/False questions should not manually specify options, use 'correct_answer' boolean instead")
            if self.correct_answer is None:
                raise ValueError("True/False questions require 'correct_answer' field")
                
        elif q_type in (QuestionType.DESCRIPTIVE, QuestionType.NUMERICAL):
            if self.options and len(self.options) > 0:
                raise ValueError(f"{q_type.value} questions must not have options")
                
        return self


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = Field(None, min_length=1)
    question_type: Optional[QuestionType] = None
    marks: Optional[int] = Field(None, gt=0)
    negative_marks: Optional[int] = Field(None, ge=0)
    difficulty: Optional[Difficulty] = None
    image_url: Optional[str] = Field(None, max_length=500)
    explanation: Optional[str] = None
    order_number: Optional[int] = Field(None, gt=0)
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None
    options: Optional[List[QuestionOptionCreate]] = None
    correct_answer: Optional[bool] = None

class QuestionResponse(QuestionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    options: List[QuestionOptionResponse] = []

    class Config:
        from_attributes = True

class QuestionListResponse(BaseModel):
    items: List[QuestionResponse]
    total: int

class BulkQuestionCreate(BaseModel):
    exam_id: uuid.UUID
    questions: List[QuestionCreate]

class QuestionImportResponse(BaseModel):
    total_imported: int
    total_failed: int
    errors: List[str] = []

class QuestionReorderItem(BaseModel):
    question_id: uuid.UUID
    order_number: int = Field(..., gt=0)

class QuestionReorderRequest(BaseModel):
    items: List[QuestionReorderItem]
