@echo off
echo Starting Multimodal Attendance & Engagement Agent...
start "Multimodal Agent - Backend API" cmd /k "run_backend.bat"
start "Multimodal Agent - React UI" cmd /k "run_frontend.bat"
echo Both servers launched! Opening browser at http://localhost:5173 ...
timeout /t 3 >nul
start http://localhost:5173
