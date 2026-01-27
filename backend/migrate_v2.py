import sqlite3
import os

DB_PATH = "billing.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # details of columns to add
    # table, column, type, default
    columns_to_add = [
        ("customers", "billing_address", "TEXT", None),
        ("customers", "shipping_address", "TEXT", None),
        ("products", "low_stock_limit", "REAL", 0.0)
    ]

    for table, col, col_type, default in columns_to_add:
        try:
            # Check if column exists
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [info[1] for info in cursor.fetchall()]
            if col not in columns:
                print(f"Adding column {col} to {table}...")
                alter_query = f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"
                if default is not None:
                    alter_query += f" DEFAULT {default}"
                cursor.execute(alter_query)
            else:
                print(f"Column {col} already exists in {table}.")
        except Exception as e:
            print(f"Error adding {col} to {table}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
