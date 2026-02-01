from pydantic import BaseModel
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int
    role: UserRole
    owner_id: int

class LoginRequest(BaseModel):
    email: str
    password: str
    owner_id: int
