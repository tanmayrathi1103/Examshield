from fastapi import FastAPI
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from app.database.session import engine
from app.models import Base
from app.api.v1.auth import router as auth_router
from app.api.v1.exams import router as exams_router, student_router as student_exams_router
from app.api.v1.questions import router as questions_router, exam_questions_router
from app.api.v1.student_attempts import router as student_attempts_router

from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI Application
app = FastAPI(
    title="ExamShield API",
    version="1.0.0",
    description="Backend API for AI Powered Online Examination and Student Behaviour Detection"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(exams_router, prefix="/api/v1")
app.include_router(student_exams_router, prefix="/api/v1")
app.include_router(questions_router, prefix="/api/v1")
app.include_router(exam_questions_router, prefix="/api/v1")
app.include_router(student_attempts_router, prefix="/api/v1/student")

@app.on_event("startup")
def startup_event():
    """Attempt PostgreSQL connection on application startup."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("Database Connected Successfully")
            
        # ONLY FOR DEVELOPMENT: Create tables automatically
        Base.metadata.create_all(bind=engine)
        print("Database Tables Created Successfully")
        
    except OperationalError as e:
        print(f"Database Connection Failed: {e}")
    except Exception as e:
        print(f"Database Connection Failed: {e}")

@app.get("/")
def read_root():
    return {"message": "ExamShield Backend Running Successfully"}
