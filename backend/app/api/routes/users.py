from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, role_required
from app.schemas.user import UserOut
from app.models.user import User, UserRole

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserOut], dependencies=[Depends(role_required([UserRole.ADMIN]))])
def read_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
