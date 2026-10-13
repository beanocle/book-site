# Development environment (PowerShell):  . .\dev.ps1
# Requires Node 22+ (Astro 7). Machine-specific settings (PATH to Node, extra CA, proxy)
# go in dev.local.ps1, which is git-ignored and loaded here if present.
if (Test-Path "$PSScriptRoot\dev.local.ps1") { . "$PSScriptRoot\dev.local.ps1" }
Write-Host "node $(node -v), npm $(npm -v)"
