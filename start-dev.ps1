$env:DATABASE_URL = "mysql://root:senha@localhost:3306/sst"
$env:NODE_ENV = "development"
$env:PORT = "3000"

Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host "DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Yellow
Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan

npx --yes tsx watch server/_core/index.ts



