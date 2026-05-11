#!/bin/bash

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "=================================================="
echo "Starting PPT-V2 Development Servers"
echo "=================================================="

# Start Backend
echo "[1/2] Starting Backend Server (FastAPI)..."
cd backend || exit 1
source venv/bin/activate || { echo "Failed to activate virtual environment. Is venv created?"; exit 1; }
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "[2/2] Starting Frontend Server (Vite)..."
cd frontend || exit 1
npm run dev &
FRONTEND_PID=$!
cd ..

echo "=================================================="
echo "Servers are running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers."
echo "=================================================="

# Wait for background processes to keep the script running
wait $BACKEND_PID $FRONTEND_PID
