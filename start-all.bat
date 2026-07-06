@echo off
chcp 65001 > nul
echo ================================================
echo  仿黑客松平台 - 一键启动所有服务
echo ================================================
echo.

REM 检查 Java
java -version > nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Java，请安装 Java 1.8+
    pause
    exit /b 1
)

REM 检查 Node.js
node -v > nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请安装 Node.js 16+
    pause
    exit /b 1
)

REM 检查 MySQL 是否运行
netstat -ano | findstr ":3306" > nul
if errorlevel 1 (
    echo [警告] MySQL 可能未启动，请先启动 MySQL 服务
    echo 按任意键继续（如果 MySQL 已启动请忽略）...
    pause > nul
)

echo.
echo 正在启动后端和前端服务...
echo 后端: http://localhost:8080
echo 前端: http://localhost:5173
echo.
echo 提示: 关闭窗口即可停止服务
echo ================================================
echo.

REM 启动后端（新窗口）
start "后端 Spring Boot" cmd /k "cd /d "%~dp0backend" && set JAVA_HOME=D:\java && set M2_HOME=D:\tools\apache-maven-3.9.9 && set PATH=%%JAVA_HOME%%\bin;%%M2_HOME%%\bin;%%PATH%% && "%M2_HOME%\bin\mvn.cmd" spring-boot:run"

REM 等待3秒让后端先启动
timeout /t 3 /nobreak > nul

REM 启动前端（新窗口）
start "前端 Vue3+Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo 服务已启动！请查看弹出的命令窗口
echo.
pause
