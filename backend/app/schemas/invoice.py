from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.models.product import Unit
from app.schemas.customer import CustomerOut

class InvoiceItemCreate(BaseModel):
    product_id: int
    description: str | None = None
    thickness: str | None = None
    dimension: str | None = None
    quantity: float
    unit: Unit
    length_ft: float | None = None
    width_ft: float | None = None
    area_sqft: float | None = None

class InvoiceCreate(BaseModel):
    invoice_no: str
    customer_id: int | None = None
    # Input fields for creating a new customer on the fly
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_address: str | None = None
    customer_gstin: str | None = None
    date: datetime | None = None  # Optional override
    notes: str | None = None
    items: List[InvoiceItemCreate]

class InvoiceItemOut(BaseModel):
    id: int
    product_id: int
    description: str | None
    thickness: str | None = None
    dimension: str | None = None
    quantity: float
    unit: Unit
    area_sqft: float | None
    rate: float
    taxable_amount: float
    cgst_rate: float
    sgst_rate: float
    igst_rate: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float

    class Config:
        from_attributes = True

class InvoiceOut(BaseModel):
    id: int
    invoice_no: str
    date: datetime
    total_taxable: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    grand_total: float
    round_off: float
    customer: CustomerOut | None = None
    items: List[InvoiceItemOut]

    class Config:
        from_attributes = True
