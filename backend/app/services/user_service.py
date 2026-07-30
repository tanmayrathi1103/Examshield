from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
from app.models.user import User
from app.schemas.user import UserRegister, UserUpdate
from app.core.security import hash_password

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        email_lower = email.lower()
        return self.db.query(User).filter(User.email == email_lower, User.is_deleted == False).first()

    def get_user_by_phone(self, phone: str) -> User | None:
        return self.db.query(User).filter(User.phone_number == phone, User.is_deleted == False).first()

    def get_user_by_uuid(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id, User.is_deleted == False).first()

    def create_user(self, user_in: UserRegister) -> User:
        user = User(
            full_name=user_in.full_name,
            email=user_in.email.lower(),
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

    def update_last_login(self, user: User) -> None:
        user.last_login = datetime.now(timezone.utc)
        self.db.add(user)
        self.db.commit()

    def soft_delete_user(self, user: User) -> None:
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.db.add(user)
        self.db.commit()
