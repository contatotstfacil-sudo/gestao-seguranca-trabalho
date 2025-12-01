# 🚀 Como Ativar o Servidor Local

## Método Rápido (Recomendado)

### Windows PowerShell:
```powershell
.\ativar-servidor.ps1
```

### Windows CMD:
```cmd
ativar-servidor.bat
```

### Linux/Mac:
```bash
pnpm dev
```

## Método Manual

### 1. Abra o terminal no diretório do projeto:
```bash
cd tst-facil
```

### 2. Verifique se o Docker está rodando:
- Abra o Docker Desktop
- Verifique se o container MySQL está rodando

### 3. Instale as dependências (se necessário):
```bash
pnpm install
```

### 4. Inicie o servidor:
```bash
pnpm dev
```

### 5. Acesse no navegador:
```
http://localhost:3000
```

## Se o Servidor Não Iniciar

### Problema: Porta 3000 já está em uso

**Solução 1 - Usar o script automático:**
```powershell
.\ativar-servidor.ps1
```
O script vai automaticamente:
- Matar processos na porta 3000
- Limpar processos Node antigos
- Iniciar o servidor

**Solução 2 - Manual:**
```powershell
# Ver processos na porta 3000
netstat -ano | findstr :3000

# Matar processo específico (substitua PID pelo número do processo)
taskkill /PID <PID> /F

# Depois inicie o servidor
pnpm dev
```

### Problema: Docker não está rodando

1. Abra o Docker Desktop
2. Aguarde até aparecer "Docker Desktop is running"
3. Verifique se o container MySQL está rodando
4. Tente novamente

### Problema: Erro de dependências

```bash
# Limpar e reinstalar
rm -rf node_modules
pnpm install
```

### Problema: Erro de .env

1. Verifique se existe o arquivo `.env` na raiz do projeto
2. Se não existir, copie o `.env.example`:
   ```bash
   copy .env.example .env
   ```
3. Configure a `DATABASE_URL` no arquivo `.env`

## Verificar se o Servidor Está Rodando

### No Terminal:
Você deve ver mensagens como:
```
[Server] ✅ Servidor rodando em http://localhost:3000/
[Vite] Servidor Vite criado com sucesso
```

### No Navegador:
1. Abra `http://localhost:3000`
2. Abra o Console do Desenvolvedor (F12)
3. Deve aparecer: "✅ Iniciando renderização do React..."
4. Deve aparecer: "✅ React renderizado com sucesso!"

## Comandos Úteis

```bash
# Verificar processos Node
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Verificar porta 3000
netstat -ano | findstr :3000

# Matar todos os processos Node
Get-Process -Name "node" | Stop-Process -Force

# Verificar se o servidor está respondendo
curl http://localhost:3000
```

## Troubleshooting

### Página em branco:
1. Abra o Console do navegador (F12)
2. Verifique erros em vermelho
3. Verifique a aba Network para requisições falhando
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Servidor não responde:
1. Verifique os logs no terminal
2. Verifique se há erros de inicialização
3. Verifique se o Docker está rodando
4. Verifique se a porta 3000 está livre

### Erro de conexão com banco:
1. Verifique se o Docker está rodando
2. Verifique se o container MySQL está ativo
3. Verifique a `DATABASE_URL` no arquivo `.env`
4. Teste a conexão:
   ```bash
   pnpm check:db
   ```








