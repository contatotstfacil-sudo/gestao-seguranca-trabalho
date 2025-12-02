# 🚀 Guia de Implementação - Multi-Tenancy

## ✅ O que já foi feito

1. ✅ Documentação completa (`MULTI_TENANCY.md`)
2. ✅ Schema atualizado com tabela `tenants`
3. ✅ `tenantId` adicionado em tabelas principais:
   - `users`
   - `empresas`
   - `colaboradores`
   - `obras`
   - `treinamentos`
   - `epis`

## 📋 O que ainda precisa ser feito

### 1. Adicionar `tenantId` nas demais tabelas

Tabelas que ainda precisam de `tenantId`:
- `fichasEpiEmitidas`
- `cargos`
- `setores`
- `tiposTreinamentos`
- `cargoTreinamentos`
- `cargoSetores`
- `riscosOcupacionais`
- `cargoRiscos`
- `modelosCertificados`
- `responsaveis`
- `certificadosEmitidos`
- `ordensServico`
- `modelosOrdemServico`
- `tiposEpis` (opcional - pode ser global)

### 2. Criar funções de gerenciamento de tenants

Arquivo: `server/db.ts`

```typescript
// === TENANTS ===

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tenants).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    return await getTenantById(insertId);
  }
  return null;
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllTenants() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tenants);
}
```

### 3. Criar middleware de isolamento

Arquivo: `server/utils/tenant-isolation.ts`

```typescript
import { User } from "../../drizzle/schema";

/**
 * Garante que o usuário tenha um tenantId
 * Super admins não têm tenantId e não podem acessar dados de clientes
 */
export function requireTenant(user: User): number {
  if (user.role === "super_admin") {
    throw new Error("Super admin não pode acessar dados de tenants");
  }
  
  if (!user.tenantId) {
    throw new Error("Usuário não possui tenant associado");
  }
  
  return user.tenantId;
}

/**
 * Valida que um registro pertence ao tenant do usuário
 */
export function validateTenantAccess(
  user: User,
  recordTenantId: number | null | undefined
): void {
  const userTenantId = requireTenant(user);
  
  if (recordTenantId !== userTenantId) {
    throw new Error("Acesso negado: registro não pertence ao seu tenant");
  }
}
```

### 4. Atualizar todas as funções de acesso a dados

**Padrão para READ:**
```typescript
export async function getEmpresas(user: User) {
  const db = await getDb();
  const tenantId = requireTenant(user);
  
  return await db.select()
    .from(empresas)
    .where(eq(empresas.tenantId, tenantId));
}
```

**Padrão para CREATE:**
```typescript
export async function createEmpresa(data: InsertEmpresa, user: User) {
  const db = await getDb();
  const tenantId = requireTenant(user);
  
  return await db.insert(empresas).values({
    ...data,
    tenantId, // Sempre adiciona o tenantId
  });
}
```

**Padrão para UPDATE:**
```typescript
export async function updateEmpresa(id: number, data: Partial<InsertEmpresa>, user: User) {
  const db = await getDb();
  const tenantId = requireTenant(user);
  
  // Primeiro valida que o registro pertence ao tenant
  const empresa = await db.select()
    .from(empresas)
    .where(and(eq(empresas.id, id), eq(empresas.tenantId, tenantId)))
    .limit(1);
  
  if (!empresa[0]) {
    throw new Error("Empresa não encontrada ou acesso negado");
  }
  
  // Atualiza
  await db.update(empresas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(empresas.id, id));
  
  return await getEmpresaById(id);
}
```

**Padrão para DELETE:**
```typescript
export async function deleteEmpresa(id: number, user: User) {
  const db = await getDb();
  const tenantId = requireTenant(user);
  
  // Valida acesso
  const empresa = await db.select()
    .from(empresas)
    .where(and(eq(empresas.id, id), eq(empresas.tenantId, tenantId)))
    .limit(1);
  
  if (!empresa[0]) {
    throw new Error("Empresa não encontrada ou acesso negado");
  }
  
  await db.delete(empresas).where(eq(empresas.id, id));
  return true;
}
```

### 5. Criar sistema de criação de tenant

Arquivo: `server/routers/tenant.ts`

