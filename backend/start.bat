@echo off
title Network Topology Failure Detection - Backend

cd /d "%~dp0"

echo ============================================
echo   NETWORK TOPOLOGY FAILURE DETECTION
echo   BACKEND SERVER
echo ============================================
echo.

if not exist out mkdir out

echo [1/2] Compiling backend...
echo.

javac -d out ^
src\model\NetworkDevice.java ^
src\model\Fault.java ^
src\model\TopologyNode.java ^
src\util\CsvParser.java ^
src\service\DatasetReader.java ^
src\service\FaultDetectionService.java ^
src\service\TopologyService.java ^
src\service\HealthScoreService.java ^
src\Main.java ^
src\ApiServer.java

if errorlevel 1 (
    echo.
    echo ============================================
    echo COMPILATION FAILED
    echo ============================================
    echo.
    pause
    exit /b 1
)

echo.
echo Compilation successful!
echo.

echo [2/2] Starting backend server...
echo.
echo Backend URL:
echo http://localhost:8080
echo.
echo Press CTRL+C to stop the server.
echo ============================================
echo.

java -cp out ApiServer

echo.
echo Backend server stopped.
pause