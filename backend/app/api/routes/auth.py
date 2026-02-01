from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token
from app.core.security import verify_password, create_access_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Enforce Multi-Tenancy
    if user.owner_id != data.owner_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not belong to this tenant")

    token = create_access_token({"user_id": user.id, "role": user.role.value, "owner_id": user.owner_id})
    return {"access_token": token, "token_type": "bearer"}
