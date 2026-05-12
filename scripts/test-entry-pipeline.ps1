param(
  [int]$Port = 4173
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$BaseUrl = "http://127.0.0.1:$Port/index.html"
$OutputDir = Join-Path $RepoRoot "output\playwright"
$ServerProcess = $null
$Failures = [System.Collections.Generic.List[string]]::new()
$Passes = [System.Collections.Generic.List[string]]::new()

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function Add-Pass {
  param([string]$Message)
  $Passes.Add($Message)
  Write-Host "[PASS] $Message"
}

function Add-Fail {
  param([string]$Message)
  $Failures.Add($Message)
  Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if ($Condition) { Add-Pass $Message }
  else { Add-Fail $Message }
}

function Invoke-Playwright {
  param(
    [string[]]$Arguments,
    [switch]$Raw
  )

  $cmd = @("--yes", "--package", "@playwright/cli", "playwright-cli")
  if ($Raw) { $cmd += "--raw" }
  $cmd += $Arguments

  $result = & npx @cmd 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "playwright-cli failed: $result"
  }

  return $result.Trim()
}

function Get-UiState {
  $script = @(
    "() => {",
    "const rect = (selector) => {",
    "  const el = document.querySelector(selector);",
    "  if (!el) return null;",
    "  const r = el.getBoundingClientRect();",
    "  return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };",
    "};",
    "const radarPoints = (document.getElementById('radarData')?.getAttribute('points') || '').split(/\s+/).filter(Boolean);",
    "return {",
    "url: location.href,",
    "hash: location.hash,",
    "stageMode: document.getElementById('stage')?.dataset.mode || null,",
    "selectedPersona: document.querySelector('.persona-card.is-selected')?.dataset.persona || null,",
    "heading: document.getElementById('profileName')?.textContent || null,",
    "tagline: document.getElementById('profileTagline')?.textContent || null,",
    "totals: document.getElementById('radarTotals')?.textContent || null,",
    "baseline: document.getElementById('priceBaseline')?.textContent || null,",
    "radarPointCount: radarPoints.length,",
    "radarPoints,",
    "radarDotCount: document.querySelectorAll('#radarDots circle').length,",
    "radarLabelCount: document.querySelectorAll('.radar-label').length,",
    "personaCount: document.querySelectorAll('.persona-card').length,",
    "priceTierCount: document.querySelectorAll('#priceList .price-tier').length,",
    "priceTiers: Array.from(document.querySelectorAll('#priceList .price-tier')).map(el => el.getAttribute('data-tier') || ''),",
    "priceAmounts: Array.from(document.querySelectorAll('#priceList .tier-amount')).map(el => el.textContent || ''),",
    "priceAmountValues: Array.from(document.querySelectorAll('#priceList .tier-amount')).map(el => Number(el.dataset.cny || 0)),",
    "hasWorkbench: !!document.getElementById('workbench'),",
    "bodyOverflow: getComputedStyle(document.body).overflow,",
    "pageHeight: document.querySelector('.page')?.getBoundingClientRect().height || 0,",
    "scrollHeight: document.documentElement.scrollHeight,",
    "viewportHeight: window.innerHeight,",
    "snapshotChartRect: rect('.snapshot-chart'),",
    "snapshotControlsRect: rect('.snapshot-controls'),",
    "snapshotPricesRect: rect('.snapshot-prices'),",
    "personasSectionRect: rect('.personas-section')",
    "};",
    "}"
  ) -join " "

  return (Invoke-Playwright -Raw -Arguments @("eval", $script) | ConvertFrom-Json)
}

function Ensure-Server {
  $listener = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    Write-Host "Using existing local server on port $Port."
    return
  }

  $ServerProcess = Start-Process python -ArgumentList "-m", "http.server", "$Port" -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds 2
  $probe = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -TimeoutSec 5
  if ($probe.StatusCode -ne 200) {
    throw "Local server probe failed: HTTP $($probe.StatusCode)"
  }
  Write-Host "Started local server on port $Port (PID=$($ServerProcess.Id))."
}

