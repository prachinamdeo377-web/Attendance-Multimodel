@echo off
echo ================================================================
echo  Starting Multimodal Attendance Agent (Single Unified Link)
echo ================================================================
echo.
echo Both Frontend UI and Backend API will be available at:
echo    http://127.0.0.1:8000
echo.

:: Check if frontend dist exists, build if missing
if not exist "%~dp0\frontend\dist" (
    echo Building frontend for unified serving...
    cd /d "%~dp0\frontend"
    call npm run build
    cd /d "%~dp0"
)

:: Launch browser after 2 seconds
start /b cmd /c "timeout /t 2 >nul & start http://127.0.0.1:8000"

:: Start unified FastAPI server
cd /d "%~dp0\backend"
..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

