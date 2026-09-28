@echo off
title Network Topology Failure Detection System

cd /d "%~dp0"

echo ============================================
echo   NETWORK TOPOLOGY FAILURE DETECTION
echo   COMPLETE SYSTEM
echo ============================================
echo.

echo Starting backend...
echo.

start "Network Backend Server" cmd /k "cd /d "%~dp0backend" && start.bat"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Opening frontend...
echo.

start "" "%~dp0frontend\index.html"

echo.
echo ============================================
echo   SYSTEM STARTED
echo ============================================
echo.
echo Backend:
echo http://localhost:8080
echo.
echo Frontend:
echo frontend\index.html
echo.
echo ============================================
echo.
pause