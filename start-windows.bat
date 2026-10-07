@echo off
REM Double-click to run Tripcast on Windows. Stop with Ctrl+C or by closing the window.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20.9 or newer is required: https://nodejs.org
  start https://nodejs.org/en/download
  pause
  exit /b 1
)

if not exist .env.local (
  copy .env.example .env.local >nul
  echo Created .env.local. Add your GEMINI_API_KEY ^(see README.md^).
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)

start "" cmd /c "timeout /t 6 >nul & start http://localhost:3000"
call npm run dev
