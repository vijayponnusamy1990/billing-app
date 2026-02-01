from pydantic import BaseModel
from typing import Optional

class OwnerBase(BaseModel):
    name: str
    company_title: str
    logo_url: Optional[str] = None
    domain: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class OwnerCreate(OwnerBase):
    pass

class OwnerUpdate(OwnerBase):
    pass

class Owner(OwnerBase):
    id: int

    class Config:
        from_attributes = True
