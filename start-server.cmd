@echo off
rem ==========================================================================
rem  Aetheria Grand Prix - chay may chu game + Cloudflare Tunnel tren Windows.
rem  Bam dup file nay. Lan dau se duoc hoi Cloudflare Tunnel token: dan vao
rem  (chuot phai hoac Ctrl+V) roi Enter. Token duoc luu trong file .env
rem  (khong bi dua len GitHub); lan sau bam dup la chay, khong hoi lai.
rem  May chua co Node.js 20.11+: tu tai ban portable vao thu muc runtime
rem  Chua co cloudflared: tu tai ban chinh thuc cua Cloudflare vao thu muc bin
rem  Tat may chu: dong cua so nay.
rem ==========================================================================
setlocal
pushd "%~dp0"
title Aetheria Grand Prix

call :check_node && goto run
if exist "runtime\node\node.exe" goto portable
echo Chua co Node.js 20.11+ tren may nay - dang tai ban portable vao runtime\node ...
powershell -NoProfile -ExecutionPolicy Bypass -File "deploy\get-node.ps1"
if not exist "runtime\node\node.exe" goto no_node

:portable
set "PATH=%~dp0runtime\node;%PATH%"

:run
node run.mjs %*
echo.
echo May chu da dung. Bam phim bat ky de dong cua so.
pause >nul
exit /b

:check_node
where node >nul 2>nul || exit /b 1
node -e "const [a,b]=process.versions.node.split('.');process.exit(a*100+ +b>=2011?0:1)" >nul 2>nul
exit /b

:no_node
echo.
echo Khong tai duoc Node.js. Cai Node.js 20.11+ tu https://nodejs.org roi bam dup lai file nay.
pause
exit /b 1
