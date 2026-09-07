import uuid
from datetime import datetime, timezone, timedelta
from app.database.session import SessionLocal
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.faculty_profile import FacultyProfile
from app.models.admin_profile import AdminProfile
from app.models.exam import Exam
from app.models.exam_assignment import ExamAssignment
from app.models.exam_attempt import ExamAttempt
from app.models.attempt_event import AttemptEvent
from app.core.enums import UserRole, Branch, Semester, ExamStatus, AttemptStatus, AttemptEventType, AssignmentStatus
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        print("Starting Demo Data Seeding for ExamShield...")

        # 1. Admin
        admin = db.query(User).filter(User.email == "admin@examshield.ai").first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                full_name="System Administrator",
                email="admin@examshield.ai",
                phone_number="9999990001",
                password_hash=hash_password("Admin@123456"),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.flush()
            admin_prof = AdminProfile(user_id=admin.id, admin_level=1)
            db.add(admin_prof)
            print("Created Admin user: admin@examshield.ai")

        # 2. Faculty
        faculty_data = [
            ("Dr. Harsh Dhawale", "harsh.dhawale@examshield.ai", "9999990002", "FAC-001", "Computer Science", "Associate Professor"),
            ("Prof. Sarah Thomas", "sarah.thomas@examshield.ai", "9999990003", "FAC-002", "Electronics & Communication", "Assistant Professor"),
            ("Dr. Vikram Rao", "vikram.rao@examshield.ai", "9999990004", "FAC-003", "Computer Science", "Professor"),
        ]
        fac_objs = []
        for name, email, phone, emp_id, dept, desig in faculty_data:
            fac = db.query(User).filter(User.email == email).first()
            if not fac:
                fac = User(
                    id=uuid.uuid4(),
                    full_name=name,
                    email=email,
                    phone_number=phone,
                    password_hash=hash_password("Faculty@123456"),
                    role=UserRole.FACULTY,
                    is_active=True,
                    is_verified=True
                )
                db.add(fac)
                db.flush()
                prof = FacultyProfile(
                    user_id=fac.id,
                    employee_id=emp_id,
                    department=dept,
                    designation=desig
                )
                db.add(prof)
                print(f"Created Faculty: {email}")
            fac_objs.append(fac)

        # 3. Students
        student_data = [
            ("Tanmay Rathi", "tanmay.rathi@examshield.ai", "9999990010", "CSE2201", Branch.CSE, Semester.SEM_6, 3, True, 94.0),
            ("Akshita Nipane", "akshita.nipane@examshield.ai", "9999990011", "CSE2202", Branch.CSE, Semester.SEM_6, 3, True, 85.0),
            ("Kabir Singh", "kabir.singh@examshield.ai", "9999990012", "CSE2203", Branch.CSE, Semester.SEM_6, 3, False, 45.0),
            ("Akshad Jaiswal", "akshad.jaiswal@examshield.ai", "9999990013", "ECE2210", Branch.ECE, Semester.SEM_6, 3, True, 98.0),
            ("Mrunal Samrutwar", "mrunal.samrutwar@examshield.ai", "9999990014", "CSE2205", Branch.CSE, Semester.SEM_6, 3, True, 72.0),
        ]
        student_objs = []
        for name, email, phone, roll, branch, sem, year, active, target_trust in student_data:
            stu = db.query(User).filter(User.email == email).first()
            if not stu:
                stu = User(
                    id=uuid.uuid4(),
                    full_name=name,
                    email=email,
                    phone_number=phone,
                    password_hash=hash_password("Student@123456"),
                    role=UserRole.STUDENT,
                    is_active=active,
                    is_verified=True
                )
                db.add(stu)
                db.flush()
                prof = StudentProfile(
                    user_id=stu.id,
                    enrollment_number=roll,
                    branch=branch,
                    semester=sem,
                    year=year
                )
                db.add(prof)
                print(f"Created Student: {email}")
            student_objs.append((stu, target_trust))

        db.commit()

        # 4. Exams
        primary_fac = fac_objs[0]
        exam1 = db.query(Exam).filter(Exam.title == "Data Structures and Algorithms").first()
        if not exam1:
            exam1 = Exam(
                id=uuid.uuid4(),
                title="Data Structures and Algorithms",
                description="Comprehensive midterm test covering trees, graphs, and dynamic programming.",
                subject="Computer Science",
                exam_code="CS201",
                created_by=primary_fac.id,
                duration_minutes=90,
                start_time=datetime.now(timezone.utc) - timedelta(hours=2),
                end_time=datetime.now(timezone.utc) + timedelta(hours=2),
                total_marks=100,
                passing_marks=40,
                status=ExamStatus.ACTIVE
            )
            db.add(exam1)

        exam2 = db.query(Exam).filter(Exam.title == "Artificial Intelligence & Neural Networks").first()
        if not exam2:
            exam2 = Exam(
                id=uuid.uuid4(),
                title="Artificial Intelligence & Neural Networks",
                description="End-semester proctored exam on Deep Learning and Computer Vision.",
                subject="Computer Science",
                exam_code="CS402",
                created_by=primary_fac.id,
                duration_minutes=120,
                start_time=datetime.now(timezone.utc) + timedelta(days=1),
                end_time=datetime.now(timezone.utc) + timedelta(days=1, hours=3),
                total_marks=100,
                passing_marks=40,
                status=ExamStatus.SCHEDULED
            )
            db.add(exam2)
        db.commit()

        # 5. Exam Assignments, Attempts, and Violation Events for Exam 1
        now = datetime.now(timezone.utc)
        for stu, target_trust in student_objs:
            assignment = db.query(ExamAssignment).filter(
                ExamAssignment.exam_id == exam1.id,
                ExamAssignment.student_id == stu.id
            ).first()

            if not assignment:
                assignment = ExamAssignment(
                    id=uuid.uuid4(),
                    exam_id=exam1.id,
                    student_id=stu.id,
                    assignment_status=AssignmentStatus.STARTED
                )
                db.add(assignment)
                db.flush()

            existing_attempt = db.query(ExamAttempt).filter(
                ExamAttempt.exam_id == exam1.id,
                ExamAttempt.student_id == stu.id
            ).first()

            if not existing_attempt:
                attempt = ExamAttempt(
                    id=uuid.uuid4(),
                    assignment_id=assignment.id,
                    exam_id=exam1.id,
                    student_id=stu.id,
                    status=AttemptStatus.IN_PROGRESS if stu.is_active else AttemptStatus.PAUSED,
                    started_at=now - timedelta(minutes=35),
                    risk_score=max(0.0, 100.0 - target_trust),
                    face_verified=True,
                    fullscreen_status=True,
                    camera_status=True
                )
                db.add(attempt)
                db.flush()

                # Add specific violations depending on target trust
                if target_trust < 90:
                    # Eye deviation
                    ev1 = AttemptEvent(
                        id=uuid.uuid4(),
                        attempt_id=attempt.id,
                        event_type=AttemptEventType.LOOKING_AWAY,
                        event_data={"confidence": 0.88, "resolved": False, "reason": "Pupil deviation beyond boundary"},
                        timestamp=now - timedelta(minutes=25)
                    )
                    db.add(ev1)

                if target_trust < 80:
                    # Tab switch
                    ev2 = AttemptEvent(
                        id=uuid.uuid4(),
                        attempt_id=attempt.id,
                        event_type=AttemptEventType.TAB_SWITCH,
                        event_data={"confidence": 1.0, "resolved": True, "reason": "Browser tab lost focus"},
                        timestamp=now - timedelta(minutes=20)
                    )
                    db.add(ev2)

                if target_trust <= 50:
                    # Phone detected & Multiple Faces
                    ev3 = AttemptEvent(
                        id=uuid.uuid4(),
                        attempt_id=attempt.id,
                        event_type=AttemptEventType.PHONE_DETECTED,
                        event_data={"confidence": 0.96, "resolved": False, "reason": "Cell phone device detected in camera frame"},
                        timestamp=now - timedelta(minutes=15)
                    )
                    ev4 = AttemptEvent(
                        id=uuid.uuid4(),
                        attempt_id=attempt.id,
                        event_type=AttemptEventType.MULTIPLE_FACES,
                        event_data={"confidence": 0.92, "resolved": False, "reason": "Secondary person detected in background"},
                        timestamp=now - timedelta(minutes=10)
                    )
                    db.add(ev3)
                    db.add(ev4)

        db.commit()
        print("Demo Data Seeding Completed Successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
