# Look Up Book - App Startup Script
# This script starts both Server and Client using npm start from the root directory
# The root package.json uses 'concurrently' to manage both processes

# Add Node.js to PATH
if ($env:Path -notlike "*nodejs*") {
    $env:Path += ";C:\Program Files\nodejs"
}

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Look Up Book - Starting Application        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes to avoid port conflicts
Write-Host "Cleaning up existing Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
taskkill /IM node.exe /F 2>$null
Start-Sleep -Seconds 2

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Verify Node.js and npm are installed
Write-Host "Verifying prerequisites..." -ForegroundColor Yellow
$nodeVersion = & node --version 2>&1
$npmVersion = & npm --version 2>&1

if ($nodeVersion -and $npmVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js or npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Starting Application Components..." -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Server:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "📍 Client:   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Both processes will run in the same terminal window." -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop both services at once." -ForegroundColor Gray
Write-Host ""

# Navigate to project root
$projectRoot = "c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main"
Set-Location $projectRoot

# Start both server and client using npm start (which uses concurrently)
Write-Host "Running 'npm start' (Server + Client via concurrently)..." -ForegroundColor Cyan
Write-Host ""

npm start
