"""
Unified Database Setup Script
Combines: seed_products, migrate_products_to_piece, and migrate_batches
Run this script to set up or reset your database with test data.
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.product import Product, ProductBatch, Unit, Category
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_tables():
    """Create all database tables"""
    print("\n📋 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")


def seed_users(db: Session):
    """Seed initial users"""
    print("\n👥 Seeding users...")
    
    users = [
        {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password": "admin123",
            "role": UserRole.ADMIN
        },
        {
            "email": "manager@example.com",
            "full_name": "Store Manager",
            "password": "manager123",
            "role": UserRole.MANAGER
        },
        {
            "email": "sales@example.com",
            "full_name": "Sales Rep",
            "password": "sales123",
            "role": UserRole.SALES
        }
    ]

    for user_data in users:
        user = db.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            print(f"  Creating {user_data['role']} user: {user_data['email']}")
            new_user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True
            )
            db.add(new_user)
        else:
            print(f"  User {user_data['email']} already exists")
    
    db.commit()
    print("✅ Users seeded successfully")


def seed_products(db: Session):
    """Seed products with piece-only pricing"""
    print("\n📦 Seeding products...")
    
    products = [
        # Plywood - All priced per piece (8x4 sheet = 32 sqft)
        {
            "name": "Plywood Birch",
            "category": Category.PLYWOOD,
            "base_unit": Unit.PIECE,
            "price_per_piece": 1440.0,  # 45/sqft × 32 sqft
            "thickness": "6mm",
            "gst_rate": 18.0,
            "stock_qty": 500.0,
            "hsn_code": "4412"
        },
        {
            "name": "Plywood Birch",
            "category": Category.PLYWOOD,
            "base_unit": Unit.PIECE,
            "price_per_piece": 2080.0,  # 65/sqft × 32 sqft
            "thickness": "12mm",
            "gst_rate": 18.0,
            "stock_qty": 300.0,
            "hsn_code": "4412"
        },
        {
            "name": "Plywood Birch",
            "category": Category.PLYWOOD,
            "base_unit": Unit.PIECE,
            "price_per_piece": 2720.0,  # 85/sqft × 32 sqft
            "thickness": "18mm",
            "gst_rate": 18.0,
            "stock_qty": 200.0,
            "hsn_code": "4412"
        },
        {
            "name": "Marine Plywood",
            "category": Category.PLYWOOD,
            "base_unit": Unit.PIECE,
            "price_per_piece": 3520.0,  # 110/sqft × 32 sqft
            "thickness": "19mm",
            "gst_rate": 18.0,
            "stock_qty": 150.0,
            "hsn_code": "4412"
        },
        
        # Glass - All priced per piece (8x4 sheet = 32 sqft)
        {
            "name": "Clear Glass",
            "category": Category.GLASS,
            "base_unit": Unit.PIECE,
            "price_per_piece": 800.0,  # 25/sqft × 32 sqft
            "thickness": "4mm",
            "gst_rate": 12.0,
            "stock_qty": 1000.0,
            "hsn_code": "7005"
        },
        {
            "name": "Clear Glass",
            "category": Category.GLASS,
            "base_unit": Unit.PIECE,
            "price_per_piece": 1120.0,  # 35/sqft × 32 sqft
            "thickness": "6mm",
            "gst_rate": 12.0,
            "stock_qty": 800.0,
            "hsn_code": "7005"
        },
        {
            "name": "Toughened Glass",
            "category": Category.GLASS,
            "base_unit": Unit.PIECE,
            "price_per_piece": 3840.0,  # 120/sqft × 32 sqft
            "thickness": "10mm",
            "gst_rate": 12.0,
            "stock_qty": 200.0,
            "hsn_code": "7005"
        },
        {
            "name": "Toughened Glass",
            "category": Category.GLASS,
            "base_unit": Unit.PIECE,
            "price_per_piece": 4800.0,  # 150/sqft × 32 sqft
            "thickness": "12mm",
            "gst_rate": 12.0,
            "stock_qty": 100.0,
            "hsn_code": "7005"
        },
        {
            "name": "Frosted Glass",
            "category": Category.GLASS,
            "base_unit": Unit.PIECE,
            "price_per_piece": 1760.0,  # 55/sqft × 32 sqft
            "thickness": "5mm",
            "gst_rate": 12.0,
            "stock_qty": 400.0,
            "hsn_code": "7005"
        },

        # Hardware - Already piece-based
        {
            "name": "Door Hinge SS",
            "category": Category.HARDWARE,
            "base_unit": Unit.PIECE,
            "price_per_piece": 85.0,
            "dimension": "4 inch",
            "gst_rate": 18.0,
            "stock_qty": 1000.0,
            "hsn_code": "8302"
        },
        {
            "name": "Cabinet Handle Brass",
            "category": Category.HARDWARE,
            "base_unit": Unit.PIECE,
            "price_per_piece": 145.0,
            "dimension": "6 inch",
            "gst_rate": 18.0,
            "stock_qty": 500.0,
            "hsn_code": "8302"
        },
        {
            "name": "Drawer Slide",
            "category": Category.HARDWARE,
            "base_unit": Unit.PIECE,
            "price_per_piece": 320.0,
            "dimension": "18 inch",
            "gst_rate": 18.0,
            "stock_qty": 200.0,
            "hsn_code": "8302"
        },
        {
            "name": "Mortise Lock Set",
            "category": Category.HARDWARE,
            "base_unit": Unit.PIECE,
            "price_per_piece": 1850.0,
            "gst_rate": 18.0,
            "stock_qty": 50.0,
            "hsn_code": "8301"
        },
        {
            "name": "SDS Screws",
            "category": Category.HARDWARE,
            "base_unit": Unit.PIECE,
            "price_per_piece": 1.5,
            "dimension": "25mm",
            "gst_rate": 18.0,
            "stock_qty": 5000.0,
            "hsn_code": "7318"
        }
    ]

    for prod_data in products:
        # Check if product exists
        existing = db.query(Product).filter(
            Product.name == prod_data["name"],
            Product.thickness == prod_data.get("thickness"),
            Product.dimension == prod_data.get("dimension")
        ).first()
        
        if not existing:
            print(f"  Adding: {prod_data['name']} ({prod_data.get('thickness') or prod_data.get('dimension') or 'N/A'})")
            db.add(Product(**prod_data))
        else:
            print(f"  Exists: {prod_data['name']}")
    
    db.commit()
    print("✅ Products seeded successfully")


def migrate_products_to_piece(db: Session):
    """Migrate any existing SQFT products to PIECE"""
    print("\n🔄 Migrating products to PIECE-only system...")
    
    products = db.query(Product).all()
    migrated_count = 0
    
    for product in products:
        if product.base_unit == Unit.SQFT:
            print(f"  Converting: {product.name} from SQFT to PIECE")
            
            # Calculate piece price if not set
            if product.price_per_sqft and not product.price_per_piece:
                standard_sheet_sqft = 32  # 8x4 sheet
                product.price_per_piece = product.price_per_sqft * standard_sheet_sqft
                print(f"    Price: ₹{product.price_per_piece} (₹{product.price_per_sqft}/sqft × {standard_sheet_sqft})")
            
            product.base_unit = Unit.PIECE
            migrated_count += 1
    
    db.commit()
    
    if migrated_count > 0:
        print(f"✅ Migrated {migrated_count} products to PIECE")
    else:
        print("✅ All products already using PIECE")


def create_initial_batches(db: Session):
    """Create initial product batches for inventory tracking"""
    print("\n📊 Creating initial product batches...")
    
    products = db.query(Product).all()
    created_count = 0
    
    for product in products:
        if not product.batches:
            price = product.price_per_piece or 0.0
            
            batch = ProductBatch(
                product_id=product.id,
                sku="INITIAL",
                buying_price=0.0,  # Unknown for initial stock
                selling_price=price,
                initial_qty=product.stock_qty,
                current_qty=product.stock_qty
            )
            db.add(batch)
            created_count += 1
            print(f"  Created batch for: {product.name} (Stock: {product.stock_qty})")
    
    db.commit()
    
    if created_count > 0:
        print(f"✅ Created {created_count} initial batches")
    else:
        print("✅ All products already have batches")


def setup_database():
    """Main setup function"""
    print("=" * 70)
    print("🚀 DATABASE SETUP - Billing App")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Step 1: Create tables
        create_tables()
        
        # Step 2: Seed users
        seed_users(db)
        
        # Step 3: Seed products
        seed_products(db)
        
        # Step 4: Migrate any SQFT products to PIECE
        migrate_products_to_piece(db)
        
        # Step 5: Create initial batches
        create_initial_batches(db)
        
        print("\n" + "=" * 70)
        print("✅ DATABASE SETUP COMPLETE!")
        print("=" * 70)
        print("\n📝 Login Credentials:")
        print("  Admin:   admin@example.com / admin123")
        print("  Manager: manager@example.com / manager123")
        print("  Sales:   sales@example.com / sales123")
        print()
        
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    setup_database()
