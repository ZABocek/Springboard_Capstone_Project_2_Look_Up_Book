@echo off
setlocal enabledelayedexpansion
title Look Up Book - Launcher

:: =============================================================================
:: Look Up Book - One-Click Application Launcher
::
:: USAGE:  Double-click this file in Windows Explorer.
::
:: WHAT IT DOES:
::   1. Stops any stale Node.js processes (prevents EADDRINUSE errors).
::   2. Ensures the PostgreSQL service is running (never drops any data).
::   3. Opens the Express backend in its own labelled terminal (port 5000).
::   4. Opens the React dev-server in its own labelled terminal (port 3000).
::   5. Waits ~20 s for React to compile, then opens the app in your browser.
::
:: STOPPING THE APP:
::   Close the "Look Up Book - Backend" and "Look Up Book - Frontend" windows.
::
:: DATABASE SAFETY:
::   This script never drops, truncates, or resets the database.
::   The server performs only additive, idempotent schema migrations on start.
::
:: NOTES:
::   • Paths are resolved relative to this file — no hard-coded user paths.
::   • The PostgreSQL service name is postgresql-x64-17; adjust below if yours
::     is different (check "services.msc" if unsure).
::   • If Chrome is not your default browser, the app opens in whatever browser
::     Windows associates with http:// links.
:: =============================================================================

:: Resolve the project root from this file's location (trim trailing backslash)
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo  ====================================================
echo       Look Up Book  ^|  Starting Application
echo  ====================================================
echo.

:: -----------------------------------------------------------------------------
:: Step 1 — Kill stale node.exe processes (avoids port-already-in-use errors)
:: -----------------------------------------------------------------------------
echo  [1/5]  Stopping any existing Node.js processes...
taskkill /IM node.exe /F >nul 2>&1
echo         Done.
echo.

:: -----------------------------------------------------------------------------
:: Step 2 — Ensure PostgreSQL is running (data is never touched here)
:: -----------------------------------------------------------------------------
echo  [2/5]  Checking PostgreSQL service...
sc query postgresql-x64-17 | findstr /I "RUNNING" >nul 2>&1
if errorlevel 1 (
    echo         PostgreSQL not running -- attempting to start service...
    net start postgresql-x64-17 >nul 2>&1
    :: Wait ~3 s for the service to come up before Node connects
    ping -n 4 127.0.0.1 >nul 2>&1
    sc query postgresql-x64-17 | findstr /I "RUNNING" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [ERROR] Could not start PostgreSQL. Make sure it is installed and
        echo          the service name matches what is in services.msc.
        echo          Expected service name: postgresql-x64-17
        echo.
        pause
        exit /b 1
    )
    echo         PostgreSQL started successfully.
) else (
    echo         PostgreSQL is already running.
)
echo.

:: -----------------------------------------------------------------------------
:: Step 3 — Open the Express backend in its own terminal window
:: -----------------------------------------------------------------------------
echo  [3/5]  Starting backend server (port 5000)...
start "Look Up Book - Backend  [Keep open to run app]" /D "%ROOT%\server" cmd /k "echo. && echo  Backend starting on http://localhost:5000 ... && echo. && node server.js"
:: Brief pause so the backend can bind the port before the frontend connects
ping -n 4 127.0.0.1 >nul 2>&1
echo         Backend window opened.
echo.

:: -----------------------------------------------------------------------------
:: Step 4 — Open the React dev-server in its own terminal window
:: -----------------------------------------------------------------------------
echo  [4/5]  Starting React frontend (port 3000)...
start "Look Up Book - Frontend  [Keep open to run app]" /D "%ROOT%\client" cmd /k "set BROWSER=none && echo. && echo  Frontend starting on http://localhost:3000 ... && echo. && npm start"
echo         Frontend window opened.
echo.

:: -----------------------------------------------------------------------------
:: Step 5 — Wait for React to compile (~20 s), then open the browser
:: -----------------------------------------------------------------------------
echo  [5/5]  Waiting ~20 seconds for React to finish compiling...
echo         (You can watch the Frontend window for the "Compiled successfully" message.)
ping -n 21 127.0.0.1 >nul 2>&1

echo.
echo         Opening http://localhost:3000 in your browser...
start "" http://localhost:3000

echo.
echo  ====================================================
echo       Look Up Book is now running!
echo.
echo    Backend  :  http://localhost:5000
echo    Frontend :  http://localhost:3000
echo.
echo    To stop the app, close the Backend and Frontend
echo    terminal windows (or press Ctrl+C in each).
echo  ====================================================
echo.
echo  Press any key to close this launcher window.
pause >nul
endlocal
