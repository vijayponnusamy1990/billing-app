from typing import Optional, List
from datetime import date, timedelta
from fastapi import APIRouter, Depends 
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, case, cast, Float
from app.api.deps import get_db, role_required
from app.models.product import Product, ProductBatch
from app.models.invoice import InvoiceItem, Invoice
from app.models.customer import Customer
from app.models.user import UserRole, User
from app.api.deps import get_db, role_required, get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Inventory stats (Snapshot)
    total_products = db.query(func.count(Product.id)).filter(Product.owner_id == current_user.owner_id).scalar() or 0
    
    low_stock_count = db.query(func.count(Product.id)).filter(
        Product.stock_qty <= Product.low_stock_limit,
        Product.owner_id == current_user.owner_id
    ).scalar() or 0
    
    # Sales stats (Date dependent) -- Using InvoiceItem for granule calc
    # Profit Calc: (Item Rate - Buying Price) * Qty
    # Need to handle case where Batch is missing (fallback to Product buying price)
    
    buying_price_expr = case(
        (InvoiceItem.product_batch_id != None, ProductBatch.buying_price),
        else_=0.0
    )
    
    # Ensure buying_price is float for calc
    buying_price_expr = cast(buying_price_expr, Float)
    
    profit_expr = (InvoiceItem.rate - buying_price_expr) * InvoiceItem.quantity
    
    query = db.query(
        func.sum(Invoice.grand_total).label("total_revenue"),
        func.count(Invoice.id.distinct()).label("invoice_count"),
        func.sum(InvoiceItem.quantity).label("total_items_sold"),
        func.sum(profit_expr).label("total_profit")
    ).select_from(Invoice)\
     .join(InvoiceItem, Invoice.id == InvoiceItem.invoice_id)\
     .outerjoin(ProductBatch, InvoiceItem.product_batch_id == ProductBatch.id)\
     .join(Product, InvoiceItem.product_id == Product.id)\
     .filter(Invoice.owner_id == current_user.owner_id)
    
    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date < end_date + timedelta(days=1))
        
    stats = query.first()
    
    return {
        "total_revenue": stats.total_revenue or 0.0,
        "total_profit": stats.total_profit or 0.0,
        "total_invoices": stats.invoice_count or 0,
        "total_items_sold": stats.total_items_sold or 0.0,
        "total_products": total_products,
        "low_stock_count": low_stock_count
    }

@router.get("/low-stock", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_low_stock_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).filter(
        Product.stock_qty <= Product.low_stock_limit,
        Product.owner_id == current_user.owner_id
    ).all()
    return products

@router.get("/top-products", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_top_products(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 5, 
    sort_by: str = "sold", # sold, revenue, profit
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    buying_price_expr = cast(case(
        (InvoiceItem.product_batch_id != None, ProductBatch.buying_price),
        else_=0.0
    ), Float)
    
    profit_expr = (InvoiceItem.rate - buying_price_expr) * InvoiceItem.quantity
    
    query = db.query(
        Product.name,
        Product.category,
        Product.stock_qty,
        func.sum(InvoiceItem.quantity).label("total_sold"),
        func.sum(InvoiceItem.taxable_amount).label("total_revenue"),
        func.sum(profit_expr).label("total_profit")
    ).select_from(Product)\
     .join(InvoiceItem, Product.id == InvoiceItem.product_id)\
     .join(Invoice, InvoiceItem.invoice_id == Invoice.id)\
     .outerjoin(ProductBatch, InvoiceItem.product_batch_id == ProductBatch.id)\
     .filter(Product.owner_id == current_user.owner_id)
     
    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date < end_date + timedelta(days=1))
        
    query = query.group_by(Product.id)
    
    if sort_by == "revenue":
        query = query.order_by(desc("total_revenue"))
    elif sort_by == "profit":
        query = query.order_by(desc("total_profit"))
    else:
        query = query.order_by(desc("total_sold"))
        
    results = query.limit(limit).all()
     
    return [
        {
            "name": r.name, 
            "category": r.category, 
            "stock_qty": r.stock_qty, 
            "total_sold": r.total_sold, 
            "total_revenue": r.total_revenue,
            "total_profit": r.total_profit or 0.0
        }
        for r in results
    ]

@router.get("/least-products", dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER]))])
def get_least_products(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 5, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For weak products, we typically look at sold qty
    query = db.query(
        Product.name,
        Product.category,
        Product.stock_qty,
        func.sum(InvoiceItem.quantity).label("total_sold")
    ).join(InvoiceItem, Product.id == InvoiceItem.product_id)\
     .join(Invoice, InvoiceItem.invoice_id == Invoice.id)\
     .filter(Product.owner_id == current_user.owner_id)

    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date < end_date + timedelta(days=1))

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
    sort_by: str = "revenue",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Profit per customer
    buying_price_expr = cast(case(
        (InvoiceItem.product_batch_id != None, ProductBatch.buying_price),
        else_=0.0
    ), Float)
    
    profit_expr = (InvoiceItem.rate - buying_price_expr) * InvoiceItem.quantity

    query = db.query(
        Customer.name,
        func.count(Invoice.id.distinct()).label("invoice_count"),
        func.sum(Invoice.grand_total).label("total_revenue"), # This is invoice based sum? No, querying Item level for profit
        # If we join Item, we get duplicates for Invoice fields if we just sum Invoice.grand_total? 
        # Correct. grand_total is on Invoice. 
        # If we group by Customer, and join Invoice and InvoiceItem...
        # sum(Invoice.grand_total) will explode if we join InvoiceItem.
        # Solution: Calculate revenue from Items (taxable) + Tax? Or just use taxable for comparison?
        # User wants "Sales" which is usually Grand Total.
        # But Profit requires Item details.
        # Can we do subquery? Or just sum(Item.taxable_amount) as Revenue approximation?
        # Let's sum(Item.taxable_amount + taxes) to act as revenue from items.
        # Item has taxable_amount, cgst_amount, sgst_amount, igst_amount.
        func.sum(InvoiceItem.taxable_amount + InvoiceItem.cgst_amount + InvoiceItem.sgst_amount + InvoiceItem.igst_amount).label("item_revenue"),
        func.sum(profit_expr).label("total_profit")
    ).select_from(Customer)\
     .join(Invoice, Customer.id == Invoice.customer_id)\
     .join(InvoiceItem, Invoice.id == InvoiceItem.invoice_id)\
     .outerjoin(ProductBatch, InvoiceItem.product_batch_id == ProductBatch.id)\
     .join(Product, InvoiceItem.product_id == Product.id)\
     .filter(Customer.owner_id == current_user.owner_id)
    
    if start_date:
        query = query.filter(Invoice.date >= start_date)
    if end_date:
        query = query.filter(Invoice.date < end_date + timedelta(days=1))

    query = query.group_by(Customer.id)
    
    if sort_by == "profit":
        query = query.order_by(desc("total_profit"))
    else:
        query = query.order_by(desc("item_revenue"))

    results = query.limit(limit).all()
     
    return [
        {
            "name": r.name, 
            "invoice_count": r.invoice_count, 
            "total_revenue": r.item_revenue or 0.0, 
            "total_profit": r.total_profit or 0.0
        }
        for r in results
    ]
