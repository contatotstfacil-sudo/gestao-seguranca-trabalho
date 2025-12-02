# Instruções para Criar Acesso de Ana Paula

## Problema
O erro "Erro ao processar resposta do servidor" ocorre porque o usuário Ana Paula ainda não foi criado no banco de dados.

## Solução - Duas Opções

### Opção 1: Script TypeScript (Recomendado)

**Pré-requisito:** Configure a DATABASE_URL no arquivo `.env`:

```env
DATABASE_URL=mysql://usuario:senha@host:porta/banco
```

Exemplo:
```env
DATABASE_URL=mysql://root:senha@localhost:3306/sst
```

**Execute:**
```bash
cd tst-facil
npx tsx scripts/criar-ana-paula-bronze.ts
```

---

### Opção 2: Script SQL Direto (Mais Rápido)

Se você tem acesso direto ao banco MySQL, execute o script SQL:

1. Abra seu cliente MySQL (MySQL Workbench, phpMyAdmin, ou linha de comando)
2. Execute o arquivo: `scripts/criar-ana-paula-sql.sql`

Ou copie e cole este SQL:

```sql
-- 1. Criar o tenant (sistema) para Ana Paula
INSERT INTO tenants (
  nome, email, telefone, cpf, plano, status, dataInicio, dataFim, 
  valorPlano, dataUltimoPagamento, dataProximoPagamento, 
  periodicidade, statusPagamento, observacoes, createdAt, updatedAt
) VALUES (
  'Ana Paula',
  'ana.paula@consultoriasst.com.br',
  '(11) 91111-0000',
  '55566677788',
  'bronze',
  'ativo',
  CURDATE(),
  NULL,
  '67,90',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
  'mensal',
  'pago',
  'Acesso fictício criado automaticamente',
  NOW(),
  NOW()
);

-- 2. Obter o ID do tenant criado
SET @tenant_id = LAST_INSERT_ID();

-- 3. Hash da senha "111814gi"
SET @password_hash = '$2b$10$xblCbCDzC/HQ9A8EpNfiieUc6kwrWzMm/5sPOLVtnROjVBABodCp6';

-- 4. Criar o usuário vinculado ao tenant
INSERT INTO users (
  tenantId, name, email, cpf, passwordHash, role, openId, 
  empresaId, createdAt, updatedAt, lastSignedIn
) VALUES (
  @tenant_id,
  'Ana Paula',
  'ana.paula@consultoriasst.com.br',
  '55566677788',
  @password_hash,
  'tenant_admin',
  CONCAT('local-', UNIX_TIMESTAMP(NOW())),
  NULL,
  NOW(),
  NOW(),
  NOW()
);

-- 5. Verificar se foi criado
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.cpf,
  u.role,
  u.tenantId,
  t.id as tenant_id,
  t.nome as tenant_nome,
  t.plano,
  t.status as tenant_status
FROM users u
LEFT JOIN tenants t ON u.tenantId = t.id
WHERE u.email = 'ana.paula@consultoriasst.com.br' 
   OR u.cpf = '55566677788';
```

---

## Credenciais de Acesso

Após criar o usuário, Ana Paula poderá fazer login com:

- **Email/CPF:** `ana.paula@consultoriasst.com.br` ou `55566677788`
- **Senha:** `111814gi`

---

## Verificar se Foi Criado

Execute esta query no banco para verificar:

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.cpf,
  u.role,
  u.tenantId,
  t.nome as tenant_nome,
  t.plano,
  t.status
FROM users u
LEFT JOIN tenants t ON u.tenantId = t.id
WHERE u.email = 'ana.paula@consultoriasst.com.br';
```

---

## Solução de Problemas

### Erro: "Usuário não encontrado"
- Verifique se o usuário foi criado executando a query acima
- Verifique se o email/CPF está correto

### Erro: "Sistema não encontrado" ou "Usuário não possui sistema associado"
- Verifique se o tenant foi criado
- Verifique se o `tenantId` do usuário está correto

### Erro: "Erro ao processar resposta do servidor"
- Verifique os logs do servidor para mais detalhes
- Certifique-se de que o usuário e tenant foram criados corretamente
- Verifique se o servidor está rodando

---

## Logs do Servidor

Para ver logs detalhados do login, verifique o console do servidor. Você verá mensagens como:

```
[Login] Identificador recebido: "ana.paula@consultoriasst.com.br"
[Login] Usuário encontrado: ID=X, Email=..., TenantId=Y
[Login] Senha correta para usuário ID=X
[Login] Validando tenant ID=Y
[Login] ✅ Tenant validado com sucesso
[Login] ✅ Login bem-sucedido
```

Se houver erros, eles aparecerão nos logs com `[Login] ❌`.



