from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime
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
    thickness = Column(String, nullable=True)
    dimension = Column(String, nullable=True)
    gst_rate = Column(Float, default=0.0)
    stock_qty = Column(Float, default=0.0)
    low_stock_limit = Column(Float, default=0.0)
    owner_id = Column(Integer, index=True, nullable=True)

    batches = relationship("ProductBatch", back_populates="product", cascade="all, delete-orphan")

class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    sku = Column(String, nullable=True)
    buying_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    initial_qty = Column(Float, default=0.0)
    current_qty = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="batches")
