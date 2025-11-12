# Script para parar o servidor TST Facil
Write-Host "Parando servidor TST Facil..." -ForegroundColor Yellow

# Encontrar processos Node.js relacionados ao projeto
$processos = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node.exe*"
}

if ($processos) {
    $contador = 0
    foreach ($proc in $processos) {
        try {
            # Verificar se e o processo do servidor (porta 3000)
            $porta = Get-NetTCPConnection -OwningProcess $proc.Id -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 3000 }
            
            if ($porta) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $contador++
                Write-Host "Processo $($proc.Id) finalizado" -ForegroundColor Green
            }
        } catch {
            # Tentar parar mesmo assim se nao conseguir verificar porta
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $contador++
            } catch {}
        }
    }
    
    if ($contador -gt 0) {
        Write-Host ""
        Write-Host "$contador processo(s) finalizado(s)" -ForegroundColor Green
    } else {
        Write-Host "Nenhum processo do servidor encontrado" -ForegroundColor Yellow
    }
} else {
    Write-Host "Nenhum processo Node.js encontrado" -ForegroundColor Yellow
}

# Limpar script temporario se existir
$tempScript = Join-Path $env:TEMP "tst-facil-server.ps1"
if (Test-Path $tempScript) {
    Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Concluido!" -ForegroundColor Green
