from typing import Optional, Tuple
from app.models.student_answer import StudentAnswer
from app.models.question import Question
from app.core.enums import QuestionType

class EvaluationService:
    @staticmethod
    def evaluate_answer(answer: StudentAnswer, question: Question) -> Tuple[str, float]:
        """
        Evaluates a single student answer against a question.
        Returns:
            Tuple[str, float]: (Status string, marks obtained)
            Status can be 'Correct', 'Incorrect', 'Unanswered', or 'Pending Manual Evaluation'
        """
        if not answer.is_answered:
            return "Unanswered", 0.0

        if question.question_type in [QuestionType.MCQ, QuestionType.TRUE_FALSE]:
            if answer.selected_option:
                correct_opts = [opt.option_text for opt in question.options if opt.is_correct]
                if answer.selected_option in correct_opts:
                    return "Correct", float(question.marks)
                else:
                    return "Incorrect", float(-(question.negative_marks or 0.0))
            else:
                return "Unanswered", 0.0
        
        # Descriptive or other types
        return "Pending Manual Evaluation", 0.0
