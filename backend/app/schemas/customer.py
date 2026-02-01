from pydantic import BaseModel

class CustomerBase(BaseModel):
    name: str
    phone: str | None = None
    
    # Granular fields
    billing_line1: str | None = None
    billing_line2: str | None = None
    billing_city: str | None = None
    billing_state: str | None = None
    billing_zip: str | None = None
    
    shipping_line1: str | None = None
    shipping_line2: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_zip: str | None = None

    gstin: str | None = None
    state_code: str | None = None
    refer_by: str | None = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    billing_line1: str | None = None
    billing_line2: str | None = None
    billing_city: str | None = None
    billing_state: str | None = None
    billing_zip: str | None = None
    shipping_line1: str | None = None
    shipping_line2: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_zip: str | None = None
    gstin: str | None = None
    state_code: str | None = None
    refer_by: str | None = None

class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True
