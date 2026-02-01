from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.deps import get_db, role_required, get_current_user
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily-sales", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_daily_sales(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Query: Date, Total Sales, Count of Invoices
    query = db.query(
        func.date(Invoice.date).label("date"),
        func.count(Invoice.id).label("invoice_count"),
        func.sum(Invoice.grand_total).label("total_sales")
    ).filter(Invoice.owner_id == current_user.owner_id)
    
    if start_date:
        query = query.filter(func.date(Invoice.date) >= start_date)
    if end_date:
        query = query.filter(func.date(Invoice.date) <= end_date)
        
    results = query.group_by(func.date(Invoice.date)).order_by(func.date(Invoice.date).desc()).all()
    
    return [
        {"date": r.date, "invoice_count": r.invoice_count, "total_sales": r.total_sales}
        for r in results
    ]

@router.get("/product-sales", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_product_sales(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Query: Product Name, Category, Total Qty Sold, Total Amount
    query = db.query(
        Product.name,
        Product.category,
        func.sum(InvoiceItem.quantity).label("total_qty"),
        func.sum(InvoiceItem.taxable_amount).label("total_amount")
    ).join(Product, InvoiceItem.product_id == Product.id)\
     .join(Invoice, InvoiceItem.invoice_id == Invoice.id)\
     .filter(Invoice.owner_id == current_user.owner_id)
    
    if start_date:
        query = query.filter(func.date(Invoice.date) >= start_date)
    if end_date:
        query = query.filter(func.date(Invoice.date) <= end_date)
        
    results = query.group_by(Product.id)\
     .order_by(func.sum(InvoiceItem.taxable_amount).desc()).all()

    return [
        {
            "product_name": r.name,
            "category": r.category,
            "total_qty": r.total_qty,
            "total_amount": r.total_amount
        }
        for r in results
    ]
