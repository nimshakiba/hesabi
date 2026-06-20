@echo off
title Arya Accounting - Offline Electron Installer
echo ========================================================================
echo   Arya Accounting Offline Electron Installer Bridge
echo ========================================================================
echo.
echo Launching PowerShell script with ExecutionPolicy Bypass...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-electron-offline.ps1"
echo.
echo ========================================================================
pause
