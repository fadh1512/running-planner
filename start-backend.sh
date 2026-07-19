#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "Starting backend at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
uvicorn app.main:app --reload --port 8000
