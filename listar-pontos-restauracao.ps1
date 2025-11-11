# Script para listar todos os pontos de restauracao disponiveis

Write-Host "Pontos de Restauracao Disponiveis" -ForegroundColor Cyan
Write-Host ""

$tags = git tag -l "restore-point-*" | Sort-Object -Descending

if ($tags.Count -eq 0) {
    Write-Host "Nenhum ponto de restauracao encontrado!" -ForegroundColor Red
    exit 0
}

Write-Host "Total de pontos: $($tags.Count)" -ForegroundColor Yellow
Write-Host ""

$index = 1
foreach ($tag in $tags) {
    $commitHash = git rev-parse $tag
    $commitDate = git log -1 --format="%ai" $tag
    $commitMessage = git log -1 --format="%s" $tag
    
    Write-Host "  $index. $tag" -ForegroundColor Green
    Write-Host "     Data: $commitDate" -ForegroundColor Gray
    Write-Host "     Commit: $commitHash" -ForegroundColor Gray
    Write-Host "     Mensagem: $commitMessage" -ForegroundColor Gray
    Write-Host ""
    
    $index++
}

Write-Host "Para restaurar um ponto, use: .\restaurar-ponto-restauracao.ps1 [nome-da-tag]" -ForegroundColor Yellow
Write-Host "Ou execute: .\restaurar-ponto-restauracao.ps1 (para selecao interativa)" -ForegroundColor Yellow
