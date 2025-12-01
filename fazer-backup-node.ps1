# Script PowerShell para executar o backup usando Node.js
# Este script não requer mysqldump instalado

Write-Host "=== BACKUP DO BANCO DE DADOS (Node.js) ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está disponível
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "ERRO: Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "Instale o Node.js para usar este script" -ForegroundColor Yellow
    exit 1
}

# Executar script TypeScript
Write-Host "Executando backup usando Node.js..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "fazer-backup-node.ts"

try {
    npx --yes tsx $scriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Backup concluido com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERRO: Falha ao criar backup!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}















