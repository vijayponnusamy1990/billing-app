from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.api.deps import get_db, role_required
from app.models.product import Product
from app.models.invoice import InvoiceItem, Invoice
from app.models.customer import Customer
from app.models.user import UserRole

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    # Inventory stats (Snapshot, not date dependent usually)
    total_products = db.query(func.count(Product.id)).scalar()
    low_stock_count = db.query(func.count(Product.id)).filter(Product.stock_qty <= Product.low_stock_limit).scalar()
    
    # Sales stats (Date dependent)
    query = db.query(
        func.sum(Invoice.grand_total).label("total_revenue"),
        func.count(Invoice.id).label("invoice_count")
    )
    
    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date <= end_date)
        
    sales_stats = query.first()
    
    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "total_revenue": sales_stats.total_revenue or 0,
        "total_invoices": sales_stats.invoice_count or 0
    }

@router.get("/low-stock", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_low_stock_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.stock_qty <= Product.low_stock_limit).all()
    return products

@router.get("/top-products", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_top_products(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 5, 
    db: Session = Depends(get_db)
):
    query = db.query(
        Product.name,
        Product.category,
        Product.stock_qty,
        func.sum(InvoiceItem.quantity).label("total_sold")
    ).join(InvoiceItem, Product.id == InvoiceItem.product_id)\
     .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
     
    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date <= end_date)
        
    results = query.group_by(Product.id)\
     .order_by(desc("total_sold"))\
     .limit(limit).all()
     
    return [
        {"name": r.name, "category": r.category, "stock_qty": r.stock_qty, "total_sold": r.total_sold}
        for r in results
    ]

@router.get("/least-products", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_least_products(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 5, 
    db: Session = Depends(get_db)
):
    # For least products, we probably still want products that HAVE sold, but least?
    # Or products that haven't sold at all? The original query used `outerjoin` which implies showing products with 0 sales.
    # However, if we filter by date, `outerjoin` gets tricky if we filter on the joined table.
    # If we filter `Invoice.date`, we effectively turn outer join into inner join unless we handle NULLs carefully.
    # But for "least selling products in a period", usually we mean "of the products that sold, which sold least" OR "which products had 0 sales in this period".
    # The original implementation: `outerjoin(InvoiceItem) ... coalesce(sum, 0)`.
    # To keep showing 0 sales products, we need to filter the JOIN condition or subquery.
    # Simplified approach: Filter invoices first, then join? 
    # Or just use Inner Join for now to show "Least Selling" among sold items? 
    # Valid "Least selling" often implies potential dead stock. 
    # Let's stick to the previous logic but apply date filter.
    # CAUTION: Filtering on the right side of an outer join in the WHERE clause turns it into an inner join.
    # We should filter strictly on Invoice properties.
    
    # Actually, for simplicity and common business logic "Least Selling Products" usually means "Low movement".
    # If I just add `.filter(Invoice.date ...)` it will exclude products with NO sales in that period (because Invoice.date is NULL for them).
    # That might be desired (show me what sold slowly) vs (show me what didn't sell).
    # The original coalsece func implies showing 0.
    # Let's use INNER JOIN for now to be safe and consistent with "Top Products" but reversed. 
    # The prompt asked to "consolidate... make widgets time-range sensitive".
    
    query = db.query(
        Product.name,
        Product.category,
        Product.stock_qty,
        func.sum(InvoiceItem.quantity).label("total_sold")
    ).join(InvoiceItem, Product.id == InvoiceItem.product_id)\
     .join(Invoice, InvoiceItem.invoice_id == Invoice.id)

    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date <= end_date)

    results = query.group_by(Product.id)\
     .order_by(asc("total_sold"))\
     .limit(limit).all()
     
    return [
        {"name": r.name, "category": r.category, "stock_qty": r.stock_qty, "total_sold": r.total_sold}
        for r in results
    ]

@router.get("/top-customers", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_top_customers(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 5, 
    db: Session = Depends(get_db)
):
    query = db.query(
        Customer.name,
        func.count(Invoice.id).label("invoice_count"),
        func.sum(Invoice.grand_total).label("total_revenue")
    ).join(Invoice, Customer.id == Invoice.customer_id)
    
    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date <= end_date)

    results = query.group_by(Customer.id)\
     .order_by(desc("total_revenue"))\
     .limit(limit).all()
     
    return [
        {"name": r.name, "invoice_count": r.invoice_count, "total_revenue": r.total_revenue}
        for r in results
    ]
