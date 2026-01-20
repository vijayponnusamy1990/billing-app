from app.db.base_class import Base
# Import all models so they are attached to Base.metadata
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceItem
from app.models.inventory import InventoryMovement
