# Script para restaurar o sistema para um ponto de restauracao anterior
# SEMPRE cria backup antes de restaurar para evitar perda de dados
# Uso: .\restaurar-ponto-restauracao.ps1 [nome-da-tag]

param(
    [string]$tag = ""
)

Write-Host "=== RESTAURACAO DE PONTO DE RESTAURACAO ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos em um repositorio Git
if (-not (Test-Path .git)) {
    Write-Host "ERRO: Nao e um repositorio Git!" -ForegroundColor Red
    exit 1
}

# Se nenhuma tag foi especificada, listar todas as tags disponiveis
if ([string]::IsNullOrEmpty($tag)) {
    Write-Host "Pontos de restauracao disponiveis:" -ForegroundColor Yellow
    Write-Host ""
    
    $tags = git tag -l "restore-point-*" | Sort-Object -Descending
    if ($tags.Count -eq 0) {
        Write-Host "Nenhum ponto de restauracao encontrado!" -ForegroundColor Red
        exit 1
    }
    
    $index = 1
    foreach ($t in $tags) {
        $commitDate = git log -1 --format="%ai" $t
        Write-Host "  $index. $t (Criado em: $commitDate)" -ForegroundColor White
        $index++
    }
    
    Write-Host ""
    $selected = Read-Host "Digite o numero do ponto de restauracao que deseja restaurar"
    
    if ([int]$selected -ge 1 -and [int]$selected -le $tags.Count) {
        $tag = $tags[[int]$selected - 1]
    } else {
        Write-Host "Selecao invalida!" -ForegroundColor Red
        exit 1
    }
}

# Verificar se a tag existe
$tagExists = git rev-parse --verify "refs/tags/$tag" 2>$null
if (-not $tagExists) {
    Write-Host "Tag '$tag' nao encontrada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tags disponiveis:" -ForegroundColor Yellow
    git tag -l "restore-point-*"
    exit 1
}

Write-Host ""
Write-Host "ATENCAO: Esta operacao ira descartar todas as mudancas nao commitadas!" -ForegroundColor Yellow
Write-Host "Tag selecionada: $tag" -ForegroundColor Cyan
Write-Host ""

# Verificar se ha mudancas nao commitadas
$hasChanges = $false
$status = git status --porcelain
if ($status) {
    $hasChanges = $true
    Write-Host "Mudancas nao commitadas detectadas:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
}

$confirm = Read-Host "Deseja continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operacao cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== CRIANDO BACKUP DE SEGURANCA ===" -ForegroundColor Green
Write-Host ""

# Criar timestamp para o backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBranch = "backup-before-restore-$timestamp"
$backupStash = "backup-stash-$timestamp"

# PASSO 1: Criar stash com mudancas nao commitadas (se houver)
if ($hasChanges) {
    Write-Host "1. Salvando mudancas nao commitadas em stash: $backupStash" -ForegroundColor Cyan
    git stash push -m $backupStash
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao criar stash de backup!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   OK: Stash criado com sucesso" -ForegroundColor Green
} else {
    Write-Host "1. Nenhuma mudanca nao commitada para salvar" -ForegroundColor Gray
}

# PASSO 2: Criar branch de backup do estado atual
Write-Host "2. Criando branch de backup: $backupBranch" -ForegroundColor Cyan
$currentBranch = git rev-parse --abbrev-ref HEAD
git branch $backupBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao criar branch de backup!" -ForegroundColor Red
    # Tentar restaurar stash se foi criado
    if ($hasChanges) {
        git stash pop 2>$null
    }
    exit 1
}
Write-Host "   OK: Branch de backup criada com sucesso" -ForegroundColor Green

# PASSO 3: Verificar se o backup foi criado corretamente
Write-Host "3. Verificando integridade do backup..." -ForegroundColor Cyan
$backupExists = git rev-parse --verify "refs/heads/$backupBranch" 2>$null
if (-not $backupExists) {
    Write-Host "ERRO: Backup nao foi criado corretamente!" -ForegroundColor Red
    exit 1
}
Write-Host "   OK: Backup verificado" -ForegroundColor Green

Write-Host ""
Write-Host "=== BACKUP CRIADO COM SUCESSO ===" -ForegroundColor Green
Write-Host "   Branch: $backupBranch" -ForegroundColor White
if ($hasChanges) {
    Write-Host "   Stash: $backupStash" -ForegroundColor White
}
Write-Host ""

# PASSO 4: Agora sim, restaurar para a tag
Write-Host "=== RESTAURANDO PARA O PONTO: $tag ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Restaurando arquivos..." -ForegroundColor Cyan
git reset --hard $tag

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== RESTAURACAO CONCLUIDA COM SUCESSO ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informacoes:" -ForegroundColor Cyan
    Write-Host "   Tag restaurada: $tag" -ForegroundColor White
    Write-Host "   Branch de backup: $backupBranch" -ForegroundColor White
    if ($hasChanges) {
        Write-Host "   Stash de backup: $backupStash" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Comandos uteis:" -ForegroundColor Yellow
    Write-Host "   Ver backup: git checkout $backupBranch" -ForegroundColor Gray
    if ($hasChanges) {
        Write-Host "   Ver stash: git stash list" -ForegroundColor Gray
        Write-Host "   Aplicar stash: git stash apply stash@{0}" -ForegroundColor Gray
    }
    Write-Host "   Reinstalar dependencias: pnpm install" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERRO: Falha ao restaurar!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tentando restaurar do backup..." -ForegroundColor Yellow
    git checkout $backupBranch 2>$null
    if ($hasChanges) {
        git stash pop 2>$null
    }
    Write-Host "Estado anterior foi restaurado do backup." -ForegroundColor Green
    exit 1
}
