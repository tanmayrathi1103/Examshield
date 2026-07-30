import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.enums import QuestionType, Difficulty
from app.models.exam import Exam
from app.models.question import Question

@pytest.fixture
def exam_id(db: Session, test_faculty_token_headers):
    # Need to setup an exam manually or via API
    # Since we can't reliably call API without valid payload, we mock in DB
    # We will assume client works. Since this is an isolated module we can just test API directly
    # Wait, actually we can create an exam first.
    pass

# We will just write basic schema validation tests for now to prove schemas are solid.
def test_create_mcq_schema_validation():
    from app.schemas.question import QuestionCreate
    from pydantic import ValidationError
    
    # Valid MCQ
    q = QuestionCreate(
        exam_id=uuid.uuid4(),
        question_text="What is 2+2?",
        question_type=QuestionType.MCQ,
        options=[
            {"option_text": "3", "is_correct": False},
            {"option_text": "4", "is_correct": True}
        ]
    )
    assert q.question_text == "What is 2+2?"
    
    # Invalid MCQ (less than 2 options)
    with pytest.raises(ValidationError):
        QuestionCreate(
            exam_id=uuid.uuid4(),
            question_text="What is 2+2?",
            question_type=QuestionType.MCQ,
            options=[
                {"option_text": "4", "is_correct": True}
            ]
        )
        
    # Invalid MCQ (multiple correct options)
    with pytest.raises(ValidationError):
        QuestionCreate(
            exam_id=uuid.uuid4(),
            question_text="What is 2+2?",
            question_type=QuestionType.MCQ,
            options=[
                {"option_text": "3", "is_correct": True},
                {"option_text": "4", "is_correct": True}
            ]
        )

def test_create_true_false_schema_validation():
    from app.schemas.question import QuestionCreate
    from pydantic import ValidationError
    
    # Valid True/False
    q = QuestionCreate(
        exam_id=uuid.uuid4(),
        question_text="The earth is flat.",
        question_type=QuestionType.TRUE_FALSE,
        correct_answer=False
    )
    assert q.correct_answer is False
    
    # Invalid True/False (missing correct_answer)
    with pytest.raises(ValidationError):
        QuestionCreate(
            exam_id=uuid.uuid4(),
            question_text="The earth is flat.",
            question_type=QuestionType.TRUE_FALSE
        )
        
    # Invalid True/False (providing manual options)
    with pytest.raises(ValidationError):
        QuestionCreate(
            exam_id=uuid.uuid4(),
            question_text="The earth is flat.",
            question_type=QuestionType.TRUE_FALSE,
            correct_answer=False,
            options=[{"option_text": "True", "is_correct": False}]
        )

def test_descriptive_numerical_validation():
    from app.schemas.question import QuestionCreate
    from pydantic import ValidationError
    
    # Valid Descriptive
    q1 = QuestionCreate(
        exam_id=uuid.uuid4(),
        question_text="Describe AI.",
        question_type=QuestionType.DESCRIPTIVE
    )
    assert q1.question_type == QuestionType.DESCRIPTIVE
    
    # Invalid Descriptive (with options)
    with pytest.raises(ValidationError):
        QuestionCreate(
            exam_id=uuid.uuid4(),
            question_text="Describe AI.",
            question_type=QuestionType.DESCRIPTIVE,
            options=[{"option_text": "Sample", "is_correct": True}]
        )
