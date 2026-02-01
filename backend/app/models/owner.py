from sqlalchemy import Column, Integer, String, Text
from app.db.base_class import Base

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company_title = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    domain = Column(String, unique=True, index=True, nullable=True) # e.g., localhost, or tenant.app.com
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
