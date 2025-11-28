# 🚀 Guia Completo de Publicação - TST Fácil

## 📊 Análise de Opções

### ✅ **RECOMENDAÇÃO: Railway (Melhor Custo-Benefício)**

**Por quê?**
- ✅ Free tier generoso ($5 crédito/mês)
- ✅ MySQL incluído gratuitamente
- ✅ Deploy automático do GitHub
- ✅ Muito fácil de configurar
- ✅ Suporta Node.js + MySQL perfeitamente
- ✅ SSL automático (HTTPS)
- ✅ Domínio personalizado gratuito

**Custo:** Grátis para começar, depois ~$5-20/mês conforme uso

---

### 🥈 **Alternativa: Render**

**Por quê?**
- ✅ Free tier disponível
- ✅ MySQL gratuito (com limitações)
- ✅ Deploy automático
- ⚠️ Free tier pode "dormir" após inatividade

**Custo:** Grátis (com limitações) ou $7/mês para sempre ativo

---

## 🎯 PASSO A PASSO - Railway (Recomendado)

### **Pré-requisitos**
1. Conta no GitHub (já tem ✅)
2. Conta no Railway (grátis)
3. Projeto no GitHub (já tem ✅)

---

### **PASSO 1: Preparar o Projeto**

#### 1.1 Verificar arquivos necessários

```powershell
# Verificar se existe .env.example ou documentação de variáveis
cd C:\Projeto-tst-facil\tst-facil
```

#### 1.2 Criar arquivo de variáveis de ambiente

Crie um arquivo `.env.example` com todas as variáveis necessárias (sem valores sensíveis):

```env
# Banco de Dados (Railway cria automaticamente)
DATABASE_URL=mysql://user:password@host:port/database

# Ambiente
NODE_ENV=production
PORT=3000

# Segurança
JWT_SECRET=sua-chave-secreta-super-forte-aqui
COOKIE_SECRET=sua-chave-cookie-secreta-aqui
ENCRYPTION_KEY=sua-chave-criptografia-aqui

# CORS
ALLOWED_ORIGINS=https://seu-dominio.railway.app,https://www.seu-dominio.com

# OAuth (opcional)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
VITE_APP_ID=
```

---

### **PASSO 2: Configurar Railway**

#### 2.1 Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em "Login" → "Login with GitHub"
3. Autorize o Railway a acessar seu GitHub

#### 2.2 Criar novo projeto

1. No Railway, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha o repositório `tst-facil`
4. Railway vai detectar automaticamente o projeto

#### 2.3 Adicionar MySQL

1. No projeto Railway, clique em "+ New"
2. Selecione "Database" → "Add MySQL"
3. Railway cria automaticamente o banco
4. **IMPORTANTE:** Anote as credenciais do banco!

---

### **PASSO 3: Configurar Variáveis de Ambiente**

#### 3.1 No Railway, vá em "Variables"

Adicione as seguintes variáveis:

```env
# Banco de Dados (Railway fornece automaticamente)
DATABASE_URL=${{MySQL.DATABASE_URL}}

# Ambiente
NODE_ENV=production
PORT=${{PORT}}

# Segurança (GERE VALORES ÚNICOS E FORTES!)
JWT_SECRET=<gere-uma-chave-aleatoria-forte>
COOKIE_SECRET=<gere-outra-chave-aleatoria-forte>
ENCRYPTION_KEY=<gere-mais-uma-chave-aleatoria-forte>

# CORS (ajuste depois de ter o domínio)
ALLOWED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}

# OAuth (opcional, deixe vazio se não usar)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
VITE_APP_ID=
```

#### 3.2 Gerar chaves secretas

```powershell
# No PowerShell, execute:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Execute 3 vezes para gerar JWT_SECRET, COOKIE_SECRET e ENCRYPTION_KEY.

---

### **PASSO 4: Configurar Build**

#### 4.1 Railway detecta automaticamente, mas verifique:

1. Vá em "Settings" → "Build Command"
2. Deve estar: `pnpm build:electron` ou `pnpm build`
3. Vá em "Settings" → "Start Command"
4. Deve estar: `pnpm start` ou `node dist/index.js`

#### 4.2 Ajustar se necessário:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
node dist/index.js
```

**Root Directory:**
```
./
```

---

### **PASSO 5: Executar Migrações do Banco**

#### 5.1 Criar script de migração

Railway pode executar comandos. Vá em "Deployments" → "View Logs" e execute:

