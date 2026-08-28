from app.schemas.exam import StudentExamResponse
from app.models.exam import Exam
from app.core.enums import ExamStatus, AttemptStatus
import uuid
from datetime import datetime

exam = Exam(
    id=uuid.uuid4(),
    title="Test",
    exam_code="T1",
    duration_minutes=60,
    total_marks=100,
    passing_marks=40,
    status=ExamStatus.ACTIVE,
    created_by=uuid.uuid4(),
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow(),
)

# Dynamically assign
exam.student_attempt_status = AttemptStatus.SUBMITTED
exam.student_attempt_id = uuid.uuid4()

resp = StudentExamResponse.model_validate(exam)
print("Serialized:")
print(resp.model_dump())
