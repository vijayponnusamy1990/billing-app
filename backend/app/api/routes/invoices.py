from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import role_required, get_current_user
from app.models.user import UserRole, User
from app.models.product import Product, Unit, Category
from app.models.invoice import Invoice, InvoiceItem
from app.models.inventory import InventoryMovement
from app.schemas.invoice import InvoiceCreate, InvoiceOut, InvoiceList

router = APIRouter(prefix="/invoices", tags=["invoices"])

from app.models.customer import Customer
from datetime import datetime

@router.post("/", response_model=InvoiceOut,
             dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Handle Customer Logic
    customer_id = data.customer_id
    if not customer_id and data.customer_name:
        # Check if customer exists by phone
        if data.customer_phone:
            existing = db.query(Customer).filter(
                Customer.phone == data.customer_phone,
                Customer.owner_id == current_user.owner_id
            ).first()
            if existing:
                customer_id = existing.id
        
        if not customer_id:
            new_customer = Customer(
                name=data.customer_name,
                phone=data.customer_phone,
                # Granular billing
                billing_line1=data.customer_billing_line1,
                billing_line2=data.customer_billing_line2,
                billing_city=data.customer_billing_city,
                billing_state=data.customer_billing_state,
                billing_zip=data.customer_billing_zip,
                # Granular shipping
                shipping_line1=data.customer_shipping_line1,
                shipping_line2=data.customer_shipping_line2,
                shipping_city=data.customer_shipping_city,
                shipping_state=data.customer_shipping_state,
                shipping_zip=data.customer_shipping_zip,
                gstin=data.customer_gstin,
                refer_by=data.customer_refer_by,
                owner_id=current_user.owner_id
            )
            db.add(new_customer)
            db.flush() # get ID
            customer_id = new_customer.id
            
    invoice_date = data.date if data.date else datetime.utcnow()

    invoice = Invoice(
        invoice_no=data.invoice_no,
        customer_id=customer_id,
        date=invoice_date,
        notes=data.notes,
        owner_id=current_user.owner_id
    )

    total_taxable = total_cgst = total_sgst = total_igst = 0.0

    for item_in in data.items:
        # Ensure product belongs to owner
        product = db.query(Product).filter(
            Product.id == item_in.product_id,
            Product.owner_id == current_user.owner_id
        ).first()
        
        if not product:
            raise HTTPException(status_code=400, detail="Invalid product")

        if item_in.unit not in (product.base_unit, product.alt_unit):
            raise HTTPException(status_code=400, detail="Invalid unit for product")

        area_sqft = item_in.area_sqft
        if product.category in (Category.PLYWOOD, Category.GLASS) and item_in.unit == Unit.SQFT:
            if not area_sqft and item_in.length_ft and item_in.width_ft:
                area_sqft = item_in.length_ft * item_in.width_ft

        if item_in.unit == Unit.SQFT:
            rate = item_in.manual_rate if item_in.manual_rate is not None and current_user.role in [UserRole.ADMIN, UserRole.MANAGER] else (product.price_per_sqft or 0.0)
            qty_for_amount = area_sqft or 0.0
        else:
            rate = item_in.manual_rate if item_in.manual_rate is not None and current_user.role in [UserRole.ADMIN, UserRole.MANAGER] else (product.price_per_piece or 0.0)
            qty_for_amount = item_in.quantity

        taxable_amount = qty_for_amount * rate
        gst_rate = product.gst_rate or 0.0

        # assume intrastate for now (split GST)
        cgst_rate = gst_rate / 2
        sgst_rate = gst_rate / 2
        igst_rate = 0.0

        cgst_amount = taxable_amount * cgst_rate / 100.0
        sgst_amount = taxable_amount * sgst_rate / 100.0
        igst_amount = 0.0

        total_taxable += taxable_amount
        total_cgst += cgst_amount
        total_sgst += sgst_amount

        inv_item = InvoiceItem(
            product_id=product.id,
            description=item_in.description or product.name,
            thickness=item_in.thickness or product.thickness,
            dimension=item_in.dimension or product.dimension,
            quantity=item_in.quantity,
            unit=item_in.unit,
            length_ft=item_in.length_ft,
            width_ft=item_in.width_ft,
            area_sqft=area_sqft,
            rate=rate,
            taxable_amount=taxable_amount,
            cgst_rate=cgst_rate,
            sgst_rate=sgst_rate,
            igst_rate=igst_rate,
            cgst_amount=cgst_amount,
            sgst_amount=sgst_amount,
            igst_amount=igst_amount,
        )
        invoice.items.append(inv_item)

        # Inventory decrement
        stock_delta = -qty_for_amount
        product.stock_qty = (product.stock_qty or 0.0) + stock_delta
        move = InventoryMovement(
            product_id=product.id,
            quantity_change=stock_delta,
            reason="SALE",
            created_by_user_id=current_user.id,
            owner_id=current_user.owner_id
        )
        db.add(move)

    invoice.total_taxable = total_taxable
    invoice.total_cgst = total_cgst
    invoice.total_sgst = total_sgst
    invoice.total_igst = total_igst
    gross = total_taxable + total_cgst + total_sgst + total_igst
    
    invoice.grand_total = round(gross)
    invoice.round_off = invoice.grand_total - gross

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/", response_model=InvoiceList,
             dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def get_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Invoice).filter(Invoice.owner_id == current_user.owner_id)
    total = query.count()
    invoices = query.order_by(Invoice.date.desc()).offset(skip).limit(limit).all()
    return {"items": invoices, "total": total}

@router.get("/{id}", response_model=InvoiceOut,
             dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def get_invoice(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == id, Invoice.owner_id == current_user.owner_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
