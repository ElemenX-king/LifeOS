@echo off
title LifeOS 一键安装
echo ===================================
echo    LifeOS 本地部署 —— 一键安装
echo ===================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] 未找到 Node.js —— 请先安装
    echo     下载地址: https://nodejs.org （点左边 LTS）
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [√] Node.js %NODE_VER%

:: Check Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] 未找到 Git —— 请先安装
    echo     下载地址: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
echo [√] Git 已安装

:: Clone or update
if exist "LifeOS\.git" (
    echo.
    echo [→] 已有 LifeOS，拉取最新代码...
    cd LifeOS
    git pull
) else (
    echo.
    echo [→] 下载 LifeOS...
    git clone https://github.com/ElemenX-king/LifeOS.git
    cd LifeOS
)

:: Install & build & start
echo.
echo [→] 安装依赖（首次约 2-3 分钟）...
call npm install
echo.
echo [→] 构建前端...
call npm run build
echo.
echo ===================================
echo    安装完成！启动服务中...
echo    浏览器打开 → http://localhost:3000
echo    ★ 不要关闭此窗口！关闭 = 服务停止
echo ===================================
echo.
call npm run start:local
