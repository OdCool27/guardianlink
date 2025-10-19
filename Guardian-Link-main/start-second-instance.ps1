# Start Second Frontend Instance on Port 3002
# This allows testing multi-user interactions

Write-Host "Starting second frontend instance on port 3002..." -ForegroundColor Green
Write-Host "Main instance should be on port 3001" -ForegroundColor Yellow
Write-Host ""

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
cd "c:\Users\odane\Desktop\Projects\Guardian-Link-main\Guardian-Link-main"
npm run dev -- --port 3002 --strictPort
