# 🚀 Guia de Deploy - TST Fácil

## Opções de Hospedagem

### Opção 1: Vercel (Frontend) + PlanetScale/Railway (Banco) - RECOMENDADO
- ✅ Grátis para começar
- ✅ Fácil configuração
- ✅ SSL automático
- ✅ Deploy automático via Git

### Opção 2: Railway (Full Stack)
- ✅ Tudo em um lugar
- ✅ Banco MySQL incluído
- ✅ Deploy automático
- ✅ SSL automático

### Opção 3: DigitalOcean/AWS (Avançado)
- ✅ Mais controle
- ✅ Escalável
- ⚠️ Requer mais configuração

## Pré-requisitos

1. Conta no GitHub/GitLab
2. Código commitado no repositório
3. Node.js 18+ instalado localmente

---

## Método 1: Railway (Mais Fácil) ⭐

### Passo 1: Criar conta no Railway
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha seu repositório

### Passo 2: Adicionar Banco de Dados MySQL
1. No projeto Railway, clique em "+ New"
2. Selecione "Database" → "MySQL"
3. Railway criará automaticamente:
   - Banco de dados MySQL
   - Variáveis de ambiente com `DATABASE_URL`

### Passo 3: Configurar Variáveis de Ambiente
No projeto Railway, vá em "Variables" e adicione:

```env
NODE_ENV=production
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=sua-chave-jwt-muito-forte-aqui
COOKIE_SECRET=sua-chave-cookie-muito-forte-aqui
ENCRYPTION_KEY=sua-chave-criptografia-muito-forte-aqui
ALLOWED_ORIGINS=https://seu-dominio.railway.app
PORT=3000
```

**Gerar chaves seguras:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 4: Configurar Build
Railway detecta automaticamente, mas você pode criar `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Passo 5: Executar Migrações
1. No Railway, vá em "Deployments"
2. Clique nos "..." do deployment
3. Selecione "Open Shell"
4. Execute:
```bash
pnpm db:push
```

### Passo 6: Criar Usuário Administrador
No shell do Railway:
```bash
node -e "
import('dotenv/config').then(() => {
  import('./server/db.js').then(async (db) => {
    const bcrypt = (await import('bcryptjs')).default;
    const hash = await bcrypt.hash('G476589496i@', 10);
    await db.createUser({
      name: 'Administrador',
      cpf: '38099529820',
      passwordHash: hash,
      role: 'admin',
      openId: 'local-1'
    });
    console.log('Admin criado!');
    process.exit(0);
  });
});
"
```

### Passo 7: Configurar Domínio (Opcional)
1. No Railway, vá em "Settings" → "Domains"
2. Clique em "Generate Domain" ou adicione domínio customizado
3. Atualize `ALLOWED_ORIGINS` com o novo domínio

---

## Método 2: Vercel + PlanetScale

### Passo 1: Banco de Dados - PlanetScale
1. Acesse: https://planetscale.com
2. Crie conta gratuita
3. Crie novo banco de dados
4. Anote a `DATABASE_URL` (formato: `mysql://user:pass@host:port/db`)

### Passo 2: Deploy no Vercel
1. Acesse: https://vercel.com
2. Faça login com GitHub
3. "Add New Project"
4. Importe seu repositório
5. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### Passo 3: Variáveis de Ambiente no Vercel
No projeto Vercel, vá em "Settings" → "Environment Variables":

```env
NODE_ENV=production
DATABASE_URL=sua-url-do-planetscale
JWT_SECRET=sua-chave-jwt
COOKIE_SECRET=sua-chave-cookie
ENCRYPTION_KEY=sua-chave-criptografia
ALLOWED_ORIGINS=https://seu-projeto.vercel.app
```

### Passo 4: Executar Migrações
Use o script `deploy-migrations.ts` (criado abaixo)

---

## Scripts de Ajuda

### Script 1: Verificar Configuração
```bash
pnpm run check:deploy
```

### Script 2: Executar Migrações
```bash
pnpm run deploy:migrate
```

### Script 3: Criar Admin
```bash
pnpm run deploy:create-admin
```

---

## Checklist de Deploy

- [ ] Código commitado no Git
- [ ] Banco de dados criado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas
- [ ] Usuário admin criado
- [ ] Domínio configurado (opcional)
- [ ] SSL ativado
- [ ] Testes realizados

---

## Troubleshooting

### Erro: "Database not available"
- Verifique `DATABASE_URL` nas variáveis de ambiente
- Teste conexão: `pnpm run check:db`

### Erro: "Migration failed"
- Execute manualmente: `pnpm db:push`
- Verifique logs do banco

### Erro: "Cannot find module"
- Verifique se `pnpm install` foi executado
- Verifique se `node_modules` está no `.gitignore`

### Site não carrega
- Verifique logs do servidor
- Verifique variáveis de ambiente
- Verifique se porta está correta

---

## Segurança em Produção

✅ **Obrigatório:**
- HTTPS habilitado
- Variáveis de ambiente seguras
- Chaves de criptografia fortes
- `ALLOWED_ORIGINS` configurado
- `NODE_ENV=production`

✅ **Recomendado:**
- Backup automático do banco
- Monitoramento de logs
- Rate limiting configurado
- Firewall configurado

---

## Suporte

Em caso de problemas:
1. Verifique logs do servidor
2. Verifique logs do banco
3. Teste conexão localmente
4. Consulte documentação da plataforma


