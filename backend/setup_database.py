"""
Unified Database Setup Script
Run this script to set up or reset your database with test data including Multi-Tenancy.
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.product import Product, ProductBatch, Unit, Category
from app.models.user import User, UserRole
from app.models.owner import Owner
from app.core.security import get_password_hash


def create_tables():
    """Create all database tables"""
    print("\n📋 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")


def seed_owners(db: Session):
    """Seed initial owners"""
    print("\n🏢 Seeding owners...")
    
    owners_data = [
        {"name": "Billing App Admin", "title": "Billing App", "domain": "localhost"},
        {"name": "Gokul Hardwares", "title": "Gokul Hardwares and Playwoods", "domain": "gokul.com"},
        {"name": "Aaravi Hardwares", "title": "Aaravi Hardwares and Products", "domain": "arravi.com"},
    ]
    
    created_owners = {}
    
    for data in owners_data:
        owner = db.query(Owner).filter(Owner.domain == data["domain"]).first()
        if not owner:
            print(f"  Creating Owner: {data['name']} ({data['domain']})")
            owner = Owner(
                name=data["name"],
                company_title=data["title"],
                domain=data["domain"]
            )
            db.add(owner)
            db.flush() # Get ID
        else:
            print(f"  Owner exists: {data['name']}")
        
        created_owners[data["domain"]] = owner
        
    db.commit()
    print("✅ Owners seeded successfully")
    return created_owners


def seed_users(db: Session, owners):
    """Seed initial users for each owner"""
    print("\n👥 Seeding users...")
    
    # helper to get owner id by domain
    def get_oid(domain):
        return owners[domain].id if domain in owners else None

    # Define users for each tenant
    users = [
        # Localhost / Default Admin
        {"email": "admin@example.com", "name": "Super Admin", "role": UserRole.ADMIN, "owner": "localhost"},
        
        # Gokul Hardwares
        {"email": "admin@gokul.com", "name": "Gokul Admin", "role": UserRole.ADMIN, "owner": "gokul.com"},
        {"email": "manager@gokul.com", "name": "Gokul Manager", "role": UserRole.MANAGER, "owner": "gokul.com"},
        
        # Aaravi Hardwares
        {"email": "admin@arravi.com", "name": "Aaravi Admin", "role": UserRole.ADMIN, "owner": "arravi.com"},
    ]

    for u in users:
        user = db.query(User).filter(User.email == u["email"]).first()
        owner_id = get_oid(u["owner"])
        
        if not user:
            print(f"  Creating {u['role']} user: {u['email']} for {u['owner']}")
            new_user = User(
                email=u["email"],
                full_name=u["name"],
                hashed_password=get_password_hash("admin123"), # Default password
                role=u["role"],
                is_active=True,
                owner_id=owner_id
            )
            db.add(new_user)
        else:
            print(f"  User {u['email']} already exists")
            # Update owner if missing
            if user.owner_id is None and owner_id:
                user.owner_id = owner_id
                db.add(user)
    
    db.commit()
    print("✅ Users seeded successfully")


def seed_products(db: Session, owners: dict):
    print("Seeding products...")
    import random
    
    # Templates for random generation
    modifiers = ["Premium", "Standard", "Waterproof", "Commercial", "Teak", "Matte", "Glossy", "Royal", "Elite", "Classic"]
    
    types = [
        {"name": "Plywood", "category": Category.PLYWOOD, "base_unit": Unit.PIECE, "dims": ["8x4", "7x4", "6x4"], "thick": ["6mm", "12mm", "18mm", "19mm", "25mm"], "base_price": 50}, # Base price per sqft approx
        {"name": "Laminate", "category": Category.PLYWOOD, "base_unit": Unit.PIECE, "dims": ["8x4"], "thick": ["0.8mm", "1mm", "1.25mm"], "base_price": 700}, # Base per sheet (low end)
        {"name": "Glass", "category": Category.GLASS, "base_unit": Unit.SQFT, "dims": ["Custom"], "thick": ["4mm", "5mm", "6mm", "8mm", "10mm", "12mm"], "base_price": 65}, # Per sqft
        {"name": "Handle", "category": Category.HARDWARE, "base_unit": Unit.PIECE, "dims": ["4 inch", "6 inch", "8 inch", "12 inch"], "thick": [""], "base_price": 150},
        {"name": "Lock", "category": Category.HARDWARE, "base_unit": Unit.PIECE, "dims": ["Main Door", "Bedroom", "Bathroom"], "thick": [""], "base_price": 550},
        {"name": "Hinge", "category": Category.HARDWARE, "base_unit": Unit.PIECE, "dims": ["L-Type", "W-Type", "Hydraulic"], "thick": ["0 crank", "8 crank", "16 crank"], "base_price": 120},
    ]

    for owner_key, owner in owners.items():
        print(f"  Generating seeded products for {owner.name}...")
        
        # Check current count to avoid duplicate huge seeding
        current_count = db.query(Product).filter(Product.owner_id == owner.id).count()
        needed = 50 - current_count
        
        if needed <= 0:
            print(f"    Owner {owner.name} already has {current_count} products. Skipping generation.")
            continue

        print(f"    Creating {needed} new products...")

        for i in range(needed):
            p_type = random.choice(types)
            modifier = random.choice(modifiers)
            dim = random.choice(p_type["dims"])
            thick = random.choice(p_type["thick"])
            
            # Construct Name
            name_parts = [modifier, p_type['name']]
            if thick: name_parts.insert(0, thick)
            if dim and dim != "Custom": name_parts.append(dim)
            
            name = " ".join(name_parts)
            
            # Pricing Logic
            buying_price = 0
            selling_price = 0
            sqft_per_piece = 0
            price_per_sqft = 0
            
            # 1. Calculation initialization
            base_cost = p_type["base_price"] * random.uniform(0.9, 1.4)
            
            if p_type["category"] == Category.PLYWOOD and p_type["base_unit"] == Unit.PIECE:
                # Plywood Sheet Pricing
                area = 32 # Default 8x4
                if "7x4" in dim: area = 28
                elif "6x4" in dim: area = 24
                elif "7x3" in dim: area = 21
                
                sqft_per_piece = area
                
                # Using heuristic pricing
                # If laminate (which is Plywood category in this simplified model but names differ)
                if p_type["name"] == "Laminate":
                    selling_price = int(base_cost * random.uniform(1.2, 1.6))
                    price_per_sqft = round(selling_price / area, 2)
                else:
                    # Plywood logic: base_cost is roughly per sqft for standard thickness (say 12mm)
                    # Adjust for thickness
                    mm = 12
                    if "mm" in thick:
                        try: mm = float(thick.replace("mm",""))
                        except: pass
                    
                    adjusted_cost = base_cost * (mm / 12) 
                    selling_price = int(adjusted_cost * area * random.uniform(1.1, 1.3))
                    price_per_sqft = round(selling_price / area, 2)
                    
            elif p_type["category"] == Category.GLASS:
                 # Glass is per SqFt usually
                 # base_cost is per sqft for 4mm
                 mm = 4
                 if "mm" in thick:
                    try: mm = float(thick.replace("mm",""))
                    except: pass
                 
                 adjusted_sqft_cost = base_cost * (mm / 4) 
                 selling_price = int(adjusted_sqft_cost * random.uniform(1.3, 1.8))
                 # For unit=SQFT, selling_price is price per sqft
                 
            else:
                # Hardware / per piece
                selling_price = int(base_cost * random.uniform(1.3, 1.8))
            
            # Buying Price
            buying_price = int(selling_price * 0.70)
            stock = random.randint(10, 300)

            # Create Product
            product = Product(
                name=name,
                category=p_type["category"],
                base_unit=p_type["base_unit"],
                stock_qty=stock,
                price_per_piece=selling_price,
                price_per_sqft=price_per_sqft if price_per_sqft > 0 else None,
                sqft_per_piece=sqft_per_piece if sqft_per_piece > 0 else None,
                thickness=thick,
                dimension=dim,
                gst_rate=18,
                owner_id=owner.id
            )
            
            db.add(product)
            db.flush()

            # Create Batch
            batch = ProductBatch(
                product_id=product.id,
                sku=f"AUTO-{owner.id}-{random.randint(10000,99999)}",
                buying_price=buying_price,
                selling_price=selling_price,
                initial_qty=stock,
                current_qty=stock
            )
            db.add(batch)
            
    db.commit()
    print("✅ Products seeded successfully")


def setup_database():
    """Main setup function"""
    print("=" * 70)
    print("🚀 DATABASE SETUP - Billing App (Multi-Tenant)")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Step 1: Create tables
        create_tables()
        
        # Step 2: Seed Owners
        owners = seed_owners(db)
        
        # Step 3: Seed Users
        seed_users(db, owners)
        
        # Step 4: Seed Products
        seed_products(db, owners)
        
        print("\n" + "=" * 70)
        print("✅ DATABASE SETUP COMPLETE!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    setup_database()


if __name__ == "__main__":
    setup_database()
