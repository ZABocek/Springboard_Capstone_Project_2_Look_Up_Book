# Look Up Book - Quick Start Script
# This script sets up the environment and starts both server and client

# Add Node.js to PATH
$env:Path += ";C:\Program Files\nodejs"

# Define base directory
$baseDir = "c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main"

# Display header
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Look Up Book - Quick Start" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verify installations
Write-Host "Checking installations..." -ForegroundColor Yellow

$nodeCheck = & node --version 2>&1
$npmCheck = & npm --version 2>&1
$pgCheck = Get-Service postgresql-x64-17 -ErrorAction SilentlyContinue

if ($nodeCheck) { Write-Host "✅ Node.js: $nodeCheck" -ForegroundColor Green }
if ($npmCheck) { Write-Host "✅ npm: $npmCheck" -ForegroundColor Green }
if ($pgCheck.Status -eq "Running") { Write-Host "✅ PostgreSQL: Running" -ForegroundColor Green }
else { Write-Host "⚠️  PostgreSQL: Not running (starting...)" -ForegroundColor Yellow; Start-Service postgresql-x64-17 }

# Verify database
Write-Host "`nVerifying database..." -ForegroundColor Yellow
$env:PGPASSWORD = 'postgres'
$dbCheck = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -d look_up_book_db -c "SELECT COUNT(*) FROM books;" 2>&1
if ($dbCheck -match "500") { Write-Host "✅ Database: 500 books loaded" -ForegroundColor Green }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Starting Application Components" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Ask user what to start
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1. Start Server Only (npm start in /server)" -ForegroundColor Gray
Write-Host "2. Start Client Only (npm start in /client)" -ForegroundColor Gray
Write-Host "3. Start Both (Server & Client)" -ForegroundColor Gray
Write-Host "4. Run Tests" -ForegroundColor Gray
Write-Host "5. Exit" -ForegroundColor Gray

$choice = Read-Host "`nEnter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting Server..." -ForegroundColor Cyan
        Write-Host "Location: $baseDir\server" -ForegroundColor Gray
        Write-Host "Command: npm start" -ForegroundColor Gray
        Write-Host "URL: http://localhost:5000" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow
        
        Set-Location "$baseDir\server"
        & npm start
    }
    
    "2" {
        Write-Host "`nStarting Client..." -ForegroundColor Cyan
        Write-Host "Location: $baseDir\client" -ForegroundColor Gray
        Write-Host "Command: npm start" -ForegroundColor Gray
        Write-Host "URL: http://localhost:3000" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow
        
        Set-Location "$baseDir\client"
        & npm start
    }
    
    "3" {
        Write-Host "`nStarting Server in background..." -ForegroundColor Cyan
        Set-Location "$baseDir\server"
        Start-Process -FilePath "node.exe" -ArgumentList "server.js" -NoNewWindow
        Write-Host "✅ Server started on http://localhost:5000" -ForegroundColor Green
        
        Start-Sleep -Seconds 2
        
        Write-Host "`nStarting Client..." -ForegroundColor Cyan
        Write-Host "Location: $baseDir\client" -ForegroundColor Gray
        Write-Host "URL: http://localhost:3000" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow
        
        Set-Location "$baseDir\client"
        & npm start
    }
    
    "4" {
        Write-Host "`nRunning tests..." -ForegroundColor Cyan
        Write-Host "File: test_api_endpoints.py`n" -ForegroundColor Gray
        
        Set-Location $baseDir
        & python test_api_endpoints.py
    }
    
    "5" {
        Write-Host "`nExiting..." -ForegroundColor Yellow
        exit
    }
    
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Session Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
