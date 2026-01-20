from pydantic import BaseModel
from app.models.user import UserRole

class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True
