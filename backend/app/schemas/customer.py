from pydantic import BaseModel

class CustomerBase(BaseModel):
    name: str
    phone: str | None = None
    address: str | None = None
    gstin: str | None = None
    state_code: str | None = None

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True
