# Script para fazer backup do banco de dados MySQL
# Sobrescreve o backup anterior (backup.sql)

Write-Host "=== BACKUP DO BANCO DE DADOS ===" -ForegroundColor Cyan
Write-Host ""

# Carregar variáveis de ambiente
$envLocalPath = ".env.local"
$envPath = ".env"

# Carregar .env primeiro
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Carregar .env.local depois (sobrescreve)
if (Test-Path $envLocalPath) {
    Get-Content $envLocalPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Obter DATABASE_URL
$databaseUrl = $env:DATABASE_URL

if (-not $databaseUrl) {
    Write-Host "ERRO: DATABASE_URL nao encontrado!" -ForegroundColor Red
    Write-Host "Configure DATABASE_URL no arquivo .env ou .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "DATABASE_URL encontrado" -ForegroundColor Green

# Extrair informações da URL
# Formato: mysql://usuario:senha@host:porta/banco
if ($databaseUrl -match 'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $usuario = $matches[1]
    $senha = $matches[2]
    $dbHost = $matches[3]
    $porta = $matches[4]
    $banco = $matches[5] -replace '\?.*$', ''  # Remove query string se houver
    
    Write-Host "Usuario: $usuario" -ForegroundColor Gray
    Write-Host "Host: $dbHost" -ForegroundColor Gray
    Write-Host "Porta: $porta" -ForegroundColor Gray
    Write-Host "Banco: $banco" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "ERRO: Formato de DATABASE_URL invalido!" -ForegroundColor Red
    Write-Host "Formato esperado: mysql://usuario:senha@host:porta/banco" -ForegroundColor Yellow
    exit 1
}

# Nome do arquivo de backup (será sobrescrito)
$backupFile = "backup.sql"
$backupPath = Join-Path $PSScriptRoot $backupFile

Write-Host "Criando backup..." -ForegroundColor Yellow
Write-Host "Arquivo: $backupPath" -ForegroundColor Cyan
Write-Host ""

# Verificar se mysqldump está disponível
$mysqldumpPath = Get-Command mysqldump -ErrorAction SilentlyContinue

# Se não estiver no PATH, procurar em locais comuns
if (-not $mysqldumpPath) {
    $commonPaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\xampp\mysql\bin\mysqldump.exe",
        "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $mysqldumpPath = $path
            Write-Host "mysqldump encontrado em: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $mysqldumpPath) {
    Write-Host "ERRO: mysqldump nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opcoes:" -ForegroundColor Yellow
    Write-Host "1. Instale o MySQL Client" -ForegroundColor White
    Write-Host "2. Adicione o MySQL ao PATH do sistema" -ForegroundColor White
    Write-Host "3. Use o script alternativo: fazer-backup-node.ps1" -ForegroundColor White
    exit 1
}

# Executar mysqldump
try {
    # Criar variável de ambiente com senha para evitar prompt
    $env:MYSQL_PWD = $senha
    
    # Executar mysqldump
    $mysqldumpArgs = @(
        "-h", $dbHost
        "-P", $porta
        "-u", $usuario
        "--single-transaction"
        "--routines"
        "--triggers"
        "--add-drop-table"
        $banco
    )
    
    Write-Host "Executando mysqldump..." -ForegroundColor Cyan
    
    # Se $mysqldumpPath é um objeto CommandInfo, usar o Source, senão usar o caminho direto
    $mysqldumpExe = if ($mysqldumpPath -is [System.Management.Automation.CommandInfo]) {
        $mysqldumpPath.Source
    } else {
        $mysqldumpPath
    }
    
    & $mysqldumpExe $mysqldumpArgs | Out-File -FilePath $backupPath -Encoding UTF8
    
    # Limpar variável de ambiente
    Remove-Item Env:\MYSQL_PWD
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupPath).Length / 1MB
        Write-Host ""
        Write-Host "=== BACKUP CONCLUIDO COM SUCESSO ===" -ForegroundColor Green
        Write-Host "Arquivo: $backupPath" -ForegroundColor White
        Write-Host "Tamanho: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
        Write-Host ""
        Write-Host "O backup anterior foi sobrescrito." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERRO: Falha ao criar backup!" -ForegroundColor Red
        Write-Host "Verifique as credenciais e conexao com o banco." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Garantir que a variável seja removida
    if (Test-Path Env:\MYSQL_PWD) {
        Remove-Item Env:\MYSQL_PWD
    }
}

