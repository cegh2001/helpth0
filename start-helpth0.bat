@echo off
setlocal enabledelayedexpansion

title helpth0 - Clinic Management System

echo ========================================================
echo               HELPTH0 CLINIC SYSTEM
echo ========================================================
echo.

set "APP_DIR=%~dp0"
if exist "!APP_DIR!package.json" if exist "!APP_DIR!scripts\ensure-auth-secret.mjs" goto project_found

if defined HELPTH0_HOME (
    set "APP_DIR=!HELPTH0_HOME!"
    if not "!APP_DIR:~-1!"=="\" set "APP_DIR=!APP_DIR!\"
    if exist "!APP_DIR!package.json" if exist "!APP_DIR!scripts\ensure-auth-secret.mjs" goto project_found
)

set "APP_DIR=%USERPROFILE%\Documents\GitHub\helpth0\"
if exist "!APP_DIR!package.json" if exist "!APP_DIR!scripts\ensure-auth-secret.mjs" goto project_found

echo [ERROR] Could not find the helpth0 project folder.
echo Keep this file inside the project, create a shortcut instead of copying it,
echo or define HELPTH0_HOME with the full project path.
pause
exit /b 1

:project_found
cd /d "!APP_DIR!"
if %errorlevel% neq 0 (
    echo [ERROR] Could not open the helpth0 project folder.
    pause
    exit /b 1
)

if /i "%~1"=="--check" (
    echo [OK] helpth0 project found at !CD!
    exit /b 0
)

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
