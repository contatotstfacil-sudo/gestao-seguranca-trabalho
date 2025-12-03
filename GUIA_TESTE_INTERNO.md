# 🧪 Guia de Teste Interno Online - Antes de Comercializar

## 📋 Visão Geral

Este guia te ajuda a criar um **ambiente de teste online** (staging) para validar tudo antes de colocar no ar para clientes reais.

---

## 🎯 Estratégia: 2 Ambientes

### 1. **Ambiente de TESTE** (Staging)
- URL: `https://tst-facil-test.railway.app` (ou similar)
- Banco de dados separado
- Dados de teste
- Para você e sua equipe testarem

### 2. **Ambiente de PRODUÇÃO** (Comercial)
- URL: `https://tst-facil.com` (seu domínio)
- Banco de dados real
- Dados de clientes reais
- Para clientes pagantes

---

## 🚀 Passo 1: Criar Ambiente de Teste no Railway

### 1.1. Criar Novo Projeto de Teste

1. Acesse: https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha seu repositório
5. Nomeie como: **"tst-facil-test"** ou **"tst-facil-staging"**

### 1.2. Adicionar Banco MySQL de Teste

1. No projeto, clique em **"+ New"**
2. Selecione **"Database" → "MySQL"**
3. Aguarde Railway criar o banco (1-2 minutos)

### 1.3. Configurar Variáveis de Ambiente de TESTE

No projeto Railway → **"Variables"**, adicione:

```env
NODE_ENV=production
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=chave-teste-secreta-123
COOKIE_SECRET=chave-teste-secreta-123
ENCRYPTION_KEY=chave-teste-secreta-123
ALLOWED_ORIGINS=https://tst-facil-test.railway.app
PORT=3000
```

**⚠️ IMPORTANTE:** Use chaves DIFERENTES das de produção!

### 1.4. Executar Migrações no Ambiente de Teste

1. Railway → **"Deployments"** → **"..."** → **"Open Shell"**
2. Execute:

```bash
pnpm db:push
```

### 1.5. Criar Usuários de Teste

No mesmo shell:

```bash
pnpm deploy:create-admin
```

Isso criará um admin para você testar.

### 1.6. Criar Dados de Teste

Execute o script para criar clientes de exemplo:

```bash
npx tsx scripts/aplicar-migracao-e-criar-clientes.ts
```

---

## ✅ Passo 2: Checklist de Testes

### 🔐 Autenticação e Segurança

- [ ] **Login funciona corretamente**
  - [ ] Login com CPF
  - [ ] Login com email
  - [ ] Senha incorreta mostra erro
  - [ ] Sessão persiste após refresh
  - [ ] Logout funciona

- [ ] **Isolamento de dados (Multi-tenancy)**
  - [ ] Admin vê todos os dados
  - [ ] Tenant A não vê dados do Tenant B
  - [ ] Cada tenant vê apenas suas empresas
  - [ ] Anotações isoladas por tenant

### 👥 Gestão de Usuários

- [ ] **Criação de usuários**
  - [ ] Criar novo tenant
  - [ ] Criar usuário para tenant
  - [ ] Validação de CPF/CNPJ
  - [ ] Validação de senha (mínimo 6 caracteres)

- [ ] **Permissões**
  - [ ] Admin tem acesso total
  - [ ] Tenant admin gerencia seu tenant
  - [ ] Usuário comum vê apenas seus dados

### 🏢 Cadastros Básicos

- [ ] **Empresas**
  - [ ] Criar empresa
  - [ ] Editar empresa
  - [ ] Deletar empresa
  - [ ] Buscar empresa
  - [ ] Filtros funcionam

- [ ] **Colaboradores**
  - [ ] Criar colaborador
  - [ ] Editar colaborador
  - [ ] Deletar colaborador
  - [ ] Upload de foto
  - [ ] Validação de CPF

- [ ] **Cargos e Setores**
  - [ ] Criar cargo
  - [ ] Criar setor
  - [ ] Vincular colaborador a cargo/setor

### 📋 Funcionalidades Principais

- [ ] **Gestão de ASOs**
  - [ ] Dashboard carrega corretamente
  - [ ] Lista de ASOs funciona
  - [ ] Filtros por mês funcionam
  - [ ] Filtros por empresa funcionam
  - [ ] Atualização de status funciona
  - [ ] Gráficos exibem dados corretos

- [ ] **Ordens de Serviço**
  - [ ] Criar ordem de serviço
  - [ ] Editar ordem
  - [ ] Emitir PDF
  - [ ] Modelos funcionam

- [ ] **EPIs**
  - [ ] Cadastrar EPI
  - [ ] Listar EPIs
  - [ ] Controle de vencimentos

- [ ] **Treinamentos**
  - [ ] Cadastrar treinamento
  - [ ] Listar treinamentos
  - [ ] Controle de vencimentos

### 💼 Módulo Administrativo

- [ ] **Gestão de Clientes**
  - [ ] Listar todos os clientes
  - [ ] Editar plano do cliente
  - [ ] Alterar status (ativo/suspenso/cancelado)
  - [ ] Dashboard de clientes funciona
  - [ ] Gráficos exibem dados corretos
  - [ ] Filtros funcionam

- [ ] **Planos**
  - [ ] Apenas 4 planos aparecem (Bronze, Prata, Ouro, Diamante)
  - [ ] Valores corretos (67,90 / 97,90 / 137,90 / 199,90)
  - [ ] Limites de planos funcionam

### 📊 Dashboards

