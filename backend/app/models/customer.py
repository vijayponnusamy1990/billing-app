from sqlalchemy import Column, Integer, String
from app.db.base_class import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    # Granular Billing Address
    billing_line1 = Column(String, nullable=True)
    billing_line2 = Column(String, nullable=True)
    billing_city = Column(String, nullable=True)
    billing_state = Column(String, nullable=True)
    billing_zip = Column(String, nullable=True)
    
    # Granular Shipping Address
    shipping_line1 = Column(String, nullable=True)
    shipping_line2 = Column(String, nullable=True)
    shipping_city = Column(String, nullable=True)
    shipping_state = Column(String, nullable=True)
    shipping_zip = Column(String, nullable=True)

    gstin = Column(String, nullable=True)
    state_code = Column(String, nullable=True)
    refer_by = Column(String, nullable=True)
    owner_id = Column(Integer, index=True, nullable=True)
