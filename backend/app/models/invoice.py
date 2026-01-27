from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base
from app.models.product import Unit

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, unique=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total_taxable = Column(Float, default=0.0)
    total_cgst = Column(Float, default=0.0)
    total_sgst = Column(Float, default=0.0)
    total_igst = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    notes = Column(String, nullable=True)

    customer = relationship("Customer")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_batch_id = Column(Integer, ForeignKey("product_batches.id"), nullable=True)

    description = Column(String, nullable=True)
    thickness = Column(String, nullable=True)
    dimension = Column(String, nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(Enum(Unit), nullable=False)
    length_ft = Column(Float, nullable=True)
    width_ft = Column(Float, nullable=True)
    area_sqft = Column(Float, nullable=True)
    rate = Column(Float, nullable=False)
    taxable_amount = Column(Float, nullable=False)
    cgst_rate = Column(Float, default=0.0)
    sgst_rate = Column(Float, default=0.0)
    igst_rate = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)

    @property
    def hsn_code(self):
        return self.product.hsn_code if self.product else None

    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
    batch = relationship("app.models.product.ProductBatch")
