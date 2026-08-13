# GitHub Auto Push Daemon Script
$folderPath = $PSScriptRoot
if (-not $folderPath) { $folderPath = Get-Location }

$remoteRepo = "https://github.com/adotoperation/adotinformationmap.git"
$gitExe = "C:\Program Files\Git\cmd\git.exe"

if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " [GitHub Auto Push Daemon Running...]" -ForegroundColor Green
Write-Host " Watch Folder: $folderPath" -ForegroundColor Yellow
Write-Host " GitHub Repo: $remoteRepo" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Initial Git config
try {
    & $gitExe init
    & $gitExe config user.name "adotoperation"
    & $gitExe config user.email "adotoperation@users.noreply.github.com"
    & $gitExe branch -M main
    & $gitExe remote remove origin 2>$null
    & $gitExe remote add origin $remoteRepo
} catch {
    Write-Host "Git init info: $_" -ForegroundColor DarkGray
}

function Push-To-GitHub {
    param([string]$reason)
    $timeStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timeStr] Changed: $reason -> Pushing to GitHub..." -ForegroundColor Yellow

    try {
        & $gitExe add .
        & $gitExe commit -m "Auto sync: $timeStr"
        & $gitExe push origin main
        Write-Host "[$timeStr] SUCCESS: GitHub Auto Push Completed!" -ForegroundColor Green
    } catch {
        Write-Host "[$timeStr] NOTICE: Please sign in to GitHub if browser prompt appears." -ForegroundColor Cyan
    }
}

# Initial Push Test on Startup
Push-To-GitHub -reason "Initial Start Sync"

# File System Watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $folderPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

$lastPushTime = [DateTime]::MinValue

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $fileName = [System.IO.Path]::GetFileName($path)
    
    if ($fileName -like ".*" -or $fileName -like "*.log" -or $path -like "*\.git\*") { return }

    $now = Get-Date
    if (($now - $script:lastPushTime).TotalSeconds -gt 4) {
        $script:lastPushTime = $now
        Start-Sleep -Seconds 2
        Push-To-GitHub -reason "$fileName updated"
    }
}

Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null

Write-Host "Monitoring folder changes... (Press Ctrl+C to stop)" -ForegroundColor Green

while ($true) {
    Start-Sleep -Seconds 1
}
