import sys
import os
import uuid

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.admin_profile import AdminProfile
from app.core.enums import UserRole
from app.core.security import hash_password

from sqlalchemy import text

def create_super_admin(
    email: str = "superadmin@examshield.ai",
    password: str = "SuperAdmin@123456",
    full_name: str = "Super Administrator",
    phone_number: str = "9999990000"
):
    db = SessionLocal()
    try:
        print(f"Ensuring Postgres Enum 'userrole' includes 'super_admin' and 'SUPER_ADMIN'...")
        try:
            db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'super_admin'"))
            db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'"))
            db.commit()
        except Exception as enum_err:
            db.rollback()
            print(f"Enum update notice: {enum_err}")

        print(f"Creating / Updating Super Admin Account ({email})...")
        
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Super Admin user found. Updating password and permissions...")
            user.role = UserRole.SUPER_ADMIN
            user.password_hash = hash_password(password)
            user.is_active = True
            user.is_verified = True
        else:
            user = User(
                id=uuid.uuid4(),
                full_name=full_name,
                email=email,
                phone_number=phone_number,
                password_hash=hash_password(password),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()
            print(f"Created new Super Admin user ({email}).")

        admin_prof = db.query(AdminProfile).filter(AdminProfile.user_id == user.id).first()
        if not admin_prof:
            admin_prof = AdminProfile(
                user_id=user.id,
                admin_level=100
            )
            db.add(admin_prof)
        else:
            admin_prof.admin_level = 100

        db.commit()
        print("=" * 60)
        print("✅ Super Admin Account Successfully Provisioned!")
        print(f"   Email:    {email}")
        print(f"   Password: {password}")
        print(f"   Role:     {UserRole.SUPER_ADMIN.value}")
        print("=" * 60)
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating Super Admin: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else "superadmin@examshield.ai"
    pass_arg = sys.argv[2] if len(sys.argv) > 2 else "SuperAdmin@123456"
    create_super_admin(email=email_arg, password=pass_arg)
