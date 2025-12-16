# 🔧 Correção - Acesso Admin Bloqueado

## Problema
Após implementar o isolamento de tenant, o admin não conseguia mais fazer login porque a validação estava bloqueando usuários sem tenant.

## Solução Aplicada

### 1. Login (server/routers.ts)
**Antes:**
```typescript
if (user.role !== "super_admin") {
  // Validação de tenant
}
```

**Depois:**
```typescript
if (user.role !== "super_admin" && user.role !== "admin") {
  // Validação de tenant
}
```

### 2. Middleware (server/_core/trpc.ts)
**Antes:**
```typescript
if (ctx.user.role !== "super_admin") {
  // Validação de tenant
}
```

**Depois:**
```typescript
if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
  // Validação de tenant
}
```

## Resultado

Agora **ambos** `admin` e `super_admin` podem:
- ✅ Fazer login sem tenant
- ✅ Acessar o sistema normalmente
- ✅ Gerenciar dados administrativos

Usuários com outros roles (`tenant_admin`, `user`, `gestor`, `tecnico`) **precisam** de tenant ativo.

## Teste

1. Faça login com o admin:
   - CPF: `38099529820`
   - Senha: `G476589496i@`

2. Deve funcionar normalmente agora!

---

## Nota

O admin criado pelo script `deploy-create-admin.ts` tem role `"admin"`, não `"super_admin"`. Por isso era necessário permitir ambos os roles.








