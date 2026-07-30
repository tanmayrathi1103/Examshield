from pydantic import BaseModel
import uuid

class AdminResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    admin_level: int

    model_config = {"from_attributes": True}
