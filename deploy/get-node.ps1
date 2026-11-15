# Downloads the current Node.js LTS (portable zip, checksum verified) into runtime\node next to the game.
# Called by start-server.cmd when Node.js 20.11+ is not installed. Nothing is installed system-wide:
# deleting the runtime folder removes it. Keep this file ASCII-only (Windows PowerShell 5 reads it as ANSI).
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # the progress bar makes downloads very slow in Windows PowerShell 5
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$runtime = Join-Path (Split-Path -Parent $PSScriptRoot) 'runtime'
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
try {
  $all = Invoke-RestMethod 'https://nodejs.org/dist/index.json'   # newest first; kept in a variable so PowerShell 5 enumerates it
  $release = $all | Where-Object { $_.lts -and ($_.files -contains "win-$arch-zip") } | Select-Object -First 1
  if (-not $release) { throw 'khong tim thay ban Node.js LTS phu hop' }
  $version = $release.version
  $name = "node-$version-win-$arch"
  $zip = Join-Path $env:TEMP "$name.zip"
  Write-Host "Dang tai Node.js $version ($arch, khoang 30 MB)..."
  Invoke-WebRequest "https://nodejs.org/dist/$version/$name.zip" -OutFile $zip -UseBasicParsing
  $sums = Invoke-RestMethod "https://nodejs.org/dist/$version/SHASUMS256.txt"
  $line = $sums -split "`n" | Where-Object { $_ -match ('\s' + [regex]::Escape("$name.zip") + '\s*$') } | Select-Object -First 1
  $expected = "$line".Trim() -split '\s+' | Select-Object -First 1
  if (-not $expected -or $expected -ne (Get-FileHash $zip -Algorithm SHA256).Hash) { throw 'file tai ve bi hong (sai checksum)' }

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $unpack = Join-Path $runtime 'node-unpack'
  $target = Join-Path $runtime 'node'
  if (Test-Path $unpack) { Remove-Item $unpack -Recurse -Force }
  [IO.Compression.ZipFile]::ExtractToDirectory($zip, $unpack)
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
  Move-Item (Join-Path $unpack $name) $target
  Remove-Item $unpack -Recurse -Force
  Remove-Item $zip -Force
  Write-Host "Xong: Node.js $version nam trong runtime\node"
} catch {
  Write-Host "Loi khi tai Node.js: $($_.Exception.Message)"
  exit 1
}
