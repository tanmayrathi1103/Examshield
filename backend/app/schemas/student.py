from pydantic import BaseModel
from typing import Optional
from datetime import date
import uuid
from app.core.enums import Gender, Semester, Branch

class StudentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    enrollment_number: str
    branch: Branch
    semester: Semester
    year: int
    section: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None

    model_config = {"from_attributes": True}
