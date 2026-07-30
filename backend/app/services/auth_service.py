from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.user import UserRegister
from app.schemas.auth import UserLogin, Token
from app.services.user_service import UserService
from app.core.security import verify_password, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.user_service = UserService(db)

    def register(self, user_in: UserRegister):
        if self.user_service.get_user_by_email(user_in.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if self.user_service.get_user_by_phone(user_in.phone_number):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")
        return self.user_service.create_user(user_in)

    def login(self, email: str, password: str) -> Token:
        user = self.user_service.get_user_by_email(email)
        
        # Generic error message to prevent enumeration
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
            
        if not user.is_active or user.is_deleted:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive or deleted user")
            
        self.user_service.update_last_login(user)
        access_token = create_access_token(subject=str(user.id))
        return Token(access_token=access_token, token_type="bearer")