function Test-Persona {
  param(
    [string]$Id
  )

  Invoke-Playwright -Arguments @("click", "button[data-persona='$Id']") | Out-Null
  Start-Sleep -Milliseconds 900
  $state = Get-UiState

  Assert-True ($state.stageMode -eq "snapshot") "$Id switches the page into snapshot mode"
  Assert-True ($state.selectedPersona -eq $Id) "$Id becomes the selected persona card"
  Assert-True (-not [string]::IsNullOrWhiteSpace($state.heading)) "$Id updates the snapshot heading"
  Assert-True ($state.radarPointCount -eq 5) "$Id renders five radar vertices"
  Assert-True ($state.radarDotCount -eq 5) "$Id renders five radar dots"
  Assert-True ($state.radarLabelCount -eq 5) "$Id renders five radar axis labels"
  Assert-True ($state.priceTierCount -eq 3) "$Id renders three price tiers"
  Assert-True (
    $state.priceTiers.Count -eq 3 -and
    $state.priceTiers[0] -eq "official" -and
    $state.priceTiers[1] -eq "regular" -and
    $state.priceTiers[2] -eq "custom"
  ) "$Id keeps the fixed channel comparison order"
  Assert-True ($state.bodyOverflow -eq "hidden") "$Id keeps the page in one-screen mode"
  Assert-True ($state.scrollHeight -le ($state.viewportHeight + 2)) "$Id does not require vertical scrolling"
  Assert-True (
    $state.snapshotChartRect.bottom -le $state.personasSectionRect.top -and
    $state.snapshotControlsRect.bottom -le $state.personasSectionRect.top -and
    $state.snapshotPricesRect.bottom -le $state.personasSectionRect.top
  ) "$Id keeps the three snapshot panels above the persona cards"

  if ($Id -eq "api_integration") {
    Assert-True ($state.priceAmountValues[-1] -gt 0) "api_integration now shows a positive default monthly cost profile"
  }
}

function Test-RapidSwitching {
  $ids = @("light_chat", "research", "content_creation", "coding", "ai_heavy", "api_integration", "coding")
  foreach ($id in $ids) {
    Invoke-Playwright -Arguments @("click", "button[data-persona='$id']") | Out-Null
    Start-Sleep -Milliseconds 40
  }
  Start-Sleep -Milliseconds 1200
  $state = Get-UiState
  Assert-True ($state.selectedPersona -eq "coding") "rapid switching ends on the last clicked persona"
  Assert-True (-not [string]::IsNullOrWhiteSpace($state.heading)) "rapid switching keeps snapshot heading populated"
  Assert-True ($state.radarPointCount -eq 5) "rapid switching keeps the radar polygon valid"
  Assert-True ($state.priceTiers.Count -eq 3) "rapid switching keeps the price tier block valid"
  Assert-True (
    $state.priceTiers[0] -eq "official" -and
    $state.priceTiers[1] -eq "regular" -and
    $state.priceTiers[2] -eq "custom"
  ) "rapid switching keeps the fixed channel comparison order"
}

function Test-TruthSourceCoverage {
  $pricing = Get-Content -Raw -Encoding UTF8 (Join-Path $RepoRoot "data\pricing.json") | ConvertFrom-Json
  $personas = Get-Content -Raw -Encoding UTF8 (Join-Path $RepoRoot "data\personas.json") | ConvertFrom-Json

  $pricingModels = @{}
  foreach ($prop in $pricing.models.PSObject.Properties) {
    $pricingModels[$prop.Name] = $true
  }

  $missing = [System.Collections.Generic.List[string]]::new()
  foreach ($persona in $personas.personas) {
    foreach ($prop in $persona.monthly_usage.by_model.PSObject.Properties) {
      $modelKey = $prop.Name
      $lookup = if ($modelKey.StartsWith("claude_")) { $modelKey.Substring(7) } else { $modelKey }
      if (-not $pricingModels.ContainsKey($lookup)) {
        $missing.Add("$($persona.id):$modelKey")
      }
    }
  }

  $coverageMessage = "all persona usage models resolve against data/pricing.json"
  if ($missing.Count -gt 0) {
    $coverageMessage += " (missing: $($missing -join ', '))"
  }
  Assert-True ($missing.Count -eq 0) $coverageMessage
}

try {
  Ensure-Server

  Invoke-Playwright -Arguments @("close-all") | Out-Null
  Invoke-Playwright -Arguments @("open", $BaseUrl, "--browser", "msedge") | Out-Null
  Start-Sleep -Milliseconds 900

  $initial = Get-UiState
  Assert-True ($initial.stageMode -eq "hero") "page starts in hero mode before a persona is selected"
  Assert-True ($initial.personaCount -eq 6) "page renders six persona cards"
  Assert-True ($initial.hasWorkbench) "page exposes the workbench section linked from the masthead"

  $personaCases = @("light_chat", "research", "content_creation", "coding", "ai_heavy", "api_integration")

  foreach ($case in $personaCases) {
    Test-Persona -Id $case
  }

  Test-RapidSwitching
  Test-TruthSourceCoverage

  Invoke-Playwright -Arguments @("screenshot", "--filename", (Join-Path $OutputDir "entry-pipeline-final.png")) | Out-Null
}
finally {
  if ($ServerProcess) {
    Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue
  }

  Invoke-Playwright -Arguments @("close-all") | Out-Null
}

Write-Host ""
Write-Host ("Passes: {0}" -f $Passes.Count)
Write-Host ("Failures: {0}" -f $Failures.Count)

if ($Failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Failing checks:" -ForegroundColor Red
  foreach ($failure in $Failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

exit 0
