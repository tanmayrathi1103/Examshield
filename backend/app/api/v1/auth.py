from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
import logging

from app.database.session import get_db
from app.schemas.user import UserRegister, UserResponse
from app.schemas.auth import UserLogin, Token, MessageResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_active_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    logger.info(f"Attempting registration for {user_in.email}")
    user = AuthService(db).register(user_in)
    logger.info(f"Successfully registered user {user.id}")
    return user

from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import UserLogin, Token, MessageResponse

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Login attempt for {login_data.email}")
    token = AuthService(db).login(login_data.email, login_data.password)
    logger.info("Login successful")
    return token

@router.post("/token", response_model=Token, include_in_schema=False)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Dedicated endpoint for Swagger UI OAuth2 authentication."""
    logger.info(f"Swagger login attempt for {form_data.username}")
    token = AuthService(db).login(form_data.username, form_data.password)
    logger.info("Swagger login successful")
    return token

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_active_user)):
    return current_user

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_active_user)):
    # In future phases, this will return joined role-specific profile (Student/Faculty/Admin)
    return current_user

from typing import List
@router.get("/students", response_model=List[UserResponse])
def get_students(db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == "student").all()
    return students

@router.post("/logout", response_model=MessageResponse)
def logout():
    logger.info("User requested logout")
    return MessageResponse(message="Successfully logged out (token cleared on client)")
