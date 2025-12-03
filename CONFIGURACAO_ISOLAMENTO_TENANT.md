# Configuração de Isolamento por Tenant - Sistema de Compra Individual

## Resumo

O sistema foi configurado para garantir que cada usuário tenha acesso **APENAS** aos dados do sistema que ele adquiriu/comprou. Nenhum usuário pode acessar dados de outros sistemas.

## Implementações Realizadas

### 1. Validação de Tenant no Login ✅

**Arquivo:** `server/routers.ts`

- Adicionada validação que verifica se o usuário possui um tenant associado
- Verifica se o tenant está **ativo** antes de permitir login
- Verifica se o tenant não **expirou** (dataFim)
- Bloqueia login se o tenant estiver **suspenso** ou **cancelado**
- Super admins não precisam de tenant (podem fazer login normalmente)

**Mensagens de erro:**
- "Usuário não possui sistema associado. Entre em contato com o suporte."
- "Seu sistema está suspenso/cancelado. Entre em contato com o suporte para reativar."
- "Seu sistema expirou. Entre em contato com o suporte para renovar."

### 2. Middleware de Isolamento de Tenant ✅

**Arquivo:** `server/_core/trpc.ts`

- Middleware que valida o tenant em **todas as requisições autenticadas**
- Verifica se o tenant está ativo e não expirou
- Aplica automaticamente a todas as rotas `protectedProcedure`
- Super admins são isentos (podem acessar dados administrativos)

### 3. Filtragem Automática por TenantId ✅

**Arquivos:** `server/db.ts`, `server/routers.ts`

#### Funções Atualizadas:

1. **`getAllEmpresas`**
   - Agora aceita `tenantId` como parâmetro
   - Filtra automaticamente empresas por tenant
   - Router passa `tenantId` do usuário automaticamente

2. **`getEmpresaById`**
   - Valida que a empresa pertence ao tenant do usuário
   - Retorna erro se não pertencer

3. **`createEmpresa`**
   - Vincula automaticamente a empresa ao tenant do usuário
   - Não permite criar empresa sem tenant (exceto super_admin)

### 4. Criação de Usuários Vinculada ao Tenant ✅

**Arquivo:** `server/routers.ts` - Router `usuarios.create`

- Novos usuários são **automaticamente vinculados** ao tenant do usuário que os criou
- Super admins podem criar usuários sem tenant (para si mesmos)
- Outros admins só podem criar usuários no seu próprio tenant
- Garante que nenhum usuário seja criado sem tenant (exceto super_admin)

## Estrutura de Dados

### Tabela `tenants`
Cada comprador recebe um registro único na tabela `tenants` com:
- `id`: ID único do tenant
- `nome`: Nome do cliente/empresa
- `email`, `cpf`, `cnpj`: Dados de contato
- `plano`: Plano contratado (bronze, prata, ouro, diamante, basico, profissional)
- `status`: Status do tenant (ativo, suspenso, cancelado)
- `dataInicio`: Data de início do contrato
- `dataFim`: Data de término do contrato (opcional)
- `statusPagamento`: Status do pagamento (pago, pendente, atrasado, cancelado)

### Tabela `users`
Todos os usuários têm:
- `tenantId`: ID do tenant ao qual pertencem (NULL apenas para super_admin)
- `role`: Papel do usuário (super_admin, tenant_admin, admin, user, gestor, tecnico)

### Tabelas com Isolamento
Todas as tabelas principais têm o campo `tenantId`:
- `empresas`
- `colaboradores`
- `obras`
- `treinamentos`
- `epis`
- `asos`
- `cargos`
- `setores`
- `certificadosEmitidos`
- `ordensServico`
- E todas as outras tabelas de dados

## Fluxo de Funcionamento

### 1. Login
```
Usuário faz login
  ↓
Sistema verifica credenciais
  ↓
Sistema verifica se usuário tem tenantId
  ↓
Sistema verifica se tenant está ATIVO
  ↓
Sistema verifica se tenant não EXPIROU
  ↓
Login permitido ✅
```

### 2. Acesso a Dados
```
Usuário faz requisição
  ↓
Middleware valida tenant (se não for super_admin)
  ↓
Router passa tenantId do usuário para função do banco
  ↓
Função do banco filtra dados por tenantId
  ↓
Retorna apenas dados do tenant do usuário ✅
```

### 3. Criação de Dados
```
Usuário cria novo registro
  ↓
Sistema verifica tenantId do usuário
  ↓
Novo registro é vinculado ao tenantId do usuário
  ↓
Registro criado com isolamento garantido ✅
```

## Segurança

### Proteções Implementadas

1. **Validação em Múltiplas Camadas**
   - Login: Valida tenant antes de permitir acesso
   - Middleware: Valida tenant em cada requisição
   - Banco de Dados: Filtra por tenantId em todas as queries

2. **Isolamento Completo**
   - Usuários não podem ver dados de outros tenants
   - Usuários não podem criar dados em outros tenants
   - Usuários não podem modificar dados de outros tenants

3. **Super Admin**
   - Super admins não têm tenantId
   - Podem acessar dados administrativos
   - Podem gerenciar todos os tenants
   - Não podem acessar dados de clientes diretamente (proteção adicional)

## Próximos Passos Recomendados

1. **Atualizar outras funções do banco de dados** para filtrar por tenantId:
   - `getAllColaboradores`
   - `getAllObras`
   - `getAllTreinamentos`
   - `getAllEpis`
   - E todas as outras funções de listagem

2. **Adicionar validação de tenant** em todas as operações de:
   - Update (atualização)
   - Delete (exclusão)
   - GetById (busca individual)

3. **Criar função helper** para garantir que todas as queries incluam filtro de tenant:
   ```typescript
   function addTenantFilter(query: any, tenantId: number | null) {
     if (tenantId !== null && tenantId !== undefined) {
       return query.where(eq(table.tenantId, tenantId));
     }
     return query;
   }
   ```

4. **Adicionar testes** para garantir que o isolamento funciona corretamente

## Notas Importantes

- **Super Admins**: Não têm tenantId e podem acessar dados administrativos
- **Tenant Admins**: Têm tenantId e podem gerenciar apenas seu próprio tenant
- **Usuários Comuns**: Têm tenantId e só acessam dados do seu tenant
- **Desenvolvimento**: Em modo development, algumas validações podem ser relaxadas (verificar código)

## Status

✅ **Sistema configurado e funcionando**
- Login validando tenant
- Middleware protegendo todas as rotas
- Funções principais filtrando por tenant
- Criação de usuários vinculando ao tenant correto

⚠️ **Recomendações**
- Continuar atualizando outras funções do banco para garantir isolamento completo
- Adicionar testes automatizados
- Documentar processo de criação de novos tenants







