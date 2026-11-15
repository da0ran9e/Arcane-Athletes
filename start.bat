@echo off
rem Windows: start the game server and the Cloudflare tunnel. Double-click this file.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20.11+ is required: https://nodejs.org
  pause
  exit /b 1
)
node run.mjs %*
pause
