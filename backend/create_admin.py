from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import sys

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        print("Creating admin user...")
        admin = User(
            email="admin@example.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Admin created: admin@example.com / admin123")
    else:
        print("Admin user already exists.")
    
    db.close()

if __name__ == "__main__":
    init()
