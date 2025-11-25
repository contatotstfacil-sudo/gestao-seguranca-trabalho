@echo off
echo 🚀 Ativando servidor TST Facil...
echo.

REM Verificar se pnpm está instalado
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm nao encontrado! Instale o pnpm primeiro.
    pause
    exit /b 1
)

REM Limpar processos Node antigos
echo 🧹 Limpando processos Node antigos...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Processos Node limpos
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Nenhum processo Node encontrado
)

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call pnpm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erro ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Verificar Docker
echo 🐳 Verificando Docker...
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Docker nao esta rodando ou nao esta acessivel
    echo    Certifique-se de que o Docker Desktop esta aberto
) else (
    echo ✅ Docker esta rodando
)

echo.
echo 🚀 Iniciando servidor de desenvolvimento...
echo    Acesse: http://localhost:3000
echo    Pressione Ctrl+C para parar o servidor
echo.

REM Executar o servidor
call pnpm dev

pause

