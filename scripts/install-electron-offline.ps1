# Arya Accounting - Offline Electron Installer Script (100% ASCII COMPATIBLE)
$Version = "31.3.0"
$ZipFileName = "electron-v$Version-win32-x64.zip"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Arya Accounting Offline Electron Installer Bridge (v$Version)" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

$ProjectRoot = Get-Location
$ElectronFolder = Join-Path $ProjectRoot "node_modules\electron"
$DistFolder = Join-Path $ElectronFolder "dist"
$BinFolder = Join-Path $ProjectRoot "node_modules\.bin"

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow
Write-Host "Electron Folder: $ElectronFolder" -ForegroundColor Yellow

if (-not (Test-Path $ElectronFolder)) {
    Write-Host "Creating node_modules/electron folder..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $ElectronFolder | Out-Null
}

$ZipPath = Join-Path $ProjectRoot $ZipFileName
if (-not (Test-Path $ZipPath)) {
    Write-Host "Searching inside user Downloads or Desktop..." -ForegroundColor Gray
    $UserDownloads = Join-Path [Environment]::GetFolderPath("UserProfile") "Downloads\$ZipFileName"
    $UserDesktop = Join-Path [Environment]::GetFolderPath("UserProfile") "Desktop\$ZipFileName"
    
    if (Test-Path $UserDownloads) {
        $ZipPath = $UserDownloads
    } elseif (Test-Path $UserDesktop) {
        $ZipPath = $UserDesktop
    }
}

if (-not (Test-Path $ZipPath)) {
    Write-Host "ERROR: Electron ZIP file not found!" -ForegroundColor Red
    Write-Host "Please download: $ZipFileName" -ForegroundColor Yellow
    Write-Host "And place it in your project root folder (C:\app\he1\)." -ForegroundColor Yellow
    Write-Host "Direct download link:" -ForegroundColor Gray
    Write-Host "https://github.com/electron/electron/releases/download/v$Version/$ZipFileName" -ForegroundColor Cyan
    Exit 1
}

Write-Host "Found Electron ZIP: $ZipPath" -ForegroundColor Green

if (Test-Path $DistFolder) {
    Write-Host "Cleaning stale Electron files..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $DistFolder | Out-Null
}
New-Item -ItemType Directory -Force -Path $DistFolder | Out-Null

Write-Host "Extracting ZIP contents to node_modules/electron/dist... (This may take a minute)" -ForegroundColor Yellow
try {
    Expand-Archive -Path $ZipPath -DestinationPath $DistFolder -Force
    Write-Host "Extraction completed successfully." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to extract zip: $_" -ForegroundColor Red
    Exit 1
}

Write-Host "Creating configuration path.txt..." -ForegroundColor Yellow
$PathTxtContent = "dist\electron.exe"
Set-Content -Path (Join-Path $ElectronFolder "path.txt") -Value $PathTxtContent -Force

Write-Host "Writing package.json, index.js, and cli.js inside node_modules/electron..." -ForegroundColor Yellow

$IndexJsContent = @"
const fs = require('fs');
const path = require('path');

const pathFile = path.join(__dirname, 'path.txt');

function getElectronPath() {
  if (fs.existsSync(pathFile)) {
    let executablePath = fs.readFileSync(pathFile, 'utf-8').trim();
    return path.join(__dirname, executablePath);
  }
  throw new Error('Electron failed to install correctly, please delete node_modules/electron and try installing again');
}

module.exports = getElectronPath();
"@

$CliJsContent = @"
#!/usr/bin/env node

const childProcess = require('child_process');
const electron = require('./index');

const args = process.argv.slice(2);

const proc = childProcess.spawn(electron, args, { stdio: 'inherit', windowsHide: false });
proc.on('close', (code) => process.exit(code));
"@

$PackageJsonContent = @"
{
  "name": "electron",
  "version": "$Version",
  "main": "index.js",
  "bin": {
    "electron": "cli.js"
  }
}
"@

Set-Content -Path (Join-Path $ElectronFolder "index.js") -Value $IndexJsContent -Force
Set-Content -Path (Join-Path $ElectronFolder "cli.js") -Value $CliJsContent -Force
Set-Content -Path (Join-Path $ElectronFolder "package.json") -Value $PackageJsonContent -Force


Write-Host "Creating binary runner scripts inside node_modules/.bin..." -ForegroundColor Yellow

if (-not (Test-Path $BinFolder)) {
    New-Item -ItemType Directory -Force -Path $BinFolder | Out-Null
}

$ElectronCmdContent = @"
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\electron\cli.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\electron\cli.js" %*
)
"@

$ElectronShContent = @"
#!/bin/sh
basedir=`$(dirname "`$(echo "`$0" | sed -e 's,\\\\,/,g')")")

case `$(uname) in
    *CYGWIN*) basedir=`$(cygpath -w "`$basedir");;
esac

if [ -x "`$basedir/node" ]; then
  exec "`$basedir/node" "`$basedir/../electron/cli.js" "`$@"
else
  exec node "`$basedir/../electron/cli.js" "`$@"
fi
"@

Set-Content -Path (Join-Path $BinFolder "electron.cmd") -Value $ElectronCmdContent -Force
Set-Content -Path (Join-Path $BinFolder "electron") -Value $ElectronShContent -Force

$InstallJs = Join-Path $ElectronFolder "install.js"
if (Test-Path $InstallJs) {
    Write-Host "Running installation script..." -ForegroundColor Yellow
    node $InstallJs
}

Write-Host "========================================================================" -ForegroundColor Green
Write-Host "SUCCESS: Offline Electron is now installed and activated!" -ForegroundColor Green
Write-Host "You can now run 'npm start' to start the application safely." -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
