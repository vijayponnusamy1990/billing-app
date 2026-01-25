#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting Billing App..."

# Start Backend
echo "Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run backend/setup.sh first."
    exit 1
fi
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Please run npm install in frontend directory."
    exit 1
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both services are starting!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173" # Vite default port
echo "Press Ctrl+C to stop both services."

# Wait for background processes
wait
