import sys
import os
import uuid

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.admin_profile import AdminProfile
from app.core.enums import UserRole
from app.core.security import hash_password, verify_password

def reset_or_create_admin(
    email: str = "admin@examshield.ai",
    password: str = "Admin@123456",
    full_name: str = "System Administrator",
    phone_number: str = "9999990001"
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Found existing user with email: {email}")
            user.password_hash = hash_password(password)
            user.role = UserRole.ADMIN
            user.is_active = True
            user.is_verified = True
            user.is_deleted = False
            print(f"Updated password and permissions for: {email}")
        else:
            print(f"Creating new Admin user: {email}")
            user = User(
                id=uuid.uuid4(),
                full_name=full_name,
                email=email,
                phone_number=phone_number,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()

        admin_prof = db.query(AdminProfile).filter(AdminProfile.user_id == user.id).first()
        if not admin_prof:
            admin_prof = AdminProfile(user_id=user.id, admin_level=1)
            db.add(admin_prof)
            print(f"Attached AdminProfile to user: {email}")

        db.commit()

        # Verify password hash works
        assert verify_password(password, user.password_hash), "Verification failed!"

        print("\n" + "=" * 55)
        print(" SUCCESS: Admin Account Ready")
        print("=" * 55)
        print(f" Portal URL: http://localhost:5173/login/admin")
        print(f" Email:      {email}")
        print(f" Password:   {password}")
        print(f" Role:       {user.role.value}")
        print("=" * 55 + "\n")
        return True
    except Exception as e:
        db.rollback()
        print(f"Error resetting admin password: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else "admin@examshield.ai"
    pass_arg = sys.argv[2] if len(sys.argv) > 2 else "Admin@123456"
    reset_or_create_admin(email=email_arg, password=pass_arg)
