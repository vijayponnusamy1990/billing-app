from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def seed_users():
    db = SessionLocal()
    
    users = [
        {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password": "admin123",
            "role": UserRole.ADMIN
        },
        {
            "email": "manager@example.com",
            "full_name": "Store Manager",
            "password": "manager123",
            "role": UserRole.MANAGER
        },
        {
            "email": "sales@example.com",
            "full_name": "Sales Rep",
            "password": "sales123",
            "role": UserRole.SALES
        }
    ]

    for user_data in users:
        user = db.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            print(f"Creating {user_data['role']} user: {user_data['email']}")
            new_user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True
            )
            db.add(new_user)
        else:
            print(f"User {user_data['email']} already exists. Updating role/password...")
            user.role = user_data["role"]
            user.hashed_password = get_password_hash(user_data["password"])
            db.add(user)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_users()
