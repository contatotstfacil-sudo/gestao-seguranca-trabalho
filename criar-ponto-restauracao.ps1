# Script para criar um novo ponto de restauracao
# Uso: .\criar-ponto-restauracao.ps1 [descricao-opcional]

param(
    [string]$descricao = ""
)

Write-Host "=== CRIAR PONTO DE RESTAURACAO ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos em um repositorio Git
if (-not (Test-Path .git)) {
    Write-Host "ERRO: Nao e um repositorio Git!" -ForegroundColor Red
    exit 1
}

# Verificar se ha mudancas para commitar
$status = git status --porcelain
if (-not $status) {
    Write-Host "AVISO: Nenhuma mudanca detectada para commitar." -ForegroundColor Yellow
    Write-Host "Deseja criar um ponto de restauracao mesmo assim? (S/N)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -ne "S" -and $confirm -ne "s") {
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# Criar timestamp
$data = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$tagName = "restore-point-$data"

# Se descricao foi fornecida, usar ela, senao criar uma padrao
if ([string]::IsNullOrEmpty($descricao)) {
    $commitMessage = "Ponto de restauracao - $data - Otimizacoes SEO e melhorias"
} else {
    $commitMessage = "Ponto de restauracao - $data - $descricao"
}

Write-Host "Adicionando todas as mudancas..." -ForegroundColor Cyan
git add -A

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao adicionar arquivos!" -ForegroundColor Red
    exit 1
}

Write-Host "Criando commit..." -ForegroundColor Cyan
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao criar commit!" -ForegroundColor Red
    exit 1
}

Write-Host "Criando tag: $tagName" -ForegroundColor Cyan
$tagMessage = "Ponto de restauracao criado em $data`n$commitMessage"
git tag -a $tagName -m $tagMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao criar tag!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== PONTO DE RESTAURACAO CRIADO COM SUCESSO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Informacoes:" -ForegroundColor Cyan
Write-Host "   Tag: $tagName" -ForegroundColor White
Write-Host "   Commit: $commitMessage" -ForegroundColor White
Write-Host ""
Write-Host "Para restaurar este ponto no futuro:" -ForegroundColor Yellow
Write-Host "   .\restaurar-ponto-restauracao.ps1 $tagName" -ForegroundColor Gray
Write-Host ""
Write-Host "Para listar todos os pontos:" -ForegroundColor Yellow
Write-Host "   .\listar-pontos-restauracao.ps1" -ForegroundColor Gray
Write-Host ""





