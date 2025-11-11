# 🚀 Deploy Rápido - TST Fácil

## Opção Mais Fácil: Railway (5 minutos) ⭐

### 1. Preparar Código
```bash
# Certifique-se de que tudo está commitado
git add .
git commit -m "Preparar para deploy"
git push
```

### 2. Criar Conta Railway
1. Acesse: https://railway.app
2. Clique em "Login" → "Login with GitHub"
3. Autorize Railway a acessar seus repositórios

### 3. Criar Novo Projeto
1. Clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha seu repositório do TST Fácil
4. Railway começará a fazer deploy automaticamente

### 4. Adicionar Banco MySQL
1. No projeto Railway, clique em "+ New"
2. Selecione "Database" → "MySQL"
3. Aguarde Railway criar o banco (1-2 minutos)

### 5. Configurar Variáveis de Ambiente
1. No projeto Railway, clique em "Variables"
2. Railway já adicionou `DATABASE_URL` automaticamente
3. Adicione estas variáveis:

```env
NODE_ENV=production
JWT_SECRET=<gere-uma-chave-secreta>
COOKIE_SECRET=<gere-uma-chave-secreta>
ENCRYPTION_KEY=<gere-uma-chave-secreta>
ALLOWED_ORIGINS=https://seu-projeto.railway.app
```

**Gerar chaves seguras:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Execute 3 vezes para gerar as 3 chaves.

### 6. Executar Migrações
1. No Railway, vá em "Deployments"
2. Clique nos "..." do último deployment
3. Selecione "Open Shell"
4. Execute:
```bash
pnpm db:push
```

### 7. Criar Usuário Admin
No mesmo shell:
```bash
pnpm deploy:create-admin
```

### 8. Acessar Sistema
1. No Railway, vá em "Settings" → "Domains"
2. Railway já gerou um domínio (ex: `seu-projeto.railway.app`)
3. Clique no domínio para abrir
4. Faça login com:
   - CPF: `38099529820`
   - Senha: `G476589496i@`

### 9. Configurar Domínio Customizado (Opcional)
1. No Railway, vá em "Settings" → "Domains"
2. Clique em "Custom Domain"
3. Adicione seu domínio
4. Configure DNS conforme instruções
5. Atualize `ALLOWED_ORIGINS` com o novo domínio

---

## Checklist Rápido

- [ ] Código commitado no GitHub
- [ ] Projeto criado no Railway
- [ ] Banco MySQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas
- [ ] Admin criado
- [ ] Sistema acessível online
- [ ] Login funcionando

---

## Troubleshooting Rápido

### Deploy falha
- Verifique logs em "Deployments" → "View Logs"
- Verifique se `package.json` tem script `build` e `start`

### Banco não conecta
- Verifique se `DATABASE_URL` está nas variáveis
- Verifique se banco MySQL está rodando

### Migrações falham
- Execute manualmente: `pnpm db:push`
- Verifique se banco está acessível

### Admin não consegue fazer login
- Verifique se admin foi criado: `pnpm deploy:create-admin`
- Verifique logs do servidor

---

## Próximos Passos

1. ✅ Testar todas as funcionalidades
2. ✅ Configurar backup automático do banco
3. ✅ Adicionar domínio customizado
4. ✅ Configurar SSL (automático no Railway)
5. ✅ Monitorar logs e performance

---

## Suporte

- Railway Docs: https://docs.railway.app
- Discord Railway: https://discord.gg/railway
- Issues GitHub: Abra uma issue no seu repositório


