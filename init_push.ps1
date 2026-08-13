$gitExe = "C:\Program Files\Git\cmd\git.exe"
$repoUrl = "https://docs.google.com/spreadsheets" # temp
$targetRepo = "https://github.com/adotoperation/adotinformationmap.git"

Set-Location $PSScriptRoot

Write-Host "🚀 Git repository initialization & Push to GitHub..." -ForegroundColor Cyan

& $gitExe init
& $gitExe config user.name "adotoperation"
& $gitExe config user.email "adotoperation@users.noreply.github.com"
& $gitExe branch -M main
& $gitExe remote remove origin 2>$null
& $gitExe remote add origin $targetRepo
& $gitExe add .
& $gitExe commit -m "Feat: 전국 학교 & 학원가 & 지점 3대 통합 데이터 지도 웹앱"

Write-Host "Pushing to $targetRepo..." -ForegroundColor Yellow
& $gitExe push -u origin main
