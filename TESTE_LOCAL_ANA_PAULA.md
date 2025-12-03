# 🧪 Teste Local - Ana Paula (Plano Bronze)

## Objetivo
Criar e testar o acesso como Ana Paula, que comprou o sistema no **plano Bronze** (não é admin).

---

## 🚀 Método Rápido - Script SQL

### Passo 1: Abra seu MySQL
- MySQL Workbench, phpMyAdmin, DBeaver, ou linha de comando

### Passo 2: Execute este SQL

```sql
-- Criar tenant Bronze
INSERT INTO tenants (
  nome, email, telefone, cpf, plano, status, dataInicio, dataFim,
  valorPlano, dataUltimoPagamento, dataProximoPagamento,
  periodicidade, statusPagamento, observacoes, createdAt, updatedAt
) VALUES (
  'Ana Paula', 'ana.paula@consultoriasst.com.br', '(11) 91111-0000', '55566677788',
  'bronze', 'ativo', CURDATE(), NULL, '67,90', CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'mensal', 'pago',
  'Teste local - plano Bronze', NOW(), NOW()
);

SET @tenant_id = LAST_INSERT_ID();
SET @password_hash = '$2b$10$xblCbCDzC/HQ9A8EpNfiieUc6kwrWzMm/5sPOLVtnROjVBABodCp6';

-- Criar usuário
INSERT INTO users (
  tenantId, name, email, cpf, passwordHash, role, openId,
  empresaId, createdAt, updatedAt, lastSignedIn
) VALUES (
  @tenant_id, 'Ana Paula', 'ana.paula@consultoriasst.com.br', '55566677788',
  @password_hash, 'tenant_admin', CONCAT('local-', UNIX_TIMESTAMP(NOW())),
  NULL, NOW(), NOW(), NOW()
);
```

### Passo 3: Verificar

```sql
SELECT 
  u.id, u.name, u.email, u.role, u.tenantId,
  t.plano, t.status
FROM users u
LEFT JOIN tenants t ON u.tenantId = t.id
WHERE u.email = 'ana.paula@consultoriasst.com.br';
```

Deve mostrar:
- `role`: `tenant_admin` (não é super_admin)
- `plano`: `bronze`
- `status`: `ativo`

---

## 🔑 Fazer Login

1. **Inicie o servidor local:**
   ```bash
   pnpm dev:win
   # ou
   pnpm dev
   ```

2. **Acesse:** http://localhost:3000

3. **Login:**
   - **Email/CPF:** `ana.paula@consultoriasst.com.br` ou `55566677788`
   - **Senha:** `111814gi`

---

## 👀 O que Ana Paula Verá

Como ela é **tenant_admin do plano Bronze**:

✅ **Pode:**
- Ver e gerenciar seus próprios dados
- Criar empresas, colaboradores, etc.
- Acessar todas as funcionalidades do sistema
- Ver apenas os dados do SEU sistema (isolamento)

❌ **NÃO pode:**
- Ver dados de outros clientes
- Acessar painel de administração geral
- Gerenciar outros tenants

---

## 🔧 Método Alternativo - Script TypeScript

Se preferir usar script:

1. **Edite:** `scripts/criar-ana-paula-local.ts`
   - Linha 19: Configure a senha do MySQL
   - Linha 20: Configure o nome do banco (se diferente de "sst")

2. **Execute:**
   ```bash
   npx tsx scripts/criar-ana-paula-local.ts
   ```

---

## ✅ Checklist

- [ ] Executei o SQL ou o script TypeScript
- [ ] Verifiquei que o usuário foi criado
- [ ] Verifiquei que o tenant está ativo
- [ ] Servidor local está rodando
- [ ] Fiz login com as credenciais de Ana Paula
- [ ] Consigo ver o sistema como ela veria

---

## 🆘 Problemas?

### "Usuário não encontrado"
- Execute o SQL novamente
- Verifique se o usuário foi criado (query de verificação)

### "Sistema não encontrado"
- Verifique se o tenant foi criado
- Verifique se `tenantId` do usuário está preenchido

### "Erro ao processar resposta"
- Verifique os logs do servidor
- Limpe o cache do navegador (Ctrl+F5)

### Script TypeScript não conecta
- Verifique se MySQL está rodando
- Verifique senha e nome do banco no script
- Tente usar o método SQL direto (mais fácil)

---

## 💡 Dica

O método SQL é mais rápido e direto. Basta copiar, colar e executar no seu cliente MySQL!







