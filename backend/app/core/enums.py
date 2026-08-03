import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class Semester(int, enum.Enum):
    SEM_1 = 1
    SEM_2 = 2
    SEM_3 = 3
    SEM_4 = 4
    SEM_5 = 5
    SEM_6 = 6
    SEM_7 = 7
    SEM_8 = 8

class Branch(str, enum.Enum):
    CSE = "Computer Science"
    IT = "Information Technology"
    ECE = "Electronics and Communication"
    MECH = "Mechanical"
    CIVIL = "Civil"

class ViolationType(str, enum.Enum):
    MOBILE_PHONE = "mobile_phone"
    MULTIPLE_PERSON = "multiple_person"
    LOOKING_AWAY = "looking_away"
    VOICE_DETECTED = "voice_detected"

class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    DESCRIPTIVE = "descriptive"
    NUMERICAL = "numerical"

class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class ExamStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"

class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    STARTED = "started"
    SUBMITTED = "submitted"
    ABSENT = "absent"
    EXEMPTED = "exempted"

class AttemptStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    SUBMITTED = "submitted"
    AUTO_SUBMITTED = "auto_submitted"
    EVALUATED = "evaluated"
    UNDER_REVIEW = "under_review"

class AttemptEventType(str, enum.Enum):
    STARTED = "started"
    RESUMED = "resumed"
    PAUSED = "paused"
    SUBMITTED = "submitted"
    AUTO_SUBMITTED = "auto_submitted"
    # Future AI events
    FACE_MISMATCH = "face_mismatch"
    MULTIPLE_FACES = "multiple_faces"
    NO_FACE = "no_face"
    PHONE_DETECTED = "phone_detected"
    VOICE_DETECTED = "voice_detected"
    LOOKING_AWAY = "looking_away"
    TAB_SWITCH = "tab_switch"
    FULLSCREEN_EXIT = "fullscreen_exit"
    NETWORK_DISCONNECT = "network_disconnect"
