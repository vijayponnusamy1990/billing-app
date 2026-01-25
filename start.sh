#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    # Kill background processes
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting Billing App..."

# Start Backend
echo "📡 Starting Backend..."
cd backend
if [ ! -d "venv" ] || [ ! -f "venv/bin/activate" ]; then
    echo "❌ Backend environment not found or incomplete."
    echo "👉 Running setup.sh for you..."
    ./setup.sh
fi
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "💻 Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "❌ Frontend dependencies not found."
    echo "👉 Installing npm dependencies (this may take a minute)..."
    npm install
fi

# Run dev server. host is handled in vite.config.ts now, but we use npm run dev
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both services are starting!"
echo "--------------------------------------------------"
echo "🌐 Backend API:  http://localhost:8000"
echo "🌐 Frontend UI:   http://localhost (Port 80)"
echo "--------------------------------------------------"
echo "💡 Tip: If running on a VM, use the public IP instead of localhost."
echo "⌨️  Press Ctrl+C to stop both services."
echo ""

# Wait for background processes
wait
