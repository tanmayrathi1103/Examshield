from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import uuid

from app.database.session import SessionLocal
from app.core.security import decode_access_token
from app.services.user_service import UserService
from app.models.user import User
from app.core.enums import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    user_service = UserService(db)
    user = user_service.get_user_by_uuid(user_id)
    if user is None:
        raise credentials_exception
    return user

def get_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active or current_user.is_deleted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user

def get_verified_user(current_user: User = Depends(get_active_user)) -> User:
    if not current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not verified")
    return current_user

def get_current_admin(current_user: User = Depends(get_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user

def get_current_faculty(current_user: User = Depends(get_active_user)) -> User:
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user

def get_current_student(current_user: User = Depends(get_active_user)) -> User:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user

def require_staff(current_user: User = Depends(get_active_user)) -> User:
    if current_user.role not in (UserRole.ADMIN, UserRole.FACULTY):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user
