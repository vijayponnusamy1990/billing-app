from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    with engine.connect() as conn:
        print("Running migration v5: Adding payment fields to invoices table...")
        
        # Check if columns exist to avoid errors might be overkill for this simple script, 
        # but safely adding them is better.
        # SQLite doesn't support 'IF NOT EXISTS' in ADD COLUMN well in all versions, 
        # but we assume they don't exist yet.
        
        try:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN payment_status VARCHAR DEFAULT 'PENDING'"))
            print("Added payment_status column.")
        except Exception as e:
            print(f"Skipping payment_status (might exist): {e}")

        try:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN payment_mode VARCHAR"))
            print("Added payment_mode column.")
        except Exception as e:
            print(f"Skipping payment_mode (might exist): {e}")
            
        conn.commit()
    print("Migration v5 completed.")

if __name__ == "__main__":
    migrate()
