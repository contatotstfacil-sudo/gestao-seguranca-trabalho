# Script para iniciar sistema localmente no Windows
Write-Host "🚀 Iniciando TST Fácil - Ambiente Local" -ForegroundColor Green
Write-Host ""

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Arquivo .env.local não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Criando .env.local com configurações padrão..." -ForegroundColor Cyan
    
    @"
# Configuração Local - Desenvolvimento
DATABASE_URL=mysql://root:senha@localhost:3306/sst
NODE_ENV=development
PORT=3000
JWT_SECRET=chave-local-desenvolvimento-123
COOKIE_SECRET=chave-local-cookie-123
ENCRYPTION_KEY=chave-local-criptografia-123
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
VITE_USE_TRADITIONAL_LOGIN=1
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    
    Write-Host "✅ Arquivo .env.local criado!" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Configure sua DATABASE_URL no arquivo .env.local" -ForegroundColor Yellow
    Write-Host ""
}

# Carregar variáveis do .env.local
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

Write-Host "📋 Configuração:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Yellow
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "   PORT: $env:PORT" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Acesse: http://localhost:$env:PORT" -ForegroundColor Green
Write-Host ""

# Iniciar servidor
Write-Host "▶️  Iniciando servidor..." -ForegroundColor Cyan
pnpm dev

