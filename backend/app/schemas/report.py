from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid
from app.core.enums import AttemptStatus

class ExamReportSummary(BaseModel):
    exam_id: uuid.UUID
    title: str
    subject: Optional[str]
    exam_code: Optional[str]
    duration_minutes: Optional[int]
    total_marks: float
    passing_marks: float
    status: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    
    total_assigned: int
    total_attempted: int
    total_submitted: int
    total_auto_submitted: int
    total_not_attempted: int
    total_passed: int
    total_failed: int
    
    average_score: float
    highest_score: float
    lowest_score: float
    average_percentage: float
    pass_percentage: float
    completion_percentage: float
    
    average_time_taken_mins: float
    fastest_attempt_mins: float
    longest_attempt_mins: float
    
    total_questions: int
    objective_questions: int
    descriptive_questions: int
    average_question_accuracy: float
    
    model_config = ConfigDict(from_attributes=True)


class StudentPerformanceRecord(BaseModel):
    student_id: uuid.UUID
    name: str
    enrollment_number: Optional[str]
    branch: Optional[str]
    semester: Optional[str]
    
    attempt_id: Optional[uuid.UUID]
    attempt_status: Optional[AttemptStatus]
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    time_taken_mins: Optional[float]
    
    marks_obtained: Optional[float]
    total_marks: float
    percentage: Optional[float]
    result: str # "PASS", "FAIL", "NOT_ATTEMPTED", "PENDING"
    submission_type: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)


class StudentExamPerformanceResponse(BaseModel):
    exam_id: uuid.UUID
    students: List[StudentPerformanceRecord]
    
    model_config = ConfigDict(from_attributes=True)


class QuestionDetailReport(BaseModel):
    question_id: uuid.UUID
    question_number: int
    question_text: str
    question_type: str
    marks: float
    
    student_answer: Optional[str]
    correct_answer: Optional[str]
    marks_obtained: float
    evaluation_status: str
    
    model_config = ConfigDict(from_attributes=True)


class StudentDetailReportResponse(BaseModel):
    student: StudentPerformanceRecord
    questions: List[QuestionDetailReport]
    
    model_config = ConfigDict(from_attributes=True)


class QuestionPerformanceRecord(BaseModel):
    question_id: uuid.UUID
    question_number: int
    question_text: str
    question_type: str
    max_marks: float
    
    attempted_count: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    accuracy_percentage: float
    average_marks: float
    difficulty_level: str
    
    model_config = ConfigDict(from_attributes=True)


class QuestionAnalyticsResponse(BaseModel):
    exam_id: uuid.UUID
    questions: List[QuestionPerformanceRecord]
    
    model_config = ConfigDict(from_attributes=True)
