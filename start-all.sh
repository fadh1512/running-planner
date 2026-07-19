#!/bin/bash
BASEDIR="$(cd "$(dirname "$0")" && pwd)"
echo "Starting Running Planner..."
echo ""

# Start backend in background
cd "$BASEDIR/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 4

# Start frontend
cd "$BASEDIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "==========================================="
echo "  Running Planner is live!"
echo "==========================================="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "==========================================="
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
