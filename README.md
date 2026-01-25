# 🧾 Billing & Inventory Management System

A full-stack Point of Sale (POS) and Inventory Management system built with Python (FastAPI) and React (Vite). Ideal for hardware businesses tracking items by piece or square footage (e.g., Plywood, Glass).

---

## 🏗 Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Pydantic, SQLite (Local) / Postgres (Docker).
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (v4), Axios, React Router.
- **Containerization**: Docker, Docker Compose.

---

## 🚀 Running with Docker (Recommended)

The easiest way to run the entire stack (Backend + Frontend + Database) is using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed.

### Steps

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone <repository-url>
   cd billing-app
   ```

2. **Build and Run**:

   ```bash
   docker-compose up --build
   ```

   *This command builds the images and starts the containers in the foreground.*

3. **Access the Application**:
   - **Frontend**: [http://localhost](http://localhost)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Database**: PostgreSQL running on port `5432`.

4. **Default Credentials**:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

---

## 🛠 Running Locally (Manual Setup)

If you prefer to run the services separately without Docker.

### 1. Backend Setup

1. **Navigate to the backend directory**:

   ```bash
   cd backend
   ```

2. **Run the setup script**:
   *This script creates a virtual environment, installs dependencies, and seeds the database.*

   ```bash
   ./setup.sh
   # Note the credentials printed at the end.
   ```

3. **Start the Development Server**:

   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn app.main:app --reload
   ```

   *The backend will run at [http://localhost:8000](http://localhost:8000).*

### 2. Frontend Setup

1. **Navigate to the frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Start the Development Server**:

   ```bash
   ./run_dev.sh
   # OR
   npm run dev
   ```

   *The frontend will run at [http://localhost](http://localhost).*

---

## 📚 Key Features

- **Authentication**: Secure JWT-based login with role management (Admin, Manager, Sales).
- **Inventory**:
  - Track stock by **Unit** (Piece vs Sq. Ft).
  - Dual pricing support (Price per Piece / Price per Sq. Ft).
- **Billing**:
  - Dynamic invoice generation.
  - Auto-calculation of area ($Length \times Width$) for sheet materials.
  - Automatic stock deduction upon invoice creation.
- **Reports**:
  - **Daily Sales**: Visualization of revenue trends.
  - **Product Sales**: Insights into top-selling categories and items.

## 📂 Project Structure

```
billing-app/
├── backend/            # FastAPI Application
│   ├── app/            # Source code (Models, APIs, Core logic)
│   ├── venv/           # Virtual Environment (excluded from git)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/           # React Application
│   ├── src/            # Source code (Components, Pages, Hooks)
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml  # Container Orchestration
```
