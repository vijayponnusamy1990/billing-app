from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.user import UserRole

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 404 # No root route defined in main.py, likely valid

def test_login_and_create_product():
    # Login
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Product
    product_data = {
        "name": "Test Plywood",
        "category": "PLYWOOD",
        "base_unit": "PIECE",
        "stock_qty": 100,
        "price_per_sqft": 50.0,
        "price_per_piece": 2000.0,
        "thickness": "12mm",
        "dimension": "8x4"
    }
    response = client.post("/api/products/", json=product_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Plywood"
    assert data["id"] is not None

    # List Products
    response = client.get("/api/products/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
