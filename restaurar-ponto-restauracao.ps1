# Script para restaurar o sistema para um ponto de restauração anterior
# Uso: .\restaurar-ponto-restauracao.ps1 [nome-da-tag]

param(
    [string]$tag = ""
)

Write-Host "🔄 Restauração de Ponto de Restauração" -ForegroundColor Cyan
Write-Host ""

# Se nenhuma tag foi especificada, listar todas as tags disponíveis
if ([string]::IsNullOrEmpty($tag)) {
    Write-Host "📋 Pontos de restauração disponíveis:" -ForegroundColor Yellow
    Write-Host ""
    
    $tags = git tag -l "restore-point-*" | Sort-Object -Descending
    if ($tags.Count -eq 0) {
        Write-Host "❌ Nenhum ponto de restauração encontrado!" -ForegroundColor Red
        exit 1
    }
    
    $index = 1
    foreach ($t in $tags) {
        $commitDate = git log -1 --format="%ai" $t
        Write-Host "  $index. $t (Criado em: $commitDate)" -ForegroundColor White
        $index++
    }
    
    Write-Host ""
    $selected = Read-Host "Digite o número do ponto de restauração que deseja restaurar"
    
    if ([int]$selected -ge 1 -and [int]$selected -le $tags.Count) {
        $tag = $tags[[int]$selected - 1]
    } else {
        Write-Host "❌ Seleção inválida!" -ForegroundColor Red
        exit 1
    }
}

# Verificar se a tag existe
$tagExists = git rev-parse --verify "refs/tags/$tag" 2>$null
if (-not $tagExists) {
    Write-Host "❌ Tag '$tag' não encontrada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tags disponíveis:" -ForegroundColor Yellow
    git tag -l "restore-point-*"
    exit 1
}

Write-Host ""
Write-Host "⚠️  ATENÇÃO: Esta operação irá descartar todas as mudanças não commitadas!" -ForegroundColor Yellow
Write-Host "Tag selecionada: $tag" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Deseja continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Restaurando para o ponto: $tag" -ForegroundColor Green
Write-Host ""

# Fazer backup do estado atual (opcional)
$backupBranch = "backup-before-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "📦 Criando backup do estado atual em branch: $backupBranch" -ForegroundColor Cyan
git branch $backupBranch 2>$null

# Resetar para a tag
Write-Host "🔄 Restaurando arquivos..." -ForegroundColor Cyan
git reset --hard $tag

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Restauração concluída com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Informações:" -ForegroundColor Cyan
    Write-Host "   Tag restaurada: $tag" -ForegroundColor White
    Write-Host "   Backup criado em: $backupBranch" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Para ver o backup: git checkout $backupBranch" -ForegroundColor Yellow
    Write-Host "💡 Para reinstalar dependências: pnpm install" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Erro ao restaurar!" -ForegroundColor Red
    exit 1
}

