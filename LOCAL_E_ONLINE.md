# 💻 Sistema Local + Online - Guia Completo

## ✅ Configuração Dual (Local + Online)

O sistema está configurado para funcionar **simultaneamente** em ambos os ambientes sem conflitos!

---

## 🏠 Ambiente Local

### Configuração Local

O sistema local usa o arquivo `.env` na raiz do projeto:

```env
# .env (local)
DATABASE_URL=mysql://root:senha@localhost:3306/sst
NODE_ENV=development
PORT=3000
JWT_SECRET=chave-local-desenvolvimento
COOKIE_SECRET=chave-local-desenvolvimento
ENCRYPTION_KEY=chave-local-desenvolvimento
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Iniciar Sistema Local

```bash
# Opção 1: Script npm
pnpm dev

# Opção 2: Script Windows PowerShell
pnpm dev:win

# Opção 3: Script PowerShell direto
.\start-dev.ps1
```

### Acessar Localmente

- **URL**: http://localhost:3000
- **Banco**: MySQL local na porta 3306
- **Modo**: Desenvolvimento (hot-reload ativo)

---

## 🌐 Ambiente Online (Railway/Vercel)

### Configuração Online

O ambiente online usa variáveis de ambiente configuradas na plataforma:

```env
# Variáveis no Railway/Vercel
DATABASE_URL=mysql://user:pass@host:port/db  # Gerado automaticamente
NODE_ENV=production
PORT=3000  # Railway define automaticamente
JWT_SECRET=chave-producao-super-segura
COOKIE_SECRET=chave-producao-super-segura
ENCRYPTION_KEY=chave-producao-super-segura
ALLOWED_ORIGINS=https://seu-projeto.railway.app
```

### Acessar Online

- **URL**: https://seu-projeto.railway.app (ou domínio customizado)
- **Banco**: MySQL gerenciado pelo Railway
- **Modo**: Produção (otimizado)

---

## 🔄 Como Funciona a Separação

### 1. Variáveis de Ambiente

O sistema detecta automaticamente o ambiente:

- **Local**: Lê `.env` do projeto
- **Online**: Lê variáveis da plataforma (Railway/Vercel)

### 2. Banco de Dados

- **Local**: Banco MySQL na sua máquina (`localhost:3306`)
- **Online**: Banco MySQL gerenciado pela plataforma

### 3. Portas

- **Local**: Porta 3000 (ou próxima disponível)
- **Online**: Porta definida pela plataforma (geralmente via `PORT`)

### 4. Modo de Execução

- **Local**: `NODE_ENV=development` → Hot-reload, logs detalhados
- **Online**: `NODE_ENV=production` → Otimizado, arquivos estáticos

---

## 📋 Checklist - Manter Ambos Funcionando

### ✅ Local
- [ ] MySQL rodando localmente
- [ ] Arquivo `.env` configurado
- [ ] Migrações executadas: `pnpm db:push`
- [ ] Usuário admin criado localmente
- [ ] Sistema acessível em `http://localhost:3000`

### ✅ Online
- [ ] Código commitado no GitHub
- [ ] Projeto criado no Railway/Vercel
- [ ] Banco MySQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas online
- [ ] Usuário admin criado online
- [ ] Sistema acessível via URL pública

---

## 🛠️ Comandos Úteis

### Verificar Status Local
```bash
# Verificar conexão com banco local
pnpm check:db

# Verificar configuração
pnpm check:deploy
```

### Sincronizar Dados (Opcional)

Se quiser copiar dados do local para online:

```bash
# 1. Fazer backup do banco local
mysqldump -u root -p sst > backup-local.sql

# 2. No Railway, importar backup (via shell)
mysql -h host -u user -p database < backup-local.sql
```

### Desenvolvimento Local

```bash
# Iniciar servidor local
pnpm dev

# Executar migrações locais
pnpm db:push

# Criar admin local
pnpm deploy:create-admin
```

### Deploy Online

```bash
# Commit e push
git add .
git commit -m "Atualizações"
git push

# Railway/Vercel faz deploy automático
# Depois execute migrações e crie admin no shell online
```

---

## 🔐 Segurança - Ambientes Separados

### ✅ Boas Práticas

1. **Chaves Diferentes**: Use chaves diferentes para local e produção
2. **`.env` no `.gitignore`**: Nunca commite o `.env` local
3. **Variáveis Online**: Configure apenas na plataforma
4. **Backup**: Faça backup regular do banco online

### ⚠️ Atenção

- **Nunca** use chaves de produção no ambiente local
- **Nunca** commite arquivos `.env`
- **Sempre** use HTTPS em produção
- **Sempre** configure `ALLOWED_ORIGINS` corretamente

---

## 🐛 Troubleshooting

### Sistema Local Não Inicia

```bash
# Verificar se MySQL está rodando
mysql -u root -p -e "SELECT 1"

# Verificar porta disponível
netstat -ano | findstr :3000

# Limpar e reinstalar dependências
rm -rf node_modules
pnpm install
```

### Sistema Online Não Funciona

1. Verifique logs no Railway/Vercel
2. Verifique variáveis de ambiente
3. Teste conexão com banco: `pnpm check:db` (no shell online)
4. Verifique se migrações foram executadas

### Conflito de Portas

O sistema detecta automaticamente portas disponíveis. Se a 3000 estiver ocupada, usa 3001, 3002, etc.

---

## 📊 Monitoramento

### Local
- Logs no terminal onde roda `pnpm dev`
- Banco MySQL: `mysql -u root -p sst`

### Online
- Logs: Railway → Deployments → View Logs
- Métricas: Railway → Metrics
- Banco: Railway → Database → Connect

---

## 🎯 Fluxo de Trabalho Recomendado

1. **Desenvolver Localmente**
   - Faça alterações no código
   - Teste em `http://localhost:3000`
   - Use banco local para testes

2. **Commit e Push**
   - Quando estiver pronto: `git add . && git commit -m "..." && git push`
   - Railway/Vercel faz deploy automático

3. **Atualizar Online**
   - Execute migrações se necessário: `pnpm db:push` (no shell online)
   - Teste em produção

4. **Manter Ambos Ativos**
   - Local para desenvolvimento
   - Online para uso real/produção

---

## 💡 Dicas

- ✅ Mantenha ambos os ambientes atualizados
- ✅ Use nomes de usuário diferentes para distinguir local/online
- ✅ Faça backup regular do banco online
- ✅ Teste mudanças localmente antes de fazer deploy
- ✅ Use variáveis de ambiente diferentes para cada ambiente

---

## 🆘 Suporte

Se tiver problemas:

1. **Local**: Verifique logs do terminal e MySQL
2. **Online**: Verifique logs do Railway/Vercel
3. **Ambos**: Execute `pnpm check:deploy` para diagnóstico

