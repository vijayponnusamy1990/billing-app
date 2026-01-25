import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "billing.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"Migrating database at {db_path}...")

    # Add columns to products table
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN thickness TEXT")
        print("Added thickness to products")
    except sqlite3.OperationalError:
        print("thickness already exists in products")

    try:
        cursor.execute("ALTER TABLE products ADD COLUMN dimension TEXT")
        print("Added dimension to products")
    except sqlite3.OperationalError:
        print("dimension already exists in products")

    # Add columns to invoice_items table
    try:
        cursor.execute("ALTER TABLE invoice_items ADD COLUMN thickness TEXT")
        print("Added thickness to invoice_items")
    except sqlite3.OperationalError:
        print("thickness already exists in invoice_items")

    try:
        cursor.execute("ALTER TABLE invoice_items ADD COLUMN dimension TEXT")
        print("Added dimension to invoice_items")
    except sqlite3.OperationalError:
        print("dimension already exists in invoice_items")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
