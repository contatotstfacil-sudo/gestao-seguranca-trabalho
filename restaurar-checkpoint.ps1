# Script para restaurar ponto de checkpoint
# Uso: .\restaurar-checkpoint.ps1 [nome-da-tag]

param(
    [string]$tagName = ""
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESTAURAR PONTO DE CHECKPOINT" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Listar tags disponíveis
Write-Host "Tags de restauracao disponiveis:" -ForegroundColor Green
$tags = git tag -l | Sort-Object -Descending
$tags | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

if ($tags.Count -eq 0) {
    Write-Host "`nNenhuma tag encontrada!" -ForegroundColor Red
    exit 1
}

# Se não especificou tag, usar a mais recente
if ([string]::IsNullOrEmpty($tagName)) {
    $tagName = $tags[0]
    Write-Host "`nUsando tag mais recente: $tagName" -ForegroundColor Yellow
} else {
    if ($tags -notcontains $tagName) {
        Write-Host "`nTag '$tagName' nao encontrada!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nRestaurando para: $tagName" -ForegroundColor Yellow
Write-Host "Atencao: Isso vai descartar alteracoes nao commitadas!" -ForegroundColor Red
$confirm = Read-Host "Deseja continuar? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Operacao cancelada." -ForegroundColor Yellow
    exit 0
}

# Fazer checkout da tag
git checkout $tagName

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nRestauracao concluida com sucesso!" -ForegroundColor Green
    Write-Host "Sistema restaurado para o ponto: $tagName" -ForegroundColor Green
} else {
    Write-Host "`nErro ao restaurar!" -ForegroundColor Red
    exit 1
}











