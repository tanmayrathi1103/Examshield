from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from typing import List, Optional, Tuple
from datetime import datetime, timezone
import uuid

from app.models.exam import Exam
from app.models.exam_assignment import ExamAssignment
from app.models.exam_attempt import ExamAttempt
from app.models.student_answer import StudentAnswer
from app.models.question import Question, QuestionOption
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.core.enums import AttemptStatus, QuestionType
from app.schemas.report import (
    ExamReportSummary,
    StudentExamPerformanceResponse,
    StudentPerformanceRecord,
    StudentDetailReportResponse,
    QuestionDetailReport,
    QuestionAnalyticsResponse,
    QuestionPerformanceRecord
)
from app.services.evaluation_service import EvaluationService

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_exam_summary(self, exam_id: uuid.UUID) -> ExamReportSummary:
        exam = self.db.get(Exam, exam_id)
        if not exam:
            raise ValueError("Exam not found")

        # Assignments
        assignments = self.db.scalars(
            select(ExamAssignment).where(
                and_(ExamAssignment.exam_id == exam_id, ExamAssignment.is_deleted == False)
            )
        ).all()
        total_assigned = len(assignments)

        # Attempts
        attempts = self.db.scalars(
            select(ExamAttempt).where(
                and_(ExamAttempt.exam_id == exam_id, ExamAttempt.is_deleted == False)
            )
        ).all()
        
        total_attempted = len(attempts)
        total_not_attempted = total_assigned - total_attempted
        
        submitted_attempts = [a for a in attempts if a.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]]
        
        total_submitted = sum(1 for a in submitted_attempts if a.status == AttemptStatus.SUBMITTED)
        total_auto_submitted = sum(1 for a in submitted_attempts if a.status == AttemptStatus.AUTO_SUBMITTED)
        
        total_passed = 0
        total_failed = 0
        scores = []
        percentages = []
        time_taken_mins = []
        
        for a in submitted_attempts:
            if a.score is not None:
                scores.append(a.score)
                percentages.append(a.percentage or 0.0)
                if a.score >= (exam.passing_marks or 0.0):
                    total_passed += 1
                else:
                    total_failed += 1
                    
            if a.started_at and a.submitted_at:
                delta = a.submitted_at - a.started_at
                time_taken_mins.append(delta.total_seconds() / 60.0)
                
        average_score = sum(scores) / len(scores) if scores else 0.0
        highest_score = max(scores) if scores else 0.0
        lowest_score = min(scores) if scores else 0.0
        average_percentage = sum(percentages) / len(percentages) if percentages else 0.0
        pass_percentage = (total_passed / len(submitted_attempts) * 100) if submitted_attempts else 0.0
        completion_percentage = (len(submitted_attempts) / total_assigned * 100) if total_assigned else 0.0
        
        average_time = sum(time_taken_mins) / len(time_taken_mins) if time_taken_mins else 0.0
        fastest = min(time_taken_mins) if time_taken_mins else 0.0
        longest = max(time_taken_mins) if time_taken_mins else 0.0
        
        # Questions
        questions = self.db.scalars(
            select(Question).where(
                and_(Question.exam_id == exam_id, Question.is_deleted == False)
            )
        ).all()
        
        total_questions = len(questions)
        obj_q = sum(1 for q in questions if q.question_type in [QuestionType.MCQ, QuestionType.TRUE_FALSE])
        desc_q = total_questions - obj_q
        
        # Average Question Accuracy
        q_analytics = self.get_question_analytics(exam_id)
        if q_analytics.questions:
            average_q_accuracy = sum(q.accuracy_percentage for q in q_analytics.questions) / len(q_analytics.questions)
        else:
            average_q_accuracy = 0.0

        return ExamReportSummary(
            exam_id=exam.id,
            title=exam.title,
            subject=exam.subject,
            exam_code=exam.exam_code,
            duration_minutes=exam.duration_minutes,
            total_marks=float(exam.total_marks or 0.0),
            passing_marks=float(exam.passing_marks or 0.0),
            status=exam.status.value,
            start_time=exam.start_time,
            end_time=exam.end_time,
            total_assigned=total_assigned,
            total_attempted=total_attempted,
            total_submitted=len(submitted_attempts),
            total_auto_submitted=total_auto_submitted,
            total_not_attempted=total_not_attempted,
            total_passed=total_passed,
            total_failed=total_failed,
            average_score=average_score,
            highest_score=highest_score,
            lowest_score=lowest_score,
            average_percentage=average_percentage,
            pass_percentage=pass_percentage,
            completion_percentage=completion_percentage,
            average_time_taken_mins=average_time,
            fastest_attempt_mins=fastest,
            longest_attempt_mins=longest,
            total_questions=total_questions,
            objective_questions=obj_q,
            descriptive_questions=desc_q,
            average_question_accuracy=average_q_accuracy
        )

    def get_student_performance(self, exam_id: uuid.UUID) -> StudentExamPerformanceResponse:
        exam = self.db.get(Exam, exam_id)
        if not exam:
            raise ValueError("Exam not found")

        # Get all assignments with student and profile
        assignments = self.db.execute(
            select(ExamAssignment, User, StudentProfile)
            .join(User, ExamAssignment.student_id == User.id)
            .outerjoin(StudentProfile, User.id == StudentProfile.user_id)
            .where(and_(ExamAssignment.exam_id == exam_id, ExamAssignment.is_deleted == False))
        ).all()

        # Get attempts for these students
        attempts = {
            a.student_id: a for a in self.db.scalars(
                select(ExamAttempt).where(
                    and_(ExamAttempt.exam_id == exam_id, ExamAttempt.is_deleted == False)
                )
            ).all()
        }

        students = []
        total_marks = float(exam.total_marks or 0.0)
        passing_marks = float(exam.passing_marks or 0.0)

        for assignment, user, profile in assignments:
            attempt = attempts.get(user.id)
            
            result_status = "NOT_ATTEMPTED"
            attempt_status = None
            time_taken = None
            sub_type = None
            marks = None
            percentage = None

            if attempt:
                attempt_status = attempt.status
                if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED]:
                    sub_type = attempt.status.value
                    if attempt.score is not None:
                        marks = attempt.score
                        percentage = attempt.percentage
                        result_status = "PASS" if marks >= passing_marks else "FAIL"
                else:
                    result_status = "PENDING"
                    
                if attempt.started_at and attempt.submitted_at:
                    time_taken = (attempt.submitted_at - attempt.started_at).total_seconds() / 60.0

            students.append(StudentPerformanceRecord(
                student_id=user.id,
                name=user.full_name,
                enrollment_number=profile.enrollment_number if profile else None,
                branch=profile.branch.value if profile and profile.branch else None,
                semester=str(profile.semester.value) if profile and profile.semester else None,
                attempt_id=attempt.id if attempt else None,
                attempt_status=attempt_status,
                started_at=attempt.started_at if attempt else None,
                submitted_at=attempt.submitted_at if attempt else None,
                time_taken_mins=time_taken,
                marks_obtained=marks,
                total_marks=total_marks,
                percentage=percentage,
                result=result_status,
                submission_type=sub_type
            ))
            
        return StudentExamPerformanceResponse(exam_id=exam_id, students=students)

    def get_student_detail_report(self, exam_id: uuid.UUID, student_id: uuid.UUID) -> StudentDetailReportResponse:
        exam = self.db.get(Exam, exam_id)
        if not exam:
            raise ValueError("Exam not found")

        # Build student summary from performance endpoint (reuses logic)
        perf_data = self.get_student_performance(exam_id)
        student_record = next((s for s in perf_data.students if s.student_id == student_id), None)
        if not student_record:
            raise ValueError("Student is not assigned to this exam")
            
        attempt = self.db.scalars(
            select(ExamAttempt).where(
                and_(
                    ExamAttempt.exam_id == exam_id,
                    ExamAttempt.student_id == student_id,
                    ExamAttempt.is_deleted == False
                )
            )
        ).first()

        q_details = []
        if attempt:
            questions = self.db.scalars(
                select(Question).where(
                    and_(Question.exam_id == exam_id, Question.is_deleted == False)
                ).order_by(Question.order_number)
            ).all()
            
            # eager load options for all questions
            for q in questions:
                # the options relationship is already on Question, but accessing it may lazy load.
                # using the existing EvaluationService
                pass
                
            answers_by_q = {a.question_id: a for a in attempt.answers}
            
            for i, q in enumerate(questions):
                ans = answers_by_q.get(q.id)
                status = "Unanswered"
                marks_obtained = 0.0
                student_answer_str = None
                correct_answer_str = None
                
                if q.question_type in [QuestionType.MCQ, QuestionType.TRUE_FALSE]:
                    correct_opts = [opt.option_text for opt in q.options if opt.is_correct]
                    correct_answer_str = ", ".join(correct_opts) if correct_opts else None
                    
                if ans:
                    status, marks_obtained = EvaluationService.evaluate_answer(ans, q)
                    if ans.selected_option:
                        student_answer_str = ans.selected_option
                    elif ans.descriptive_answer:
                        student_answer_str = ans.descriptive_answer
                
                q_details.append(QuestionDetailReport(
                    question_id=q.id,
                    question_number=i + 1,
                    question_text=q.question_text,
                    question_type=q.question_type.value,
                    marks=float(q.marks),
                    student_answer=student_answer_str,
                    correct_answer=correct_answer_str,
                    marks_obtained=marks_obtained,
                    evaluation_status=status
                ))

        return StudentDetailReportResponse(
            student=student_record,
            questions=q_details
        )

    def get_question_analytics(self, exam_id: uuid.UUID) -> QuestionAnalyticsResponse:
        exam = self.db.get(Exam, exam_id)
        if not exam:
            raise ValueError("Exam not found")
            
        questions = self.db.scalars(
            select(Question).where(
                and_(Question.exam_id == exam_id, Question.is_deleted == False)
            ).order_by(Question.order_number)
        ).all()
        
        submitted_attempts = self.db.scalars(
            select(ExamAttempt).where(
                and_(
                    ExamAttempt.exam_id == exam_id, 
                    ExamAttempt.is_deleted == False,
                    ExamAttempt.status.in_([AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.EVALUATED])
                )
            )
        ).all()
        
        attempt_ids = [a.id for a in submitted_attempts]
        
        answers = []
        if attempt_ids:
            answers = self.db.scalars(
                select(StudentAnswer).where(StudentAnswer.attempt_id.in_(attempt_ids))
            ).all()
            
        answers_by_q = {}
        for ans in answers:
            if ans.question_id not in answers_by_q:
                answers_by_q[ans.question_id] = []
            answers_by_q[ans.question_id].append(ans)
            
        q_stats = []
        for i, q in enumerate(questions):
            q_answers = answers_by_q.get(q.id, [])
            
            attempted = 0
            correct = 0
            incorrect = 0
            unanswered = 0
            total_marks = 0.0
            
            for ans in q_answers:
                status, marks = EvaluationService.evaluate_answer(ans, q)
                if status == "Correct":
                    correct += 1
                    attempted += 1
                elif status == "Incorrect":
                    incorrect += 1
                    attempted += 1
                elif status == "Pending Manual Evaluation":
                    attempted += 1
                elif status == "Unanswered":
                    unanswered += 1
                    
                total_marks += marks
                
            total_students = len(submitted_attempts)
            unanswered = total_students - attempted # Unanswered is total students - attempted
            
            # Recalculate accurately based on is_answered
            unanswered_actual = sum(1 for ans in q_answers if not ans.is_answered)
            # If a student hasn't even loaded the question, they don't have an answer record possibly.
            # But attempt creation pre-populates answers. So len(q_answers) should equal total_students.
            # Thus, unanswered = unanswered_actual
            unanswered = unanswered_actual
            attempted = total_students - unanswered
            
            accuracy = 0.0
            avg_marks = 0.0
            difficulty = "Moderate"
            
            if q.question_type in [QuestionType.MCQ, QuestionType.TRUE_FALSE]:
                if attempted > 0:
                    accuracy = (correct / attempted) * 100
                elif total_students > 0:
                    accuracy = (correct / total_students) * 100
                    
                if accuracy >= 80:
                    difficulty = "Easy"
                elif accuracy >= 50:
                    difficulty = "Moderate"
                else:
                    difficulty = "Difficult"
                    
                if total_students > 0:
                    avg_marks = total_marks / total_students
            else:
                difficulty = "MANUAL_EVALUATION"
                
            q_stats.append(QuestionPerformanceRecord(
                question_id=q.id,
                question_number=i + 1,
                question_text=q.question_text,
                question_type=q.question_type.value,
                max_marks=float(q.marks),
                attempted_count=attempted,
                correct_count=correct,
                incorrect_count=incorrect,
                unanswered_count=unanswered,
                accuracy_percentage=accuracy,
                average_marks=avg_marks,
                difficulty_level=difficulty
            ))
            
        return QuestionAnalyticsResponse(exam_id=exam_id, questions=q_stats)
