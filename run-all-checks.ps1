$VerboseServerTests = $false
if ($args -contains '-VerboseServerTests') {
  $VerboseServerTests = $true
}

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$pythonExe = $null
$pythonCandidates = @(
  'C:/Users/zaboc/AppData/Local/Microsoft/WindowsApps/python3.11.exe',
  'py -3',
  'python'
)

foreach ($candidate in $pythonCandidates) {
  if ($candidate -like '* *') {
    # command with args (e.g. py -3)
    $parts = $candidate.Split(' ')
    $cmd = $parts[0]
    $commandArgs = $parts[1..($parts.Length - 1)]
    try {
      & $cmd @commandArgs --version *> $null
      if ($LASTEXITCODE -eq 0) {
        $pythonExe = $candidate
        break
      }
    } catch {
      continue
    }
  } else {
    if (Test-Path $candidate) {
      $pythonExe = $candidate
      break
    }
    try {
      & $candidate --version *> $null
      if ($LASTEXITCODE -eq 0) {
        $pythonExe = $candidate
        break
      }
    } catch {
      continue
    }
  }
}

if (-not $pythonExe) {
  Write-Host "[FAIL] Python executable not found. Install Python 3."
  exit 1
}

$results = @()
$serverHandle = $null

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host "`n=== $Name ==="
  try {
    & $Action
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      throw "$Name failed with exit code $exitCode"
    }
    $script:results += [pscustomobject]@{ Step = $Name; Status = 'PASS' }
    Write-Host "[PASS] $Name"
  } catch {
    $script:results += [pscustomobject]@{ Step = $Name; Status = 'FAIL' }
    Write-Host "[FAIL] $Name"
    Write-Host "       $($_.Exception.Message)"
    throw
  }
}

function Test-ServerReady {
  try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/authors' -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Start-TestServer {
  if (Test-ServerReady) {
    Write-Host 'Server already responding on port 5000.'
    return [pscustomobject]@{
      StartedHere = $false
      Process = $null
      StdOut = $null
      StdErr = $null
    }
  }

  $stdoutLog = Join-Path $root '.verify-server.stdout.log'
  $stderrLog = Join-Path $root '.verify-server.stderr.log'

  Remove-Item $stdoutLog, $stderrLog -ErrorAction SilentlyContinue

  $process = Start-Process -FilePath 'node' `
    -ArgumentList 'server.js' `
    -WorkingDirectory (Join-Path $root 'server') `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 1
    $process.Refresh()

    if ($process.HasExited) {
      $stderr = if (Test-Path $stderrLog) { Get-Content $stderrLog -Raw } else { '' }
      $stdout = if (Test-Path $stdoutLog) { Get-Content $stdoutLog -Raw } else { '' }
      throw "Test server exited before becoming ready. stdout: $stdout stderr: $stderr"
    }

    if (Test-ServerReady) {
      Write-Host 'Started test server on port 5000.'
      return [pscustomobject]@{
        StartedHere = $true
        Process = $process
        StdOut = $stdoutLog
        StdErr = $stderrLog
      }
    }
  }

  try {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  } catch {
  }

  $stderr = if (Test-Path $stderrLog) { Get-Content $stderrLog -Raw } else { '' }
  $stdout = if (Test-Path $stdoutLog) { Get-Content $stdoutLog -Raw } else { '' }
  throw "Timed out waiting for test server to become ready. stdout: $stdout stderr: $stderr"
}

function Stop-TestServer {
  param(
    $Handle
  )

  if ($null -eq $Handle -or -not $Handle.StartedHere -or $null -eq $Handle.Process) {
    return
  }

  try {
    $Handle.Process.Refresh()
    if (-not $Handle.Process.HasExited) {
      Stop-Process -Id $Handle.Process.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {
  }
}

try {
  Invoke-Step -Name 'Frontend Tests' -Action {
    $env:CI = 'true'
    npm --prefix client test -- --watchAll=false
  }

  $serverHandle = Start-TestServer

  Invoke-Step -Name 'API Smoke Tests' -Action {
    if ($pythonExe -like '* *') {
      $parts = $pythonExe.Split(' ')
      $cmd = $parts[0]
      $commandArgs = $parts[1..($parts.Length - 1)]
      & $cmd @commandArgs test_api_endpoints.py
    } else {
      & $pythonExe test_api_endpoints.py
    }
  }

  Invoke-Step -Name 'Server Script Tests' -Action {
    $scripts = Get-ChildItem server -File test-*.js | Sort-Object Name
    foreach ($script in $scripts) {
      Write-Host "Running $($script.Name)..."
      if ($VerboseServerTests) {
        node $script.FullName
      } else {
        node $script.FullName *> $null
      }
      if ($LASTEXITCODE -ne 0) {
        throw "Server test script failed: $($script.Name)"
      }
    }
  }

  Invoke-Step -Name 'Frontend Production Build' -Action {
    npm --prefix client run build
  }

  Stop-TestServer $serverHandle
  $serverHandle = $null

  Write-Host "`n=== SUMMARY ==="
  $results | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "All checks passed."
  exit 0
}
catch {
  Stop-TestServer $serverHandle
  Write-Host "`n=== SUMMARY ==="
  $results | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "One or more checks failed."
  exit 1
}
