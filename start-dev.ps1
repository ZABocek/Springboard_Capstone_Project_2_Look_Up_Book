# Look Up Book - Development Startup Script
# Starts both server and client with a single command using concurrently

param(
    [string]$Mode = "both"
)

# Add Node.js to PATH if not already there
if ($env:Path -notlike "*nodejs*") {
    $env:Path += ";C:\Program Files\nodejs"
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Look Up Book - Development Server        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verify Node.js and npm are installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = & node --version 2>&1
$npmVersion = & npm --version 2>&1

if ($nodeVersion -and $npmVersion) {
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
    Write-Host "✅ npm $npmVersion installed" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js or npm not found in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting application..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📍 Location: $scriptDir" -ForegroundColor Gray
Write-Host "📍 Server:   http://localhost:5000" -ForegroundColor Gray
Write-Host "📍 Client:   http://localhost:3000" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Set location to project root
Set-Location $scriptDir

# Run npm start which will use concurrently to start both server and client
try {
    npm start
}
catch {
    Write-Host "Error starting application: $_" -ForegroundColor Red
    exit 1
}
