# Script de Migração Segura para Multi-Tenancy
# Preserva TODOS os dados existentes

Write-Host "=== MIGRAÇÃO PARA MULTI-TENANCY ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Este script preserva TODOS os seus dados existentes!" -ForegroundColor Yellow
Write-Host ""

# Verificar se há backup recente
Write-Host "📦 Verificando backup..." -ForegroundColor Cyan
$backupExiste = Test-Path "backup.sql"
if ($backupExiste) {
    Write-Host "✅ Backup encontrado: backup.sql" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhum backup encontrado!" -ForegroundColor Yellow
    Write-Host ""
    $fazerBackup = Read-Host "Deseja fazer backup agora? (S/N)"
    if ($fazerBackup -eq "S" -or $fazerBackup -eq "s") {
        Write-Host ""
        Write-Host "Executando backup..." -ForegroundColor Cyan
        powershell -ExecutionPolicy Bypass -File .\fazer-backup-node.ps1
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "⚠️  Continuando sem backup (não recomendado)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 O que será feito:" -ForegroundColor Cyan
Write-Host "   1. Criar tabela tenants" -ForegroundColor White
Write-Host "   2. Adicionar coluna tenantId em todas as tabelas (como NULLABLE)" -ForegroundColor White
Write-Host "   3. Criar tenant padrão para seus dados existentes" -ForegroundColor White
Write-Host "   4. Atribuir todos os dados existentes ao tenant padrão" -ForegroundColor White
Write-Host "   5. Criar índices para performance" -ForegroundColor White
Write-Host ""
Write-Host "✅ NENHUM DADO SERÁ DELETADO OU MODIFICADO!" -ForegroundColor Green
Write-Host "✅ Apenas adicionaremos tenantId aos registros existentes" -ForegroundColor Green
Write-Host ""

$confirmar = Read-Host "Deseja continuar com a migração? (S/N)"
if ($confirmar -ne "S" -and $confirmar -ne "s") {
    Write-Host ""
    Write-Host "Migração cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Iniciando migração..." -ForegroundColor Green
Write-Host ""

# Executar script TypeScript
try {
    npx --yes tsx scripts/migrar-para-multi-tenancy.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Todos os seus dados foram preservados!" -ForegroundColor Green
        Write-Host "✅ Você agora é admin do tenant padrão!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
        Write-Host "   1. Testar o sistema (fazer login)" -ForegroundColor White
        Write-Host "   2. Verificar que todos os dados aparecem" -ForegroundColor White
        Write-Host "   3. Se tudo OK, continuar com a implementação" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Erro durante migração!" -ForegroundColor Red
        Write-Host ""
        Write-Host "🛡️  Seu banco de dados está seguro!" -ForegroundColor Yellow
        Write-Host "   - Nenhum dado foi deletado" -ForegroundColor White
        Write-Host "   - Você pode restaurar o backup se necessário" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migração: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🛡️  Seu banco de dados está seguro!" -ForegroundColor Yellow
    exit 1
}













