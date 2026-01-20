from sqlalchemy import Column, Integer, String, Float, Enum
from app.db.base_class import Base
import enum

class Unit(str, enum.Enum):
    SQFT = "SQFT"
    PIECE = "PIECE"

class Category(str, enum.Enum):
    PLYWOOD = "PLYWOOD"
    GLASS = "GLASS"
    HARDWARE = "HARDWARE"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(Enum(Category), nullable=False)
    base_unit = Column(Enum(Unit), nullable=False)
    alt_unit = Column(Enum(Unit), nullable=True)
    sqft_per_piece = Column(Float, nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    price_per_piece = Column(Float, nullable=True)
    hsn_code = Column(String, nullable=True)
    gst_rate = Column(Float, default=0.0)
    stock_qty = Column(Float, default=0.0)
