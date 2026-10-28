@echo off
echo ========================================================
echo  Starting Multimodal Attendance Agent Backend API Server
echo ========================================================
cd /d "%~dp0\backend"
..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
