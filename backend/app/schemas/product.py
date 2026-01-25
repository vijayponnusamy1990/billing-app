from pydantic import BaseModel
from app.models.product import Unit, Category

class ProductBase(BaseModel):
    name: str
    category: Category
    base_unit: Unit
    alt_unit: Unit | None = None
    sqft_per_piece: float | None = None
    price_per_sqft: float | None = None
    price_per_piece: float | None = None
    hsn_code: str | None = None
    thickness: str | None = None
    dimension: str | None = None
    gst_rate: float = 0.0
    stock_qty: float = 0.0

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True
