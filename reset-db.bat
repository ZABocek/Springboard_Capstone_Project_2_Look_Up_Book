@echo off
setlocal enabledelayedexpansion

REM Path to psql
set PSQL="C:\Program Files\PostgreSQL\17\bin\psql.exe"

REM Connection parameters
set HOST=localhost
set PORT=5432
set DB=look_up_book_db
set USER=postgres

REM Run the reset
echo Clearing users table...
%PSQL% -h %HOST% -U %USER% -d %DB% -c "TRUNCATE TABLE users RESTART IDENTITY CASCADE; SELECT 'Users table cleared' as status;"

echo.
echo Checking book titles...
%PSQL% -h %HOST% -U %USER% -d %DB% -c "SELECT id, title, author_id FROM books LIMIT 3;"

pause