- [ ] **Dashboard Principal**
  - [ ] Carrega sem erros
  - [ ] Estatísticas corretas
  - [ ] Filtros por empresa funcionam

- [ ] **Dashboard ASOs**
  - [ ] Gráficos exibem dados
  - [ ] Cliques nos gráficos filtram lista
  - [ ] Lista atualiza corretamente

- [ ] **Dashboard Admin**
  - [ ] Total de clientes correto
  - [ ] Receita mensal calculada
  - [ ] Gráficos funcionam

### 🎨 Interface e UX

- [ ] **Navegação**
  - [ ] Menu lateral funciona
  - [ ] Links corretos
  - [ ] Breadcrumbs (se houver)

- [ ] **Responsividade**
  - [ ] Funciona em desktop
  - [ ] Funciona em tablet
  - [ ] Funciona em mobile

- [ ] **Performance**
  - [ ] Páginas carregam rápido (< 3 segundos)
  - [ ] Sem travamentos
  - [ ] Sem erros no console

### 🔄 Integrações

- [ ] **Landing Page de Vendas**
  - [ ] Página carrega
  - [ ] Planos exibidos corretamente
  - [ ] Links de CTA funcionam
  - [ ] Formulário de contato (se houver)

---

## 🧪 Passo 3: Script de Teste Automatizado

Crie um script para validar funcionalidades críticas:

```bash
# Executar testes
npx tsx scripts/teste-sistema-completo.ts
```

---

## 📝 Passo 4: Documentar Problemas Encontrados

Crie um arquivo `PROBLEMAS_TESTE.md` para anotar:

```markdown
# Problemas Encontrados nos Testes

## Data: [DATA]

### 🔴 Críticos (Bloqueiam lançamento)
- [ ] Problema 1
- [ ] Problema 2

### 🟡 Importantes (Devem ser corrigidos)
- [ ] Problema 3
- [ ] Problema 4

### 🟢 Menores (Podem ser corrigidos depois)
- [ ] Problema 5
- [ ] Problema 6
```

---

## 🎯 Passo 5: Teste com Usuários Reais (Beta)

### 5.1. Criar Contas de Teste

Crie 3-5 contas de teste com diferentes planos:

```bash
# Via script ou interface admin
- Cliente Bronze (teste-bronze@teste.com)
- Cliente Prata (teste-prata@teste.com)
- Cliente Ouro (teste-ouro@teste.com)
- Cliente Diamante (teste-diamante@teste.com)
```

### 5.2. Convidar Testadores

Envie convites para:
- Você mesmo (admin)
- 2-3 pessoas de confiança
- Teste diferentes navegadores (Chrome, Firefox, Edge)

### 5.3. Coletar Feedback

Crie um formulário simples (Google Forms) para coletar:
- O que funcionou bem
- O que não funcionou
- Sugestões de melhoria
- Bugs encontrados

---

## 🚀 Passo 6: Preparar Ambiente de Produção

### 6.1. Criar Projeto de Produção

1. Railway → **"New Project"**
2. Nomeie: **"tst-facil-prod"** ou **"tst-facil"**
3. Configure igual ao de teste, mas:
   - Use chaves de segurança DIFERENTES
   - Use banco de dados SEPARADO
   - Configure domínio customizado

### 6.2. Configurar Domínio

1. Railway → **"Settings" → "Domains"**
2. Adicione seu domínio (ex: `tst-facil.com`)
3. Configure DNS conforme instruções
4. Atualize `ALLOWED_ORIGINS` com o novo domínio

### 6.3. Migrar Dados (Se necessário)

Se tiver dados de teste importantes:
- Exporte do ambiente de teste
- Importe no ambiente de produção
- **⚠️ CUIDADO:** Não misture dados de teste com produção!

---

## ✅ Passo 7: Checklist Final Antes de Lançar

### Segurança
- [ ] Todas as senhas são fortes
- [ ] Chaves de segurança são únicas
- [ ] SSL/HTTPS funcionando
- [ ] Isolamento de dados funcionando

### Performance
- [ ] Páginas carregam rápido
- [ ] Banco de dados otimizado
- [ ] Sem erros no console

### Funcionalidades
- [ ] Todas as funcionalidades testadas
- [ ] Nenhum bug crítico pendente
- [ ] Documentação atualizada

### Backup
- [ ] Backup automático configurado
- [ ] Plano de recuperação definido

---

## 🔧 Scripts Úteis

### Verificar Status do Sistema

```bash
# Verificar conexão com banco
pnpm check:db

# Verificar se está pronto para deploy
pnpm check:deploy
```

### Limpar Dados de Teste

```bash
# Criar script para limpar dados de teste
npx tsx scripts/limpar-dados-teste.ts
```

---

## 📞 Suporte Durante Testes

### Logs

Monitore os logs no Railway:
- Railway → **"Deployments" → "View Logs"**

### Erros

Se encontrar erros:
1. Anote o que estava fazendo
2. Capture screenshot
3. Verifique logs
4. Documente no `PROBLEMAS_TESTE.md`

---

## 🎉 Quando Estiver Pronto

Após completar todos os testes:

1. ✅ Todos os itens do checklist marcados
2. ✅ Nenhum bug crítico pendente
3. ✅ Feedback dos testadores positivo
4. ✅ Performance adequada
5. ✅ Backup configurado

**Então você pode lançar para produção!** 🚀

---

## 📚 Recursos Adicionais

- [Railway Docs](https://docs.railway.app)
- [Guia de Deploy](./DEPLOY.md)
- [Início Rápido](./INICIO_RAPIDO.md)

---

**Última atualização:** Dezembro 2025



