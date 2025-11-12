# Script para iniciar servidor em background (sem abrir janela)
Write-Host "Iniciando servidor TST Facil em background..." -ForegroundColor Green

# Verificar se ja esta rodando
$porta = 3000
$conexao = Test-NetConnection -ComputerName localhost -Port $porta -InformationLevel Quiet -WarningAction SilentlyContinue

if ($conexao) {
    Write-Host "Servidor ja esta rodando na porta $porta" -ForegroundColor Yellow
    Write-Host "Acesse: http://localhost:$porta/vendas" -ForegroundColor Cyan
    exit 0
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "Criando .env.local..." -ForegroundColor Yellow
    if (Test-Path "start-local.ps1") {
        & .\start-local.ps1
    }
}

# Iniciar servidor em background usando Start-Process com WindowStyle Hidden
$scriptPath = Join-Path $PSScriptRoot "."
$nodePath = Get-Command node -ErrorAction SilentlyContinue

if (-not $nodePath) {
    Write-Host "Node.js nao encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando servidor..." -ForegroundColor Cyan

# Criar script temporario para rodar o servidor
$tempScript = Join-Path $env:TEMP "tst-facil-server.ps1"
$scriptContent = @"
Set-Location '$scriptPath'
`$env:NODE_ENV = 'development'
pnpm dev
"@
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

# Iniciar processo em background sem janela
$process = Start-Process powershell.exe -ArgumentList "-NoProfile", "-ExecutionPolicy Bypass", "-File", "`"$tempScript`"" -WindowStyle Hidden -PassThru

# Aguardar alguns segundos para o servidor iniciar
Start-Sleep -Seconds 8

# Verificar se esta rodando
$tentativas = 0
$maxTentativas = 10

while ($tentativas -lt $maxTentativas) {
    $conexao = Test-NetConnection -ComputerName localhost -Port $porta -InformationLevel Quiet -WarningAction SilentlyContinue
    
    if ($conexao) {
        Write-Host "Servidor iniciado com sucesso!" -ForegroundColor Green
        Write-Host "Acesse: http://localhost:$porta/vendas" -ForegroundColor Cyan
        Write-Host "Processo ID: $($process.Id)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Para parar o servidor, execute: .\parar-servidor.ps1" -ForegroundColor Yellow
        exit 0
    }
    
    $tentativas++
    Start-Sleep -Seconds 2
}

Write-Host "Servidor pode estar iniciando ainda..." -ForegroundColor Yellow
Write-Host "Tente acessar: http://localhost:$porta/vendas" -ForegroundColor Cyan
Write-Host "Processo ID: $($process.Id)" -ForegroundColor Gray
