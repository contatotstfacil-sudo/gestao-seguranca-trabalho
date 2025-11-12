# ⚡ Publicação Rápida - 5 Passos

## 🎯 Método Mais Rápido: Railway

### **PASSO 1: Criar Conta Railway** (5 min)
1. Acesse: https://railway.app
2. Clique "Login with GitHub"
3. Autorize Railway

### **PASSO 2: Criar Projeto** (2 min)
1. "New Project" → "Deploy from GitHub repo"
2. Escolha `tst-facil`
3. Railway detecta automaticamente

### **PASSO 3: Adicionar MySQL** (1 min)
1. "+ New" → "Database" → "Add MySQL"
2. Pronto! Railway cria automaticamente

### **PASSO 4: Configurar Variáveis** (5 min)
No Railway → "Variables", adicione:

```env
DATABASE_URL=${{MySQL.DATABASE_URL}}
NODE_ENV=production
PORT=${{PORT}}
JWT_SECRET=<gere-chave-aleatoria>
COOKIE_SECRET=<gere-chave-aleatoria>
ENCRYPTION_KEY=<gere-chave-aleatoria>
ALLOWED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

**Gerar chaves (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```
Execute 3 vezes e use os resultados.

### **PASSO 5: Deploy e Migrar** (5 min)
1. Railway faz deploy automaticamente
2. Vá em "Deployments" → "View Logs"
3. Execute: `pnpm deploy:migrate`
4. Execute: `pnpm deploy:create-admin`

**Pronto!** Sistema online em ~20 minutos! 🎉

---

## 🌐 **Acessar Sistema**

Railway fornece um domínio grátis:
- `seu-projeto.railway.app`

Acesse e faça login!

---

## 💰 **Custo**

- **Grátis** para começar ($5 crédito/mês)
- Depois: ~$5-20/mês conforme uso
- **Muito mais barato** que AWS/GCP

---

## ✅ **Vantagens Railway**

- ✅ Deploy automático do GitHub
- ✅ MySQL incluído
- ✅ SSL automático (HTTPS)
- ✅ Domínio grátis
- ✅ Muito fácil de usar
- ✅ Dashboard completo

---

## 🆘 **Problemas?**

Veja o guia completo: `GUIA_PUBLICACAO_COMPLETO.md`




