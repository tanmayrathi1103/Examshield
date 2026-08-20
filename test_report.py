import sys, os
sys.path.insert(0, os.path.abspath('backend'))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import SessionLocal
from app.services.report_service import ReportService
import uuid

db = SessionLocal()
service = ReportService(db)
from app.models.exam import Exam
exam = db.query(Exam).first()
if exam:
    try:
        res = service.get_student_performance(exam.id)
        print('Success!')
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print('No exam found')
