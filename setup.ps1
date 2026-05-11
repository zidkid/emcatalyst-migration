# EMCatalyst Setup Script for Windows
param(
    [switch]$WithDocker,
    [switch]$LocalOnly
)

$base = $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EMCatalyst - Setup Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($WithDocker) {
    Write-Host "`n[1/3] Starting PostgreSQL via Docker..." -ForegroundColor Yellow
    docker-compose -f "$base\docker-compose.yml" up -d postgres
    Start-Sleep -Seconds 8

    Write-Host "[2/3] Running database migration..." -ForegroundColor Yellow
    Set-Location "$base\backend"
    $env:DATABASE_URL = "postgresql://emcatalyst:emcatalyst123@localhost:5432/emcatalyst_db"
    python scripts/migrate_from_mpr.py

    Write-Host "[3/3] Starting backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$base\backend'; uvicorn app.main:app --reload --port 8000"
} else {
    Write-Host "`nLocal setup mode" -ForegroundColor Yellow
    Write-Host "Make sure PostgreSQL is running and create the database:" -ForegroundColor Gray
    Write-Host "  psql -U postgres -c `"CREATE USER emcatalyst WITH PASSWORD 'emcatalyst123';`"" -ForegroundColor Gray
    Write-Host "  psql -U postgres -c `"CREATE DATABASE emcatalyst_db OWNER emcatalyst;`"" -ForegroundColor Gray
}

Write-Host "`n[Backend] Installing Python deps..." -ForegroundColor Yellow
Set-Location "$base\backend"
pip install -r requirements.txt

Write-Host "`n[Backend] Running migrations..." -ForegroundColor Yellow
Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
python -m app.db.init_db

Write-Host "`n[Frontend] Installing npm deps..." -ForegroundColor Yellow
Set-Location "$base\frontend"
npm install

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the app:" -ForegroundColor Yellow
Write-Host "  Backend:  cd backend && uvicorn app.main:app --reload"
Write-Host "  Frontend: cd frontend && npm run dev"
Write-Host ""
Write-Host "  App URL:  http://localhost:5173"
Write-Host "  API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Default Login:" -ForegroundColor Cyan
Write-Host "  Email:    admin@emcure.com"
Write-Host "  Password: Admin@123"
