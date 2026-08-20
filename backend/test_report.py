import sys, os
sys.path.insert(0, os.path.abspath('.'))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import SessionLocal
from app.services.report_service import ReportService
import uuid

db = SessionLocal()
service = ReportService(db)
from app.models.exam import Exam
# Let's get the specific exam id the user tried
exam_id = uuid.UUID("6a10fcc6-7350-40d1-9d4c-d59ff302a537")
exam = db.query(Exam).filter(Exam.id == exam_id).first()
if exam:
    print(f"Testing exam {exam.title} ({exam_id})")
    try:
        res = service.get_student_performance(exam.id)
        print('Success!')
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print('No exam found with that ID')
