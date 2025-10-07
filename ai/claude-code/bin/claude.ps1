param([string]$file, [string]$label = "Claude")
if (-not $file) { throw "Missing -file argument" }
New-Item -ItemType Directory -Force -Path (Split-Path $file) | Out-Null
$ts   = Get-Date -Format o
$line = "$label line: $(Get-Random -Minimum 1000 -Maximum 9999)  [$ts]"
Add-Content -Encoding utf8 -Path $file -Value $line
Write-Host "Claude wrote: $line"
