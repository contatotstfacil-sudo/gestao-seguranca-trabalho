# Script para ativar o servidor local TST Fácil
Write-Host "🚀 Ativando servidor TST Fácil..." -ForegroundColor Green
Write-Host ""

# Função para matar processos na porta 3000
function Liberar-Porta3000 {
    Write-Host "🔍 Verificando porta 3000..." -ForegroundColor Cyan
    try {
        $conexoes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($conexoes) {
            Write-Host "⚠️  Porta 3000 está em uso. Liberando..." -ForegroundColor Yellow
            foreach ($conexao in $conexoes) {
                $pid = $conexao.OwningProcess
                $processo = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($processo) {
                    Write-Host "   Encerrando processo: $($processo.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
            Start-Sleep -Seconds 2
            Write-Host "✅ Porta 3000 liberada" -ForegroundColor Green
        } else {
            Write-Host "✅ Porta 3000 está livre" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Não foi possível verificar a porta: $_" -ForegroundColor Yellow
    }
}

# Função para matar processos Node antigos
function Limpar-ProcessosNode {
    Write-Host "🧹 Limpando processos Node antigos..." -ForegroundColor Cyan
    $processosNode = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($processosNode) {
        Write-Host "   Encontrados $($processosNode.Count) processo(s) Node" -ForegroundColor Yellow
        foreach ($proc in $processosNode) {
            Write-Host "   Encerrando: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
        Write-Host "✅ Processos Node limpos" -ForegroundColor Green
    } else {
        Write-Host "✅ Nenhum processo Node encontrado" -ForegroundColor Green
    }
}

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto (tst-facil)" -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "   Copiando .env.example para .env..." -ForegroundColor Cyan
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "   ⚠️  Crie um arquivo .env manualmente" -ForegroundColor Yellow
    }
}

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
}

# Verificar Docker
Write-Host ""
Write-Host "🐳 Verificando Docker..." -ForegroundColor Cyan
try {
    $dockerInfo = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        $mysqlContainer = docker ps --filter "name=mysql" --format "{{.Names}}" 2>&1
        if ($mysqlContainer -match "mysql") {
            Write-Host "✅ Container MySQL está rodando" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Container MySQL não encontrado" -ForegroundColor Yellow
            Write-Host "   Certifique-se de que o Docker Desktop está aberto e o MySQL está rodando" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Docker não está acessível" -ForegroundColor Yellow
        Write-Host "   Certifique-se de que o Docker Desktop está aberto" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Não foi possível verificar Docker: $_" -ForegroundColor Yellow
}

# Limpar processos antigos
Write-Host ""
Liberar-Porta3000
Start-Sleep -Seconds 1
Limpar-ProcessosNode
Start-Sleep -Seconds 1

# Iniciar o servidor
Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Acesse: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Executar o comando dev
pnpm dev
