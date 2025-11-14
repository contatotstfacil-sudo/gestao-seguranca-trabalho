# 🏢 Sistema Multi-Tenancy - Isolamento Completo de Dados

## 🎯 Objetivo

Garantir que cada cliente que compra o sistema tenha:
- ✅ **Ambiente isolado** - Dados completamente separados
- ✅ **Acesso exclusivo** - Apenas o cliente e usuários autorizados por ele
- ✅ **Sistema limpo** - Começa sem nenhum dado pré-preenchido
- ✅ **Privacidade total** - O dono do sistema não tem acesso aos dados dos clientes

---

## 🏗️ Arquitetura Proposta

### 1. Conceito de Tenant (Workspace)

Cada cliente que compra o sistema recebe um **Tenant** único:
- Cada tenant tem um ID único
- Todos os dados são vinculados ao tenant
- Usuários pertencem a um tenant específico
- Isolamento completo entre tenants

### 2. Estrutura de Dados

```
Tenant (Workspace)
├── Usuários (pertencentes ao tenant)
├── Empresas (gerenciadas pelo tenant)
├── Colaboradores
├── Obras
├── Treinamentos
├── EPIs
└── Todos os outros dados...
```

### 3. Fluxo de Criação

1. **Cliente compra o sistema** → Criação automática de Tenant
2. **Primeiro acesso** → Criação do usuário admin do tenant
3. **Sistema limpo** → Nenhum dado pré-preenchido
4. **Cliente começa a usar** → Cadastra seus próprios dados

---

## 📊 Mudanças no Schema

### Nova Tabela: `tenants`

```sql
CREATE TABLE tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  plano VARCHAR(50) NOT NULL, -- 'basico', 'profissional'
  status ENUM('ativo', 'suspenso', 'cancelado') DEFAULT 'ativo',
  dataInicio DATE NOT NULL,
  dataFim DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Adicionar `tenantId` em todas as tabelas

Todas as tabelas de dados precisam ter `tenantId`:

- `users` → `tenantId` (obrigatório)
- `empresas` → `tenantId` (obrigatório)
- `colaboradores` → `tenantId` (obrigatório)
- `obras` → `tenantId` (obrigatório)
- `treinamentos` → `tenantId` (obrigatório)
- `epis` → `tenantId` (obrigatório)
- E todas as outras...

---

## 🔒 Sistema de Isolamento

### 1. Middleware de Tenant

Todas as queries devem ser filtradas automaticamente por `tenantId`:

```typescript
// Exemplo: Buscar empresas
async function getEmpresas(user: User) {
  // O tenantId vem do usuário logado
  return db.select()
    .from(empresas)
    .where(eq(empresas.tenantId, user.tenantId)); // Filtro automático
}
```

### 2. Validação em Todas as Operações

- ✅ **CREATE**: Sempre adiciona `tenantId` do usuário logado
- ✅ **READ**: Sempre filtra por `tenantId` do usuário logado
- ✅ **UPDATE**: Valida que o `tenantId` corresponde
- ✅ **DELETE**: Valida que o `tenantId` corresponde

### 3. Proteção no Backend

```typescript
// Middleware que garante isolamento
function requireTenant(user: User) {
  if (!user.tenantId) {
    throw new Error("Usuário não possui tenant associado");
  }
  return user.tenantId;
}

// Uso em todas as operações
async function createEmpresa(data: InsertEmpresa, user: User) {
  const tenantId = requireTenant(user);
  return db.insert(empresas).values({
    ...data,
    tenantId, // Sempre adiciona o tenantId
  });
}
```

---

## 👤 Sistema de Usuários

### Hierarquia de Usuários

1. **Super Admin** (Dono do Sistema)
   - Acesso apenas a tabela `tenants`
   - Não tem acesso aos dados dos clientes
   - Pode criar/suspender/cancelar tenants

2. **Tenant Admin** (Dono do Tenant)
   - Acesso completo aos dados do seu tenant
   - Pode criar/gerenciar usuários do tenant
   - Não tem acesso a outros tenants

3. **Usuários do Tenant**
   - Acesso aos dados do tenant conforme permissões
   - Criados e gerenciados pelo Tenant Admin

### Roles

- `super_admin` - Apenas dono do sistema
- `tenant_admin` - Admin do tenant específico
- `gestor` - Gestor com permissões específicas
- `tecnico` - Técnico com permissões limitadas
- `user` - Usuário básico

---

## 🚀 Fluxo de Criação de Tenant

### Quando um Cliente Compra:

1. **Criação do Tenant**
   ```typescript
   const tenant = await createTenant({
     nome: "Nome do Cliente",
     plano: "profissional",
     status: "ativo",
     dataInicio: new Date(),
   });
   ```

2. **Criação do Usuário Admin**
   ```typescript
   const adminUser = await createUser({
     tenantId: tenant.id,
     email: "admin@cliente.com",
     role: "tenant_admin",
     // ... outros dados
   });
   ```

3. **Envio de Credenciais**
   - Email com link de primeiro acesso
   - Senha temporária
   - Instruções de uso

4. **Primeiro Login**
   - Cliente faz login
   - Sistema força troca de senha
   - Cliente começa a usar o sistema limpo

---

## 🔐 Segurança e Privacidade

### Garantias

1. **Isolamento de Dados**
   - Queries sempre filtradas por `tenantId`
   - Impossível acessar dados de outro tenant

2. **Proteção do Dono do Sistema**
   - Super Admin não tem `tenantId`
   - Não consegue fazer queries sem tenant
   - Acesso apenas a metadados (tenants, planos, etc)

3. **Validação em Múltiplas Camadas**
   - Middleware de autenticação
   - Validação em cada query
   - Validação no frontend (UX)

---

## 📝 Migração de Dados Existentes

### Se já houver dados:

1. Criar tenant padrão para dados existentes
2. Atribuir `tenantId` a todos os registros existentes
3. Migrar usuários existentes para o tenant padrão

---

## ✅ Checklist de Implementação

- [ ] Criar tabela `tenants`
- [ ] Adicionar `tenantId` em todas as tabelas
- [ ] Criar migração de schema
- [ ] Atualizar funções de criação de dados
- [ ] Atualizar funções de leitura (adicionar filtro)
- [ ] Atualizar funções de atualização (validação)
- [ ] Atualizar funções de exclusão (validação)
- [ ] Criar middleware de tenant
- [ ] Criar sistema de criação de tenant
- [ ] Atualizar autenticação
- [ ] Atualizar frontend para mostrar apenas dados do tenant
- [ ] Criar painel de super admin (apenas gerenciamento de tenants)
- [ ] Testes de isolamento

---

## 🎯 Benefícios

1. **Privacidade Total**
   - Cada cliente tem seus dados isolados
   - Impossível vazar dados entre clientes

2. **Escalabilidade**
   - Fácil adicionar novos clientes
   - Cada tenant é independente

3. **Segurança**
   - Múltiplas camadas de proteção
   - Validação em todas as operações

4. **Conformidade**
   - LGPD/GDPR compliant
   - Dados isolados por cliente

5. **Profissionalismo**
   - Cada cliente sente que tem seu próprio sistema
   - Experiência personalizada

---

## 📚 Próximos Passos

1. Implementar schema de tenants
2. Criar migração de banco de dados
3. Atualizar todas as funções de acesso a dados
4. Criar sistema de criação de tenant
5. Implementar middleware de isolamento
6. Criar painel de super admin
7. Testes completos de isolamento





