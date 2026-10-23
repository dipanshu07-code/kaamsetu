param(
  [string]$Source = "C:\Users\dipanshu\Downloads\kaamsetu",
  [string]$Destination = "C:\Users\dipanshu\Downloads\kaamsetu-updated.zip"
)

$tempBase = Join-Path $env:TEMP ("kaamsetu_export_" + [System.Guid]::NewGuid().ToString("N"))
$targetDir = Join-Path $tempBase "kaamsetu"

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

robocopy $Source $targetDir /E /XD node_modules .next .data .git e2e\shots /XF *.log | Out-Null

if (Test-Path $Destination) {
  Remove-Item $Destination -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempBase, $Destination, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Remove-Item -Recurse -Force $tempBase

$item = Get-Item $Destination
Write-Host "Created $($item.FullName) ($($item.Length) bytes, $($item.LastWriteTime))"
