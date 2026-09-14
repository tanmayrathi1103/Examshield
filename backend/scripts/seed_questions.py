import uuid
from datetime import datetime, timezone, timedelta
from app.database.session import SessionLocal
from app.models.exam import Exam
from app.models.exam_assignment import ExamAssignment
from app.models.exam_attempt import ExamAttempt
from app.models.question import Question, QuestionOption
from app.models.user import User
from app.core.enums import ExamStatus, AttemptStatus, QuestionType, Difficulty, AssignmentStatus, UserRole

def seed_questions():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        print("1. Updating exams active status and time windows...")
        
        exams = db.query(Exam).all()
        for e in exams:
            e.status = ExamStatus.ACTIVE
            e.is_deleted = False
            e.start_time = now - timedelta(days=1)
            e.end_time = now + timedelta(days=30)
            print(f"  - Exam '{e.title}' set to ACTIVE, open until {e.end_time.date()}")
        db.commit()

        print("\n2. Assigning all students to all exams...")
        students = db.query(User).filter(User.role == UserRole.STUDENT).all()
        for e in exams:
            for s in students:
                existing = db.query(ExamAssignment).filter(
                    ExamAssignment.exam_id == e.id,
                    ExamAssignment.student_id == s.id
                ).first()
                if not existing:
                    assign = ExamAssignment(
                        id=uuid.uuid4(),
                        exam_id=e.id,
                        student_id=s.id,
                        assignment_status=AssignmentStatus.ASSIGNED,
                        is_deleted=False
                    )
                    db.add(assign)
                else:
                    existing.is_deleted = False
        db.commit()
        print(f"  Assigned {len(students)} students across all {len(exams)} exams.")

        print("\n3. Resetting auto_submitted attempt for tanmayrathi student if needed...")
        tanmay_stu = db.query(User).filter(User.email == 'tanmayrathi.1103@gmail.com').first()
        if tanmay_stu:
            tanmay_attempts = db.query(ExamAttempt).filter(ExamAttempt.student_id == tanmay_stu.id).all()
            for a in tanmay_attempts:
                if a.status in [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]:
                    a.status = AttemptStatus.IN_PROGRESS
                    a.started_at = now - timedelta(minutes=5)
                    a.expires_at = now + timedelta(minutes=55)
                    a.face_verified = True
                    print(f"  Reset attempt {a.id} for exam {a.exam_id} to IN_PROGRESS so student can resume.")
            db.commit()

        print("\n4. Seeding questions with multiple choice options...")
        # Questions pool for CS / DSA
        dsa_questions = [
            {
                "text": "What is the worst-case time complexity of QuickSort algorithm?",
                "options": [("O(n log n)", False), ("O(n^2)", True), ("O(log n)", False), ("O(n)", False)],
                "marks": 5, "diff": Difficulty.MEDIUM,
                "explanation": "QuickSort worst case occurs when pivot is the smallest or largest element repeatedly, leading to O(n^2)."
            },
            {
                "text": "Which data structure follows the Last-In-First-Out (LIFO) principle?",
                "options": [("Queue", False), ("Stack", True), ("Linked List", False), ("Binary Tree", False)],
                "marks": 5, "diff": Difficulty.EASY,
                "explanation": "A Stack operates on the LIFO principle where push and pop operate at top."
            },
            {
                "text": "In a Balanced Binary Search Tree (AVL tree), what is the maximum balance factor allowed?",
                "options": [("0", False), ("1", True), ("2", False), ("3", False)],
                "marks": 5, "diff": Difficulty.MEDIUM,
                "explanation": "AVL tree balance factor is height(left) - height(right) and must be in {-1, 0, 1}."
            },
            {
                "text": "Which algorithm is commonly used to find the shortest path in an undirected, weighted graph with non-negative edge weights?",
                "options": [("Dijkstra's Algorithm", True), ("Bellman-Ford Algorithm", False), ("Prim's Algorithm", False), ("Kruskal's Algorithm", False)],
                "marks": 5, "diff": Difficulty.MEDIUM,
                "explanation": "Dijkstra's algorithm efficiently computes single-source shortest path for non-negative weights."
            },
            {
                "text": "What is the auxiliary space complexity of standard Depth First Search (DFS) on a graph with V vertices?",
                "options": [("O(1)", False), ("O(V)", True), ("O(V^2)", False), ("O(log V)", False)],
                "marks": 5, "diff": Difficulty.MEDIUM,
                "explanation": "DFS recursion stack can grow up to O(V) in the worst case path."
            }
        ]

        # AI Questions
        ai_questions = [
            {
                "text": "Which activation function is most susceptible to the 'Vanishing Gradient Problem' during deep neural network training?",
                "options": [("ReLU", False), ("LeakyReLU", False), ("Sigmoid", True), ("GELU", False)],
                "marks": 5, "diff": Difficulty.MEDIUM,
                "explanation": "Sigmoid derivative saturates near 0 and 1, resulting in vanishing gradients in deep networks."
            },
            {
                "text": "What is the primary role of the Attention Mechanism in Transformer architectures?",
                "options": [("Reduce parameter count", False), ("Allow dynamic focus on relevant parts of input sequence", True), ("Replace backpropagation", False), ("Compress weights", False)],
                "marks": 5, "diff": Difficulty.MEDIUM,
                "explanation": "Self-attention computes dynamic weights reflecting dependencies between tokens regardless of distance."
            },
            {
                "text": "Which technique is specifically utilized to prevent overfitting in deep neural networks by randomly zeroing activations during training?",
                "options": [("Batch Normalization", False), ("Dropout", True), ("Gradient Clipping", False), ("Weight Decay", False)],
                "marks": 5, "diff": Difficulty.EASY,
                "explanation": "Dropout randomly deactivates neurons during forward pass with probability p to prevent co-adaptation."
            },
            {
                "text": "Convolutional Neural Networks (CNNs) are primarily designed for processing what type of grid-like data?",
                "options": [("Spatial / Visual 2D Data", True), ("Unordered Sets", False), ("Hash Tables", False), ("Graph Adjacency Matrices", False)],
                "marks": 5, "diff": Difficulty.EASY,
                "explanation": "CNNs leverage local receptive fields and weight sharing ideal for images and spatial data."
            }
        ]

        for exam in exams:
            existing_q_count = db.query(Question).filter(Question.exam_id == exam.id, Question.is_deleted == False).count()
            if existing_q_count == 0:
                pool = ai_questions if "Artificial" in exam.title else dsa_questions
                order = 1
                for q_data in pool:
                    q = Question(
                        id=uuid.uuid4(),
                        exam_id=exam.id,
                        question_text=q_data["text"],
                        question_type=QuestionType.MCQ,
                        marks=q_data["marks"],
                        negative_marks=1.0,
                        difficulty=q_data["diff"],
                        explanation=q_data.get("explanation"),
                        order_number=order,
                        is_required=True,
                        is_active=True
                    )
                    db.add(q)
                    db.flush()

                    opt_labels = ["A", "B", "C", "D"]
                    for idx, (opt_text, is_corr) in enumerate(q_data["options"]):
                        opt = QuestionOption(
                            id=uuid.uuid4(),
                            question_id=q.id,
                            option_label=opt_labels[idx],
                            option_text=opt_text,
                            is_correct=is_corr,
                            display_order=idx + 1
                        )
                        db.add(opt)
                    order += 1
                print(f"  Added {len(pool)} questions to exam '{exam.title}'")

        db.commit()
        print("\nAll demo questions, assignments, and exam windows seeded successfully!")
    finally:
        db.close()

if __name__ == '__main__':
    seed_questions()
