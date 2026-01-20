from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from app.db.session import get_db
from app.api.deps import role_required
from app.models.user import UserRole
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily-sales", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_daily_sales(db: Session = Depends(get_db)):
    # SQLite-specific date truncation might be needed, but for now we'll rely on python-side grouping 
    # OR better use func.date() which works in SQLite.
    
    # Query: Date, Total Sales, Count of Invoices
    results = db.query(
        func.date(Invoice.date).label("date"),
        func.count(Invoice.id).label("invoice_count"),
        func.sum(Invoice.grand_total).label("total_sales")
    ).group_by(func.date(Invoice.date)).order_by(func.date(Invoice.date).desc()).all()
    
    return [
        {"date": r.date, "invoice_count": r.invoice_count, "total_sales": r.total_sales}
        for r in results
    ]

@router.get("/product-sales", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_product_sales(db: Session = Depends(get_db)):
    # Query: Product Name, Category, Total Qty Sold, Total Amount
    results = db.query(
        Product.name,
        Product.category,
        func.sum(InvoiceItem.quantity).label("total_qty"),
        func.sum(InvoiceItem.taxable_amount).label("total_amount")
    ).join(Product, InvoiceItem.product_id == Product.id)\
     .group_by(Product.id)\
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
