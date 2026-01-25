from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import role_required
from app.models.user import UserRole
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.post("/", response_model=ProductOut, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{id}", response_model=ProductOut, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def update_product(id: int, data: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product fields
    for key, value in data.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product
