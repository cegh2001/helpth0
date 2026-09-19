@echo off
setlocal enabledelayedexpansion

title helpth0 - Clinic Management System

echo ========================================================
echo               HELPTH0 CLINIC SYSTEM
echo ========================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    set PKG_MGR=pnpm
) else (
    set PKG_MGR=npm
)

echo [*] Using package manager: !PKG_MGR!
echo [*] Ensuring local authentication secret...
call !PKG_MGR! run auth:ensure-secret
if %errorlevel% neq 0 (
    echo [ERROR] Authentication secret setup failed.
    pause
    exit /b 1
)

echo [*] Generating Prisma client...
call !PKG_MGR! exec prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma client generation failed.
    pause
    exit /b 1
)

echo [*] Synchronizing the local database...
call !PKG_MGR! exec prisma db push --skip-generate
if %errorlevel% neq 0 (
    echo [ERROR] Database synchronization failed.
    pause
    exit /b 1
)

echo [*] Building production assets...
call !PKG_MGR! run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo [*] Starting local clinic server...
start "" /b !PKG_MGR! run start

echo [*] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [*] Opening helpth0 in your default browser...
start http://127.0.0.1:3000

echo.
echo ========================================================
echo  helpth0 is running at http://127.0.0.1:3000
echo  Keep this terminal window open while using the system.
echo  Press Ctrl+C or close this window to stop the server.
echo ========================================================
echo.

pause
