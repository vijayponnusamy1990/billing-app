from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.deps import role_required, get_current_user
from app.models.user import UserRole, User
from app.models.product import Product, ProductBatch
from app.schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductOut])
def list_products(skip: int = 0, limit: int = 50, q: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Product).filter(Product.owner_id == current_user.owner_id)
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=ProductOut, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def create_product(data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product_data = data.dict()
    buying_price = product_data.pop('buying_price', 0.0) # Extract buying_price
    product_data['owner_id'] = current_user.owner_id
    
    product = Product(**product_data)
    db.add(product)
    db.flush() # Get ID
    
    # Create initial batch if stock is added
    if product.stock_qty > 0:
        initial_batch = ProductBatch(
            product_id=product.id,
            sku=f"INIT-{product.id}",
            buying_price=buying_price,
            selling_price=product.price_per_piece,
            initial_qty=product.stock_qty,
            current_qty=product.stock_qty
        )
        db.add(initial_batch)
        
    db.commit()
    db.refresh(product)
    return product

@router.put("/{id}", response_model=ProductOut, dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def update_product(id: int, data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == id, Product.owner_id == current_user.owner_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product fields
    for key, value in data.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product
