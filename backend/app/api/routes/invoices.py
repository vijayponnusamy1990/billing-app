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


def _process_invoice_items(db: Session, current_user: User, invoice: Invoice, items_in: List):
    total_taxable = total_cgst = total_sgst = total_igst = 0.0

    for item_in in items_in:
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
        total_igst += igst_amount

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
        payment_status=data.payment_status,
        payment_mode=data.payment_mode,
        owner_id=current_user.owner_id
    )

    # Logic extracted to helper
    _process_invoice_items(db, current_user, invoice, data.items)

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.put("/{id}", response_model=InvoiceOut,
             dependencies=[Depends(role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))])
def update_invoice(id: int, data: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == id, Invoice.owner_id == current_user.owner_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Update fundamental fields
    # Note: We keep original invoice_no unless explicitly changed effectively?
    # data.invoice_no is required in schema, so we overwrite.
    invoice.invoice_no = data.invoice_no
    if data.date:
        invoice.date = data.date
    invoice.notes = data.notes
    invoice.payment_status = data.payment_status
    invoice.payment_mode = data.payment_mode
    
    # Handle Customer (Update link if name changed or just use existing logic?
    # For now, we assume customer linked is preserved unless we want to support changing customer.
    # The Schema has customer_id/name.
    # Logic from create:
    # If customer_id provided, use it. If not, try creating/finding.
    # This logic matches Create.
    customer_id = data.customer_id
    if not customer_id and data.customer_name:
         if data.customer_phone:
            existing = db.query(Customer).filter(
                Customer.phone == data.customer_phone,
                Customer.owner_id == current_user.owner_id
            ).first()
            if existing:
                customer_id = existing.id
         
         if not customer_id:
            # Create new customer logic (duplicated somewhat, but safe)
            new_customer = Customer(
                name=data.customer_name,
                phone=data.customer_phone,
                billing_line1=data.customer_billing_line1,
                billing_line2=data.customer_billing_line2,
                billing_city=data.customer_billing_city,
                billing_state=data.customer_billing_state,
                billing_zip=data.customer_billing_zip,
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
            db.flush()
            customer_id = new_customer.id

    if customer_id:
        invoice.customer_id = customer_id


    # Revert Inventory for EXISTING items
    for old_item in invoice.items:
        # We need to find the product to revert stock
        prod = db.query(Product).filter(Product.id == old_item.product_id).first()
        if prod:
            # Revert logic:
            # original action: qty_for_amount = x -> stock -= x
            # revert action: stock += x
            
            # Recalculate qty_for_amount logic just to be safe or store it?
            # We didn't store qty_for_amount explicitly but we have unit & quantity/area.
            # Simplified:
            if old_item.unit == Unit.SQFT:
                 qty_for_amt = old_item.area_sqft or 0.0
            else:
                 qty_for_amt = old_item.quantity
            
            stock_delta = qty_for_amt # Positive to revert
            prod.stock_qty = (prod.stock_qty or 0.0) + stock_delta
            
            # Log movement
            move = InventoryMovement(
                product_id=prod.id,
                quantity_change=stock_delta,
                reason="INVOICE_UPDATE_REVERT",
                created_by_user_id=current_user.id,
                owner_id=current_user.owner_id
            )
            db.add(move)
            
    # Delete old items
    # db.delete cascade should handle it if set, but manual delete is safer for ORM listing?
    # invoice.items is a relationship.
    # We can clear it.
    for item in list(invoice.items):
        db.delete(item)
    
    # Process new items (Same logic as Create)
    _process_invoice_items(db, current_user, invoice, data.items)

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
