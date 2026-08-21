import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question
from app.core.security import hash_password, create_access_token
from app.core.enums import UserRole

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(scope="function")
def db():
    db_session = SessionLocal()
    
    yield db_session
    
    # Teardown: Clean up created exams, questions, and users to prevent collision
    try:
        db_session.query(Question).delete()
        db_session.query(Exam).filter(Exam.exam_code.like("CS101-%") | Exam.exam_code.like("INV-%") | Exam.exam_code.like("STU-%")).delete()
        db_session.query(User).filter(User.email.like("test_faculty_%") | User.email.like("test_student_%")).delete()
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        print(f"Teardown error: {e}")
    db_session.close()

@pytest.fixture(scope="function")
def test_faculty_token(db):
    unique_id = uuid.uuid4()
    email = f"test_faculty_{unique_id.hex[:8]}@example.com"
    pwd_hash = hash_password("Password123!")
    user = User(
        id=unique_id,
        full_name="Test Faculty",
        email=email,
        phone_number=f"+1555{unique_id.hex[:7]}",
        password_hash=pwd_hash,
        role=UserRole.FACULTY,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(subject=str(user.id))
    return token

@pytest.fixture(scope="function")
def test_student_token(db):
    unique_id = uuid.uuid4()
    email = f"test_student_{unique_id.hex[:8]}@example.com"
    pwd_hash = hash_password("Password123!")
    user = User(
        id=unique_id,
        full_name="Test Student",
        email=email,
        phone_number=f"+1555{unique_id.hex[:7]}",
        password_hash=pwd_hash,
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(subject=str(user.id))
    return token

@pytest.fixture(scope="function")
def test_faculty_token_headers(test_faculty_token):
    return {"Authorization": f"Bearer {test_faculty_token}"}
