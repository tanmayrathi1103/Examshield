import os
from pathlib import Path

BASE_DIR = Path("C:/Users/Dell/Desktop/Examshield/backend/app")

# Ensure directories exist
directories = [
    "models",
    "schemas",
    "api/v1",
    "services",
    "core"
]

for d in directories:
    (BASE_DIR / d).mkdir(parents=True, exist_ok=True)
    init_file = BASE_DIR / d / "__init__.py"
    if not init_file.exists():
        init_file.touch()

# ----------------- core/security.py -----------------
security_py = """\
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return decoded_token
    except JWTError:
        return None
"""

# ----------------- models/base.py -----------------
models_base_py = """\
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func

class Base(DeclarativeBase):
    pass

class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
"""

# ----------------- enums (core/enums.py) -----------------
core_enums_py = """\
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"
"""

# ----------------- models/user.py -----------------
models_user_py = """\
from sqlalchemy import String, Boolean, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.models.base import Base, UUIDMixin, TimestampMixin
from app.core.enums import UserRole

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole), nullable=False)
    profile_picture: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
"""

# ----------------- models/student.py -----------------
models_student_py = """\
from sqlalchemy import String, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from typing import Optional
from datetime import date

from app.models.base import Base, UUIDMixin, TimestampMixin

class Student(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "students"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    enrollment_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    branch: Mapped[str] = mapped_column(String(100))
    semester: Mapped[int] = mapped_column()
    year: Mapped[int] = mapped_column()
    section: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    user = relationship("User", back_populates="student_profile")
"""

# ----------------- models/faculty.py -----------------
models_faculty_py = """\
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.models.base import Base, UUIDMixin, TimestampMixin

class Faculty(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "faculty"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    department: Mapped[str] = mapped_column(String(100))
    designation: Mapped[str] = mapped_column(String(100))

    user = relationship("User", back_populates="faculty_profile")
"""

# ----------------- models/admin.py -----------------
models_admin_py = """\
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.models.base import Base, UUIDMixin, TimestampMixin

class Admin(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "admins"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    admin_level: Mapped[int] = mapped_column(default=1)

    user = relationship("User", back_populates="admin_profile")
"""

# ----------------- models/__init__.py -----------------
models_init_py = """\
from app.models.base import Base
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.admin import Admin
"""

# ----------------- schemas/user.py -----------------
schemas_user_py = """\
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid
from app.core.enums import UserRole

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    role: UserRole
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8, description="Password must be at least 8 characters long")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}
"""

# ----------------- schemas/auth.py -----------------
schemas_auth_py = """\
from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str

class MessageResponse(BaseModel):
    message: str
"""

# ----------------- core/dependencies.py -----------------
core_dependencies_py = """\
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import uuid

from app.database.session import SessionLocal
from app.core.security import decode_access_token
from app.services.user_service import UserService
from app.models.user import User
from app.core.enums import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

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
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(uuid.UUID(user_id))
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user

def get_current_faculty(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user

def get_current_student(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user
"""

# ----------------- services/user_service.py -----------------
services_user_py = """\
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email, User.deleted_at == None).first()

    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id, User.deleted_at == None).first()

    def create_user(self, user_in: UserCreate) -> User:
        user = User(
            full_name=user_in.full_name,
            email=user_in.email,
            phone_number=user_in.phone_number,
            role=user_in.role,
            profile_picture=user_in.profile_picture,
            password_hash=hash_password(user_in.password)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete_user(self, user: User) -> None:
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.db.add(user)
        self.db.commit()
"""

# ----------------- services/auth_service.py -----------------
services_auth_py = """\
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.user import UserCreate
from app.schemas.auth import UserLogin, Token
from app.services.user_service import UserService
from app.core.security import verify_password, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)

    def register_user(self, user_in: UserCreate):
        user = self.user_service.get_user_by_email(email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        new_user = self.user_service.create_user(user_in)
        return new_user

    def authenticate_user(self, login_data: UserLogin) -> Token:
        user = self.user_service.get_user_by_email(email=login_data.email)
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        access_token = create_access_token(subject=user.id)
        return Token(access_token=access_token, token_type="bearer")
"""

# ----------------- api/v1/auth.py -----------------
api_auth_py = """\
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import UserLogin, Token, MessageResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register_user(user_in)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.authenticate_user(login_data)

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/logout", response_model=MessageResponse)
def logout():
    return MessageResponse(message="Successfully logged out")
"""

# Write all files
files = {
    "core/security.py": security_py,
    "core/enums.py": core_enums_py,
    "models/base.py": models_base_py,
    "models/user.py": models_user_py,
    "models/student.py": models_student_py,
    "models/faculty.py": models_faculty_py,
    "models/admin.py": models_admin_py,
    "models/__init__.py": models_init_py,
    "schemas/user.py": schemas_user_py,
    "schemas/auth.py": schemas_auth_py,
    "core/dependencies.py": core_dependencies_py,
    "services/user_service.py": services_user_py,
    "services/auth_service.py": services_auth_py,
    "api/v1/auth.py": api_auth_py
}

for path, content in files.items():
    with open(BASE_DIR / path, "w", encoding="utf-8") as f:
        f.write(content)
print("Backend authentication setup complete.")