```typescript
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { createTenant, getTenantById } from "../db";
import { createUser } from "../db";
import bcrypt from "bcryptjs";

export const tenantRouter = router({
  create: publicProcedure
    .input(z.object({
      nome: z.string(),
      plano: z.enum(["basico", "profissional"]),
      adminEmail: z.string().email(),
      adminPassword: z.string().min(8),
      adminName: z.string(),
    }))
    .mutation(async ({ input }) => {
      // 1. Criar tenant
      const tenant = await createTenant({
        nome: input.nome,
        plano: input.plano,
        status: "ativo",
        dataInicio: new Date(),
      });
      
      if (!tenant) {
        throw new Error("Erro ao criar tenant");
      }
      
      // 2. Criar usuário admin do tenant
      const passwordHash = await bcrypt.hash(input.adminPassword, 10);
      const adminUser = await createUser({
        tenantId: tenant.id,
        email: input.adminEmail,
        name: input.adminName,
        passwordHash,
        role: "tenant_admin",
      });
      
      return {
        tenant,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
        },
      };
    }),
});
```

### 6. Criar migração de banco de dados

Arquivo: `drizzle/migrations/0001_add_tenants.sql`

```sql
-- Criar tabela tenants
CREATE TABLE IF NOT EXISTS tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  plano ENUM('basico', 'profissional') NOT NULL,
  status ENUM('ativo', 'suspenso', 'cancelado') DEFAULT 'ativo',
  dataInicio DATE NOT NULL,
  dataFim DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adicionar tenantId em users
ALTER TABLE users ADD COLUMN tenantId INT NULL;
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'tenant_admin', 'user', 'admin', 'gestor', 'tecnico') DEFAULT 'user';

-- Adicionar tenantId em empresas
ALTER TABLE empresas ADD COLUMN tenantId INT NOT NULL DEFAULT 1;
ALTER TABLE empresas DROP INDEX cnpj; -- Remove unique global
ALTER TABLE empresas ADD UNIQUE KEY unique_cnpj_tenant (cnpj, tenantId); -- Unique por tenant

-- Adicionar tenantId em colaboradores
ALTER TABLE colaboradores ADD COLUMN tenantId INT NOT NULL DEFAULT 1;

-- Adicionar tenantId em obras
ALTER TABLE obras ADD COLUMN tenantId INT NOT NULL DEFAULT 1;

-- Adicionar tenantId em treinamentos
ALTER TABLE treinamentos ADD COLUMN tenantId INT NOT NULL DEFAULT 1;

-- Adicionar tenantId em epis
ALTER TABLE epis ADD COLUMN tenantId INT NOT NULL DEFAULT 1;

-- ... (adicionar nas demais tabelas)

-- Criar índices para performance
CREATE INDEX idx_users_tenant ON users(tenantId);
CREATE INDEX idx_empresas_tenant ON empresas(tenantId);
CREATE INDEX idx_colaboradores_tenant ON colaboradores(tenantId);
-- ... (criar índices para todas as tabelas)
```

### 7. Atualizar autenticação

Arquivo: `server/_core/sdk.ts`

Garantir que o `tenantId` seja sempre incluído no objeto `User` retornado.

### 8. Criar painel de super admin

Arquivo: `client/src/pages/SuperAdmin.tsx`

Painel para o dono do sistema gerenciar tenants:
- Listar todos os tenants
- Criar novos tenants
- Suspender/cancelar tenants
- Ver estatísticas (sem ver dados dos clientes)

## 🎯 Ordem de Implementação Recomendada

1. ✅ Schema atualizado (parcial)
2. ⏳ Completar schema (adicionar tenantId em todas as tabelas)
3. ⏳ Criar migração de banco de dados
4. ⏳ Criar funções de gerenciamento de tenants
5. ⏳ Criar middleware de isolamento
6. ⏳ Atualizar funções de acesso a dados (uma por uma)
7. ⏳ Criar sistema de criação de tenant
8. ⏳ Atualizar autenticação
9. ⏳ Criar painel de super admin
10. ⏳ Testes de isolamento

## ⚠️ Importante

- **Migração de dados existentes**: Se já houver dados, criar um tenant padrão e atribuir todos os registros a ele
- **Testes**: Testar isolamento completo antes de colocar em produção
- **Performance**: Criar índices em `tenantId` para todas as tabelas
- **Segurança**: Validar tenant em múltiplas camadas (middleware, queries, frontend)

## 📚 Próximos Passos

1. Completar o schema
2. Criar migração
3. Implementar funções básicas
4. Testar isolamento
5. Implementar criação de tenant
6. Criar painel de admin


















