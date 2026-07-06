@echo off
chcp 65001 > nul
echo ================================================
echo  启动前端 (Vue3 + Vite)
echo ================================================
echo.

REM 进入前端目录
cd /d "%~dp0frontend"

echo 正在启动前端...
echo.

call npm run dev

pause
