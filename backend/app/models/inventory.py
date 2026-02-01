from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_change = Column(Float, nullable=False)
    reason = Column(String, nullable=False)  # SALE, PURCHASE, ADJUSTMENT
    ref_invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, index=True, nullable=True)

    product = relationship("Product")
