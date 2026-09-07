from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
import uuid
from typing import List, Optional
from sqlalchemy import func

from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.faculty_profile import FacultyProfile
from app.models.exam import Exam
from app.models.exam_attempt import ExamAttempt
from app.core.enums import UserRole
from app.schemas.user import UserRegister, UserUpdate
from app.schemas.admin import StudentDirectoryItem, FacultyDirectoryItem
from app.core.security import hash_password

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        email_lower = email.lower()
        return self.db.query(User).filter(User.email == email_lower, User.is_deleted == False).first()

    def get_user_by_phone(self, phone: str) -> User | None:
        return self.db.query(User).filter(User.phone_number == phone, User.is_deleted == False).first()

    def get_user_by_uuid(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id, User.is_deleted == False).first()

    def create_user(self, user_in: UserRegister) -> User:
        user = User(
            full_name=user_in.full_name,
            email=user_in.email.lower(),
            phone_number=user_in.phone_number,
            role=user_in.role,
            profile_picture=user_in.profile_picture,
            password_hash=hash_password(user_in.password)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_last_login(self, user: User) -> None:
        user.last_login = datetime.now(timezone.utc)
        self.db.add(user)
        self.db.commit()

    def soft_delete_user(self, user: User) -> None:
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.db.add(user)
        self.db.commit()

    def toggle_user_status(self, user_id: uuid.UUID, is_active: bool) -> User:
        user = self.get_user_by_uuid(user_id)
        if not user:
            raise ValueError("User not found")
        user.is_active = is_active
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_students_directory(self) -> List[StudentDirectoryItem]:
        students = (
            self.db.query(User)
            .options(joinedload(User.student_profile))
            .filter(User.role == UserRole.STUDENT, User.is_deleted == False)
            .order_by(User.created_at.desc())
            .all()
        )

        # Pre-query average risk scores for all students from attempts
        avg_risk_scores = dict(
            self.db.query(
                ExamAttempt.student_id,
                func.avg(ExamAttempt.risk_score)
            )
            .group_by(ExamAttempt.student_id)
            .all()
        )

        items: List[StudentDirectoryItem] = []
        for s in students:
            profile = s.student_profile
            roll_no = profile.enrollment_number if profile and profile.enrollment_number else f"ROLL-{str(s.id)[:6].upper()}"
            dept = profile.branch.value if profile and profile.branch else "CSE"
            sem = profile.semester.value if profile and profile.semester else None
            year = profile.year if profile and profile.year else None

            # Calculate integrity score: 100 - risk_score
            raw_risk = avg_risk_scores.get(s.id)
            if raw_risk is not None:
                integrity_score = round(max(0.0, min(100.0, 100.0 - float(raw_risk))), 1)
            else:
                integrity_score = 100.0

            status_str = "active" if s.is_active else "suspended"

            items.append(
                StudentDirectoryItem(
                    id=s.id,
                    name=s.full_name,
                    email=s.email,
                    phone_number=s.phone_number,
                    roll_no=roll_no,
                    department=dept,
                    semester=sem,
                    year=year,
                    integrity_score=integrity_score,
                    status=status_str,
                    created_at=s.created_at
                )
            )
        return items

    def get_faculty_directory(self) -> List[FacultyDirectoryItem]:
        faculties = (
            self.db.query(User)
            .options(joinedload(User.faculty_profile))
            .filter(User.role == UserRole.FACULTY, User.is_deleted == False)
            .order_by(User.created_at.desc())
            .all()
        )

        items: List[FacultyDirectoryItem] = []
        for f in faculties:
            profile = f.faculty_profile
            emp_id = profile.employee_id if profile and profile.employee_id else f"FAC-{str(f.id)[:6].upper()}"
            dept = profile.department if profile and profile.department else "Computer Science"
            designation = profile.designation if profile and profile.designation else "Assistant Professor"

            # Get exams created by this faculty
            exams = self.db.query(Exam.title).filter(Exam.created_by == f.id, Exam.is_deleted == False).all()
            assigned_courses = [e[0] for e in exams]
            if not assigned_courses:
                assigned_courses = ["Computer Science", "Algorithms"]

            status_str = "active" if f.is_active else "suspended"

            items.append(
                FacultyDirectoryItem(
                    id=f.id,
                    name=f.full_name,
                    email=f.email,
                    phone_number=f.phone_number,
                    employee_id=emp_id,
                    department=dept,
                    designation=designation,
                    assigned_courses=assigned_courses,
                    status=status_str,
                    created_at=f.created_at
                )
            )
        return items
