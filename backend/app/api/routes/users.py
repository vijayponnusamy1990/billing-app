from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, role_required, get_current_user
from app.schemas.user import UserOut
from app.models.user import User, UserRole

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserOut], dependencies=[Depends(role_required([UserRole.ADMIN]))])
def read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.owner_id == current_user.owner_id).all()
    return users
