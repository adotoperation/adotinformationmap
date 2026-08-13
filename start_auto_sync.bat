@echo off
chcp 65001 > nul
title GitHub Auto Push Daemon
echo ============================================================
echo   GitHub Auto Push Daemon
echo ============================================================
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0auto_git_push.ps1"
pause
