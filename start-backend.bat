@echo off
chcp 65001 > nul
echo ================================================
echo  启动后端 (Spring Boot)
echo ================================================
echo.

REM 设置环境变量
set JAVA_HOME=D:\java
set M2_HOME=D:\tools\apache-maven-3.9.9
set PATH=%JAVA_HOME%\bin;%M2_HOME%\bin;%PATH%

REM 进入后端目录
cd /d "%~dp0backend"

echo 正在启动后端...
echo Java: %JAVA_HOME%
echo Maven: %M2_HOME%
echo.

call "%M2_HOME%\bin\mvn.cmd" spring-boot:run

pause
