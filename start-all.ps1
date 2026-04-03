#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start all Look Up Book services: Redis, Node.js API server, Celery worker,
    Celery beat (scheduler), and the React dev server.

.DESCRIPTION
    Run from the project root:
        .\start-all.ps1

    Individual services can be omitted with -NoRedis, -NoWorker, etc.
    Press Ctrl+C to stop everything.
#>

param(
    [switch]$NoRedis,
    [switch]$NoWorker,
    [switch]$NoBeat,
    [switch]$NoClient
)

$ROOT  = $PSScriptRoot
$VENV  = Join-Path $ROOT ".venv\Scripts"
$PY    = Join-Path $VENV "python.exe"
$CEL   = Join-Path $VENV "celery.exe"

# ── Redis ────────────────────────────────────────────────────────────────────
if (-not $NoRedis) {
    Write-Host "[Redis] Starting redis-server on default port 6379..." -ForegroundColor Cyan
    Start-Process -FilePath "redis-server" -WindowStyle Minimized
    Start-Sleep -Seconds 1
}

# ── Node.js API server ───────────────────────────────────────────────────────
Write-Host "[Server] Starting Node.js server..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location (Join-Path $root "server")
    node server.js
} -ArgumentList $ROOT

# ── Celery worker ────────────────────────────────────────────────────────────
if (-not $NoWorker) {
    Write-Host "[Celery] Starting worker..." -ForegroundColor Cyan
    $workerJob = Start-Job -ScriptBlock {
        param($root, $cel)
        Set-Location $root
        & $cel -A worker.celery_app worker --loglevel=info --concurrency=2
    } -ArgumentList $ROOT, $CEL
}

# ── Celery beat ──────────────────────────────────────────────────────────────
if (-not $NoBeat) {
    Write-Host "[Celery] Starting beat scheduler..." -ForegroundColor Cyan
    $beatJob = Start-Job -ScriptBlock {
        param($root, $cel)
        Set-Location $root
        & $cel -A worker.celery_app beat --loglevel=info
    } -ArgumentList $ROOT, $CEL
}

# ── React dev client ──────────────────────────────────────────────────────────
if (-not $NoClient) {
    Write-Host "[Client] Starting React dev server..." -ForegroundColor Cyan
    $clientJob = Start-Job -ScriptBlock {
        param($root)
        Set-Location (Join-Path $root "client")
        npm start
    } -ArgumentList $ROOT
}

Write-Host ""
Write-Host "All services started.  Streaming logs (Ctrl+C to stop):" -ForegroundColor Green
Write-Host ""

try {
    while ($true) {
        foreach ($job in @($serverJob, $workerJob, $beatJob, $clientJob) | Where-Object { $_ }) {
            $out = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($out) { Write-Host $out }
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nStopping jobs..." -ForegroundColor Yellow
    foreach ($job in @($serverJob, $workerJob, $beatJob, $clientJob) | Where-Object { $_ }) {
        Stop-Job  -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue
    }
}
