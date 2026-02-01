from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.api.deps import get_db, role_required, get_current_user
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.user import User, UserRole
from app.schemas.customer import CustomerOut, CustomerCreate, CustomerUpdate
from app.schemas.invoice import InvoiceOut # Assuming InvoiceOut exists
from typing import List

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("/", response_model=List[CustomerOut], dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def get_customers(
    skip: int = 0, 
    limit: int = 20, 
    q: str = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer).filter(Customer.owner_id == current_user.owner_id)
    
    if q:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{q}%"),
                Customer.phone.ilike(f"%{q}%"),
                Customer.billing_city.ilike(f"%{q}%")
            )
        )
        
    customers = query.order_by(desc(Customer.id)).offset(skip).limit(limit).all()
    return customers

@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def create_customer(
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check if exists by phone if provided? Optional check. 
    # For now, just create.
    customer_data = customer_in.dict()
    customer_data["owner_id"] = current_user.owner_id
    
    customer = Customer(**customer_data)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/search", response_model=List[CustomerOut], dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def search_customers(q: str = Query(..., min_length=3), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customers = db.query(Customer).filter(
        Customer.owner_id == current_user.owner_id,
        or_(
            Customer.phone.ilike(f"%{q}%"),
            Customer.name.ilike(f"%{q}%")
        )
    ).limit(10).all()
    return customers

@router.get("/{customer_id}", response_model=CustomerOut, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def get_customer(
    customer_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id, 
        Customer.owner_id == current_user.owner_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerOut, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def update_customer(
    customer_id: int, 
    customer_in: CustomerUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id, 
        Customer.owner_id == current_user.owner_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
        
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{customer_id}/invoices", response_model=List[InvoiceOut], dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def get_customer_invoices(
    customer_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify customer exists and belongs to owner
    customer = db.query(Customer).filter(
        Customer.id == customer_id, 
        Customer.owner_id == current_user.owner_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    invoices = db.query(Invoice).filter(
        Invoice.customer_id == customer_id,
        Invoice.owner_id == current_user.owner_id
    ).order_by(desc(Invoice.date)).all()
    
    return invoices
