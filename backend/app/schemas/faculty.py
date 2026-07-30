from pydantic import BaseModel
import uuid

class FacultyResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    employee_id: str
    department: str
    designation: str

    model_config = {"from_attributes": True}
