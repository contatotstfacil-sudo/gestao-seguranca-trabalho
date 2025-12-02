# Script para iniciar servidor e permitir acesso na rede local
# Permite que outros técnicos testem o sistema localmente

Write-Host "🌐 Configurando servidor para acesso em rede local..." -ForegroundColor Cyan
Write-Host ""

# Descobrir IP local
Write-Host "🔍 Descobrindo IP local..." -ForegroundColor Yellow
$ipLocal = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

if (-not $ipLocal) {
    Write-Host "⚠️  Não foi possível descobrir o IP local automaticamente." -ForegroundColor Yellow
    Write-Host "   Configure manualmente no arquivo .env" -ForegroundColor Yellow
    $ipLocal = Read-Host "   Digite seu IP local (ex: 192.168.1.100)"
}

Write-Host "✅ IP local encontrado: $ipLocal" -ForegroundColor Green
Write-Host ""

# Porta padrão
$porta = 3000

# Verificar se porta está disponível
Write-Host "🔍 Verificando porta $porta..." -ForegroundColor Yellow
$portaEmUso = Get-NetTCPConnection -LocalPort $porta -ErrorAction SilentlyContinue

if ($portaEmUso) {
    Write-Host "⚠️  Porta $porta está em uso. Tentando próxima porta disponível..." -ForegroundColor Yellow
    for ($p = $porta + 1; $p -lt $porta + 10; $p++) {
        $teste = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
        if (-not $teste) {
            $porta = $p
            Write-Host "✅ Usando porta $porta" -ForegroundColor Green
            break
        }
    }
} else {
    Write-Host "✅ Porta $porta disponível" -ForegroundColor Green
}

Write-Host ""

# Configurar variáveis de ambiente
$env:DATABASE_URL = if (Test-Path .env) { 
    (Get-Content .env | Select-String "DATABASE_URL").ToString().Split("=")[1].Trim()
} else {
    "mysql://root:senha@localhost:3306/sst"
}

$env:NODE_ENV = "development"
$env:PORT = $porta.ToString()

# Configurar ALLOWED_ORIGINS para aceitar rede local
$allowedOrigins = "http://localhost:$porta,http://127.0.0.1:$porta,http://$ipLocal:$porta"
$env:ALLOWED_ORIGINS = $allowedOrigins

# Outras variáveis necessárias
if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = "chave-local-desenvolvimento-rede"
}
if (-not $env:COOKIE_SECRET) {
    $env:COOKIE_SECRET = "chave-local-cookie-rede"
}
if (-not $env:ENCRYPTION_KEY) {
    $env:ENCRYPTION_KEY = "chave-local-criptografia-rede"
}

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SERVIDOR CONFIGURADO PARA REDE LOCAL" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   IP Local: $ipLocal" -ForegroundColor White
Write-Host "   Porta: $porta" -ForegroundColor White
Write-Host "   Modo: Desenvolvimento (Rede Local)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs de Acesso:" -ForegroundColor Yellow
Write-Host "   Local: http://localhost:$porta" -ForegroundColor Cyan
Write-Host "   Rede Local: http://$ipLocal:$porta" -ForegroundColor Cyan
Write-Host ""
Write-Host "👥 Para outros técnicos acessarem:" -ForegroundColor Yellow
Write-Host "   1. Certifique-se de que estão na mesma rede" -ForegroundColor White
Write-Host "   2. Acessem: http://$ipLocal:$porta" -ForegroundColor Cyan
Write-Host "   3. Use as credenciais de teste" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "   - Firewall pode bloquear conexões" -ForegroundColor Yellow
Write-Host "   - Certifique-se de que a porta $porta está liberada" -ForegroundColor Yellow
Write-Host "   - MySQL deve aceitar conexões (se necessário)" -ForegroundColor Yellow
Write-Host ""
Write-Host "▶️  Iniciando servidor..." -ForegroundColor Green
Write-Host ""

# Iniciar servidor
npx --yes tsx watch server/_core/index.ts

