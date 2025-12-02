# 🚀 Guia Rápido - Liberar Sistema para Testes em Rede Local

## ⚡ Método Mais Rápido (1 comando)

```powershell
pnpm dev:rede-local
```

**OU:**

```powershell
.\scripts\iniciar-servidor-rede-local.ps1
```

O script vai:
- ✅ Descobrir seu IP automaticamente
- ✅ Configurar tudo automaticamente
- ✅ Mostrar o IP para compartilhar
- ✅ Iniciar o servidor

---

## 📋 Passo a Passo Manual

### 1. Descobrir Seu IP

```powershell
ipconfig
```

Procure por "Endereço IPv4" (ex: `192.168.1.100`)

### 2. Iniciar Servidor

```powershell
# Configure (substitua SEU_IP pelo IP encontrado)
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://SEU_IP:3000"

# Inicie
npx tsx watch server/_core/index.ts
```

### 3. Liberar Firewall (Importante!)

**PowerShell como Administrador:**
```powershell
New-NetFirewallRule -DisplayName "TST Facil - Porta 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 4. Compartilhar com Técnicos

**URL:** `http://SEU_IP:3000`

**Exemplo:** `http://192.168.1.100:3000`

---

## 👥 Criar Usuários de Teste

### Opção 1: Script Rápido

```bash
npx tsx scripts/criar-usuario-teste-rapido.ts
```

Cria automaticamente:
- **Email:** `tecnico@teste.com`
- **Senha:** `teste123`
- **Acesso:** 7 dias

### Opção 2: Via Interface

1. Faça login como admin
2. Vá em "Administração de Clientes"
3. Clique em "Novo Cliente"
4. Marque "Modo Demonstração"
5. Defina dias de acesso
6. Cadastre e crie usuário

---

## ✅ Checklist Rápido

- [ ] Executei `pnpm dev:rede-local`
- [ ] Anotei o IP mostrado no console
- [ ] Liberei o firewall (porta 3000)
- [ ] Criei usuários de teste
- [ ] Compartilhei URL e credenciais com técnicos

---

## 🆘 Problemas?

### "Não consigo acessar"
- ✅ Verifique firewall (porta 3000)
- ✅ Verifique se está na mesma rede
- ✅ Verifique se o IP está correto

### "Erro de CORS"
- ✅ Reinicie o servidor
- ✅ Verifique ALLOWED_ORIGINS no .env

### "Página não carrega"
- ✅ Tente pelo IP direto (não localhost)
- ✅ Verifique se servidor está rodando

---

## 💡 Dica

O script `iniciar-servidor-rede-local.ps1` faz tudo automaticamente! 
Basta executar e seguir as instruções na tela.