```bash
pnpm deploy:migrate
```

Ou configure um script no `package.json`:

```json
"deploy:migrate": "tsx scripts/deploy-migrate.ts"
```

---

### **PASSO 6: Criar Usuário Admin**

#### 6.1 Executar script de criação

No Railway, vá em "Deployments" → "View Logs" e execute:

```bash
pnpm deploy:create-admin
```

Ou configure manualmente no banco de dados.

---

### **PASSO 7: Configurar Domínio**

#### 7.1 Domínio Railway (grátis)

1. No Railway, vá em "Settings" → "Domains"
2. Railway fornece um domínio grátis: `seu-projeto.railway.app`
3. Clique em "Generate Domain"
4. Copie o domínio gerado

#### 7.2 Atualizar ALLOWED_ORIGINS

1. Vá em "Variables"
2. Atualize `ALLOWED_ORIGINS` com o novo domínio:
   ```
   ALLOWED_ORIGINS=https://seu-projeto.railway.app
   ```

#### 7.3 Domínio personalizado (opcional)

1. No Railway, vá em "Settings" → "Domains"
2. Clique em "Custom Domain"
3. Adicione seu domínio (ex: `tstfacil.com.br`)
4. Configure DNS conforme instruções do Railway

---

### **PASSO 8: Verificar Deploy**

#### 8.1 Acessar o sistema

1. Acesse: `https://seu-projeto.railway.app`
2. Deve aparecer a tela de login
3. Faça login com o usuário admin criado

#### 8.2 Verificar logs

1. No Railway, vá em "Deployments"
2. Clique no deployment mais recente
3. Veja os logs para verificar erros

---

## 💰 **CUSTOS**

### Railway Free Tier
- **$5 crédito/mês** (grátis)
- MySQL: ~$5/mês (consome crédito)
- App: ~$5-10/mês (consome crédito)
- **Total:** Grátis até $5/mês, depois paga a diferença

### Railway Paid
- **$20/mês** (Hobby plan)
- Inclui $20 crédito
- MySQL + App geralmente cabem no plano

---

## 🔄 **DEPLOY AUTOMÁTICO**

### Configurar GitHub Actions (Opcional)

Railway já faz deploy automático quando você faz push no GitHub!

1. Faça push para `main`:
   ```powershell
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. Railway detecta automaticamente e faz deploy

---

## 📋 **CHECKLIST FINAL**

- [ ] Conta Railway criada
- [ ] Projeto conectado ao GitHub
- [ ] MySQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Chaves secretas geradas
- [ ] Build e Start commands configurados
- [ ] Migrações executadas
- [ ] Usuário admin criado
- [ ] Domínio configurado
- [ ] Sistema acessível e funcionando
- [ ] Testes realizados

---

## 🆘 **TROUBLESHOOTING**

### Erro: "Cannot connect to database"
- Verifique se `DATABASE_URL` está correto
- Verifique se MySQL está rodando no Railway

### Erro: "Port already in use"
- Railway define `PORT` automaticamente
- Use `process.env.PORT` no código (já está ✅)

### Erro: "Build failed"
- Verifique logs no Railway
- Verifique se `package.json` tem scripts corretos
- Verifique se todas as dependências estão instaladas

### Página em branco
- Verifique se frontend foi compilado (`pnpm build`)
- Verifique se `client/dist` existe
- Verifique logs do servidor

---

## 📞 **PRÓXIMOS PASSOS**

1. **Seguir este guia passo a passo**
2. **Testar todas as funcionalidades**
3. **Configurar backup do banco** (Railway tem backup automático)
4. **Monitorar uso** (Railway dashboard)
5. **Otimizar custos** conforme necessário

---

## 💡 **DICAS**

- Comece com o free tier do Railway
- Monitore o uso nos primeiros meses
- Configure alertas de uso no Railway
- Faça backup regular do banco
- Use domínio personalizado para profissionalismo
- Configure SSL (Railway faz automaticamente)

---

## 🎯 **RESUMO RÁPIDO**

1. **Railway** → Criar conta → Conectar GitHub
2. **MySQL** → Adicionar database
3. **Variáveis** → Configurar env vars
4. **Deploy** → Railway faz automaticamente
5. **Migrar** → Executar migrações
6. **Admin** → Criar usuário admin
7. **Acessar** → Testar sistema online

**Tempo estimado:** 30-60 minutos
**Custo:** Grátis para começar

















