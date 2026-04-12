@echo off
echo Starting NeuroVia...
cd /d "%~dp0"

echo Starting Backend (Port 8000)...
start "NeuroVia Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend (Port 3001)...
start "NeuroVia Frontend" cmd /k "cd frontend && npm run dev"

echo Done! Both servers are starting up in new windows.
pause
