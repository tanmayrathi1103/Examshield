from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid
from app.core.enums import UserRole

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone_number: str = Field(..., min_length=10, max_length=20)
    role: UserRole
    profile_picture: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=8, description="Strong password required")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
