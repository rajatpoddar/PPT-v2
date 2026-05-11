import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models.user import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

def create_admin():
    email = "admin@pptbuilders.com"
    password = "admin"
    
    # Check if exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"Admin already exists: {email} / {password}")
        return

    admin = User(
        email=email,
        password_hash=pwd_context.hash(password),
        full_name="System Admin",
        phone="0000000000",
        role=UserRole.owner
    )
    db.add(admin)
    db.commit()
    print(f"Admin created successfully: {email} / {password}")

if __name__ == "__main__":
    create_admin()
