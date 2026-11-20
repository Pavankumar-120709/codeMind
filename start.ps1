# CodeMind - Windows PowerShell Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CodeMind — AI Codebase Understanding Agent" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$CurrentDir = Get-Location

# 1. Start FastAPI Backend
Write-Host "`n[1/2] Starting Backend FastAPI server on port 8000..." -ForegroundColor Green
$BackendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\backend'; python -m uvicorn app.main:app --reload --port 8000" -PassThru

# 2. Check and start Next.js Frontend
Write-Host "`n[2/2] Starting Frontend Next.js app on port 3000..." -ForegroundColor Green
if (-not (Test-Path "$CurrentDir\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies first (npm install)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\frontend'; npm install; npm run dev"
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\frontend'; npm run dev"
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  CodeMind is launching!" -ForegroundColor Green
Write-Host "  Backend API:    http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:       http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend Web:   http://localhost:3000" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
