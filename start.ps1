# EMCatalyst - Start All Services
Write-Host "Starting EMCatalyst..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  Write-Host 'EMCatalyst Backend (port 8002)' -ForegroundColor Cyan
  Set-Location 'C:\Users\10015309\New folder\emcatalyst-migration\backend'
  python -m uvicorn app.main:app --reload --port 8002
"@

Start-Sleep -Seconds 2

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  Write-Host 'EMCatalyst Frontend (port 5173)' -ForegroundColor Cyan
  Set-Location 'C:\Users\10015309\New folder\emcatalyst-migration\frontend'
  npm run dev
"@

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  EMCatalyst is starting up!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  App:      http://localhost:5173" -ForegroundColor Yellow
Write-Host "  API Docs: http://localhost:8002/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login: admin@emcure.com / Admin@123" -ForegroundColor Cyan
Write-Host "Other: compliance@emcure.com, finance@emcure.com (Emcure@123)" -ForegroundColor Cyan
