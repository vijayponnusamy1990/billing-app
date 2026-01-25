import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'billing.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print(f"Checking if product_batch_id exists in invoice_items in {db_path}...")
        cursor.execute("PRAGMA table_info(invoice_items)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'product_batch_id' not in columns:
            print("Adding product_batch_id column to invoice_items table...")
            # Note: SQLite ALTER TABLE ADD COLUMN has some limitations but for a simple FK reference it should be fine.
            # However, SQLite doesn't strictly enforce FKs unless enabled, but we define it for documentation/future use.
            cursor.execute("ALTER TABLE invoice_items ADD COLUMN product_batch_id INTEGER REFERENCES product_batches(id)")
            conn.commit()
            print("Successfully added product_batch_id column.")
        else:
            print("product_batch_id column already exists.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
