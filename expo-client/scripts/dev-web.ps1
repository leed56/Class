param(
  [int]$Port = 8081
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot/..

# Expo skips opening a browser when CI is set (common in IDE terminals).
$env:CI = ''

$url = "http://localhost:$Port"

Write-Host "Starting ClassFlow web dev server on $url ..." -ForegroundColor Cyan

$job = Start-Job -ScriptBlock {
  param($TargetUrl, $TargetPort)
  for ($i = 0; $i -lt 120; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        Start-Process $TargetUrl
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
} -ArgumentList $url, $Port

npx expo start --web --port $Port --clear

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue
