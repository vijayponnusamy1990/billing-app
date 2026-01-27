from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db, role_required
from app.models.customer import Customer
from app.schemas.customer import CustomerOut
from typing import List
from app.models.user import UserRole

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("/search", response_model=List[CustomerOut], dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def search_customers(q: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    customers = db.query(Customer).filter(
        or_(
            Customer.phone.ilike(f"%{q}%"),
            Customer.name.ilike(f"%{q}%")
        )
    ).limit(10).all()
    return customers
