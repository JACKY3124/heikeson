@echo off
chcp 65001 > nul
echo ================================================
echo  启动前端 (React + Vite)
echo ================================================
echo.

REM 进入前端目录
cd /d "%~dp0frontend"

REM 检查 node_modules 是否包含 React
if not exist "node_modules\react" (
    echo 检测到前端依赖有变化，正在安装依赖...
    echo.
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo 依赖安装完成
    echo.
)

echo 正在启动前端...
echo.

call npm run dev

pause
