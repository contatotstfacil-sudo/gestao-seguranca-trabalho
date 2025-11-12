# Script para verificar se o servidor está rodando
Write-Host "🔍 Verificando status do servidor..." -ForegroundColor Cyan
Write-Host ""

# Verificar porta 3000
Write-Host "1️⃣ Verificando porta 3000..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($portCheck) {
    Write-Host "   ✅ Porta 3000 está em uso" -ForegroundColor Green
    Write-Host "   Estado: $($portCheck.State)" -ForegroundColor Gray
    Write-Host "   Processo: $($portCheck.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Porta 3000 NÃO está em uso" -ForegroundColor Red
    Write-Host "   O servidor NÃO está rodando!" -ForegroundColor Red
}

Write-Host ""

# Testar conexão HTTP
Write-Host "2️⃣ Testando conexão HTTP..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Servidor está respondendo!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   URL: http://localhost:3000" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Servidor NÃO está respondendo" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Verificar processos Node
Write-Host "3️⃣ Verificando processos Node..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   ✅ Encontrados $($nodeProcesses.Count) processo(s) Node" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "   - PID: $($_.Id) | Iniciado: $($_.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  Nenhum processo Node encontrado" -ForegroundColor Yellow
}

Write-Host ""

# Resumo
Write-Host "📋 RESUMO:" -ForegroundColor Cyan
if ($portCheck -and $response.StatusCode -eq 200) {
    Write-Host "   ✅ SERVIDOR ESTÁ FUNCIONANDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   🌐 Acesse:" -ForegroundColor Cyan
    Write-Host "   - http://localhost:3000" -ForegroundColor White
    Write-Host "   - http://localhost:3000/login" -ForegroundColor White
    Write-Host "   - http://localhost:3000/teste" -ForegroundColor White
} else {
    Write-Host "   ❌ SERVIDOR NÃO ESTÁ RODANDO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   🚀 Para iniciar o servidor:" -ForegroundColor Yellow
    Write-Host "   cd C:\Projeto-tst-facil\tst-facil" -ForegroundColor White
    Write-Host "   .\start-dev.ps1" -ForegroundColor White
    Write-Host "   OU" -ForegroundColor Gray
    Write-Host "   pnpm dev" -ForegroundColor White
}

Write-Host ""


