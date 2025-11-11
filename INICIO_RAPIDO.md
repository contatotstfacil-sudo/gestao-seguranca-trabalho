# 🚀 Início Rápido - TST Fácil

## 💻 Usar Localmente

### 1. Configurar ambiente local (primeira vez)
```bash
pnpm setup:local
```

### 2. Editar `.env.local` com suas credenciais
```env
DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/sst
```

### 3. Iniciar servidor local
```bash
# Windows
pnpm dev:win

# Linux/Mac
pnpm dev
```

### 4. Acessar
- **URL**: http://localhost:3000
- **Login**: CPF `38099529820` / Senha `G476589496i@`

---

## 🌐 Deploy Online (Railway)

### 1. Commit e push
```bash
git add .
git commit -m "Preparar deploy"
git push
```

### 2. Criar projeto no Railway
1. Acesse: https://railway.app
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Escolha seu repositório

### 3. Adicionar banco MySQL
1. "+ New" → "Database" → "MySQL"
2. Railway cria `DATABASE_URL` automaticamente

### 4. Configurar variáveis
No Railway → "Variables", adicione:
```env
NODE_ENV=production
JWT_SECRET=<gere-chave>
COOKIE_SECRET=<gere-chave>
ENCRYPTION_KEY=<gere-chave>
ALLOWED_ORIGINS=https://seu-projeto.railway.app
```

### 5. Executar migrações
Railway → "Deployments" → "..." → "Open Shell":
```bash
pnpm db:push
pnpm deploy:create-admin
```

### 6. Acessar online
Railway → "Settings" → "Domains" → clique no domínio

---

## ✅ Comandos Úteis

```bash
# Configurar local
pnpm setup:local

# Verificar banco
pnpm check:db

# Iniciar local
pnpm dev:win  # Windows
pnpm dev       # Linux/Mac

# Build para produção
pnpm build

# Verificar antes de deploy
pnpm check:deploy
```

---

## 📝 Notas

- **Local**: Usa `.env.local` (não commitado)
- **Online**: Usa variáveis do Railway/Vercel
- **Banco Local**: MySQL na sua máquina
- **Banco Online**: MySQL gerenciado pelo Railway

---

## 🆘 Problemas?

- **Banco não conecta**: Verifique MySQL e `DATABASE_URL`
- **Porta ocupada**: Sistema usa próxima porta disponível
- **Erro no deploy**: Verifique logs no Railway

