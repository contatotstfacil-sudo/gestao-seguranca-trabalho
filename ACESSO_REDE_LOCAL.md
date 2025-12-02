# 🌐 Acesso em Rede Local - Para Testes com Técnicos

## Objetivo
Permitir que outros técnicos testem o sistema localmente através da rede local, sem precisar fazer deploy.

---

## 🚀 Método Rápido

### Passo 1: Iniciar Servidor em Modo Rede Local

Execute o script especial:

```powershell
.\scripts\iniciar-servidor-rede-local.ps1
```

Ou manualmente:

```powershell
# Descobrir seu IP local
ipconfig

# Configurar variáveis e iniciar
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://SEU_IP:3000"
npx tsx watch server/_core/index.ts
```

**Substitua `SEU_IP` pelo seu IP local** (ex: `192.168.1.100`)

---

## 📋 Descobrir Seu IP Local

### Windows (PowerShell)
```powershell
ipconfig | Select-String "IPv4"
```

Ou:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" }
```

### Windows (CMD)
```cmd
ipconfig
```
Procure por "Endereço IPv4" (geralmente começa com 192.168.x.x ou 10.x.x.x)

---

## 🔧 Configuração Manual

### 1. Editar arquivo `.env` ou `.env.local`

Adicione ou atualize:

```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://SEU_IP:3000
```

**Exemplo:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.100:3000
```

### 2. Iniciar Servidor

```bash
pnpm dev
# ou
npx tsx watch server/_core/index.ts
```

---

## 🔥 Liberar Firewall (Windows)

O Windows Firewall pode bloquear conexões. Libere a porta:

### Método 1: PowerShell (Como Administrador)
```powershell
New-NetFirewallRule -DisplayName "TST Facil - Porta 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Método 2: Interface Gráfica
1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações Avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → "TCP" → "Portas locais específicas: 3000"
5. Selecione "Permitir a conexão"
6. Aplique a todas as redes
7. Dê um nome: "TST Facil - Porta 3000"

---

## 👥 Para os Técnicos Acessarem

### 1. Certifique-se de que estão na mesma rede
- Mesma rede Wi-Fi
- Ou mesma rede cabeada
- Ou VPN conectada

### 2. Acessar o sistema
No navegador, acesse:
```
http://SEU_IP:3000
```

**Exemplo:**
```
http://192.168.1.100:3000
```

### 3. Credenciais de Teste

Você pode criar usuários de teste usando a funcionalidade de cadastro com modo demonstração:

1. Faça login como admin
2. Vá em "Administração de Clientes"
3. Clique em "Novo Cliente"
4. Preencha os dados
5. Marque "Modo Demonstração"
6. Defina quantidade de dias (ex: 7 dias)
7. Cadastre o cliente
8. Crie um usuário para esse cliente

---

## 🎯 Criar Usuários de Teste Rápido

### Opção 1: Via Interface (Recomendado)
1. Cadastre o cliente em modo demonstração
2. Crie usuário vinculado ao cliente
3. Compartilhe credenciais com técnico

### Opção 2: Via SQL
Execute no MySQL:

```sql
-- 1. Criar tenant de teste
INSERT INTO tenants (nome, email, plano, status, dataInicio, dataFim, valorPlano, periodicidade, statusPagamento, createdAt, updatedAt)
VALUES ('Técnico Teste', 'tecnico@teste.com', 'bronze', 'ativo', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), '0,00', 'mensal', 'pago', NOW(), NOW());

SET @tenant_id = LAST_INSERT_ID();

-- 2. Criar usuário (senha: teste123)
SET @password_hash = '$2a$10$rK9VqJ8xY5Z3mN7pQ2wH.eX8vY6zA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q';

INSERT INTO users (tenantId, name, email, passwordHash, role, openId, createdAt, updatedAt, lastSignedIn)
VALUES (@tenant_id, 'Técnico Teste', 'tecnico@teste.com', @password_hash, 'tenant_admin', CONCAT('local-', UNIX_TIMESTAMP(NOW())), NOW(), NOW(), NOW());
```

**Credenciais:**
- Email: `tecnico@teste.com`
- Senha: `teste123` (ou gere um hash novo)

---

## ✅ Checklist

- [ ] Servidor iniciado em modo rede local
- [ ] IP local descoberto e configurado
- [ ] ALLOWED_ORIGINS inclui o IP local
- [ ] Firewall liberado para porta 3000
- [ ] Técnicos estão na mesma rede
- [ ] Usuários de teste criados
- [ ] Credenciais compartilhadas

---

## 🆘 Problemas Comuns

### "Não consigo acessar de outro computador"
- ✅ Verifique se está na mesma rede
- ✅ Verifique se o firewall está liberado
- ✅ Verifique se o IP está correto
- ✅ Verifique se o servidor está rodando

### "Erro de CORS"
- ✅ Verifique se ALLOWED_ORIGINS inclui o IP
- ✅ Reinicie o servidor após mudar .env

### "Página não carrega"
- ✅ Verifique se a porta está correta
- ✅ Verifique se não há proxy/VPN interferindo
- ✅ Tente acessar pelo IP direto (sem localhost)

---

## 💡 Dicas

1. **IP Fixo:** Configure um IP fixo no seu computador para facilitar
2. **Porta Alternativa:** Se 3000 estiver ocupada, use outra (ex: 3001)
3. **Teste Local Primeiro:** Teste em `http://localhost:3000` antes de compartilhar
4. **Logs:** Monitore os logs do servidor para ver tentativas de acesso

---

## 📝 Exemplo Completo

```powershell
# 1. Descobrir IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" }).IPAddress
Write-Host "Seu IP: $ip"

# 2. Configurar
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://$ip:3000"

# 3. Iniciar
npx tsx watch server/_core/index.ts
```

**Compartilhe com técnicos:**
```
Acesse: http://$ip:3000
Login: tecnico@teste.com
Senha: teste123
```

