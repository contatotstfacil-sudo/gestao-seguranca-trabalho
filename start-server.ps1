# Script para iniciar servidor de forma forçada
Write-Host "🚀 Iniciando servidor TST Fácil..." -ForegroundColor Green

# Carregar variáveis de ambiente
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Garantir que NODE_ENV está definido
if (-not $env:NODE_ENV) {
    $env:NODE_ENV = "development"
}

# Garantir que PORT está definido
if (-not $env:PORT) {
    $env:PORT = "3000"
}

Write-Host "📋 Configuração:" -ForegroundColor Cyan
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "   PORT: $env:PORT" -ForegroundColor Yellow
Write-Host "   DATABASE_URL: $($env:DATABASE_URL -replace ':[^:@]+@', ':****@')" -ForegroundColor Yellow
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules não encontrado. Instalando dependências..." -ForegroundColor Yellow
    pnpm install
}

Write-Host "▶️  Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor
$ErrorActionPreference = "Continue"
npx --yes tsx watch server/_core/index.ts

