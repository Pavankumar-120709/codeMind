#!/usr/bin/env bash
# CodeMind - macOS / Linux Startup Script

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;33m  CodeMind — AI Codebase Understanding Agent\033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

# Start Backend
echo -e "\n\033[1;32m[1/2] Starting Backend FastAPI server...\033[0m"
cd backend
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo -e "\n\033[1;32m[2/2] Starting Frontend Next.js server...\033[0m"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n\033[1;32mCodeMind is running!\033[0m"
echo -e "Backend:  http://localhost:8000"
echo -e "API Docs: http://localhost:8000/docs"
echo -e "Frontend: http://localhost:3000"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
