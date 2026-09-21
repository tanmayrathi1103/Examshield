from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.exam import Exam
from app.models.exam_assignment import ExamAssignment
from app.models.exam_attempt import ExamAttempt
from app.core.enums import UserRole, ExamStatus, AssignmentStatus, AttemptStatus
from app.models.question import Question, QuestionOption
import uuid
from datetime import datetime, timezone

def test_submission():
    db = SessionLocal()
    # Create a mock student
    student = User(
        id=uuid.uuid4(),
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password="fake",
        full_name="Test Student",
        role=UserRole.STUDENT
    )
    db.add(student)
    
    # Create a mock exam
    exam = Exam(
        id=uuid.uuid4(),
        title="Test Exam",
        exam_code="TEST101",
        subject="Testing",
        status=ExamStatus.ACTIVE,
        duration_minutes=60,
        total_marks=10,
        passing_marks=5
    )
    db.add(exam)
    
    # Create a mock question
    question = Question(
        id=uuid.uuid4(),
        exam_id=exam.id,
        question_text="What is 2+2?",
        question_type="mcq",
        marks=10
    )
    db.add(question)
    
    # Create options
    opt1 = QuestionOption(id=uuid.uuid4(), question_id=question.id, option_text="4", is_correct=True)
    db.add(opt1)
    
    # Create assignment
    assignment = ExamAssignment(
        id=uuid.uuid4(),
        exam_id=exam.id,
        student_id=student.id,
        status=AssignmentStatus.STARTED
    )
    db.add(assignment)
    db.commit()

    # Now create attempt via service to ensure proper state
    from app.services.attempt_service import AttemptService
    service = AttemptService(db)
    attempt = service.get_or_create_attempt(student.id, exam.id, is_verification_step=True)
    
    # Answer the question
    from app.schemas.attempt import StudentAnswerUpdate
    service.update_answer(attempt.id, question.id, StudentAnswerUpdate(selected_option="4"))
    
    # Now simulate the endpoint
    print("Calling submit_attempt...")
    try:
        service.submit_attempt(attempt.id)
        print("Success! Attempt status:", attempt.status)
        print("Attempt score:", attempt.score)
    except Exception as e:
        print("FAILED WITH EXCEPTION:")
        import traceback
        traceback.print_exc()
        
    db.close()

if __name__ == "__main__":
    test_submission()
