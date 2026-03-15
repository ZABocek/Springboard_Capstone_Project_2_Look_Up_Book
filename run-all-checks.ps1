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
    $args = $parts[1..($parts.Length - 1)]
    try {
      & $cmd @args --version *> $null
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

try {
  Invoke-Step -Name 'Frontend Tests' -Action {
    $env:CI = 'true'
    npm --prefix client test -- --watchAll=false
  }

  Invoke-Step -Name 'API Smoke Tests' -Action {
    if ($pythonExe -like '* *') {
      $parts = $pythonExe.Split(' ')
      $cmd = $parts[0]
      $args = $parts[1..($parts.Length - 1)]
      & $cmd @args test_api_endpoints.py
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

  Write-Host "`n=== SUMMARY ==="
  $results | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "All checks passed."
  exit 0
}
catch {
  Write-Host "`n=== SUMMARY ==="
  $results | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "One or more checks failed."
  exit 1
}
