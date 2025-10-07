param([string]$file, [switch]$append, [string]$label = "Gemini")
if (-not $file) { throw "Missing -file argument" }
New-Item -ItemType Directory -Force -Path (Split-Path $file) | Out-Null
$ts   = Get-Date -Format o
$line = "$label line: $(Get-Random -Minimum 1000 -Maximum 9999)  [$ts]"
if ($append) { Add-Content -Encoding utf8 -Path $file -Value $line }
else         { $line | Out-File -Encoding utf8 $file }
Write-Host "Gemini wrote: $line"
