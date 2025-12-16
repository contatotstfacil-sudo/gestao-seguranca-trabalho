# 🧪 Modo Local para Testes

## ✅ Configuração Aplicada

O sistema foi ajustado para permitir **testes locais sem validação rigorosa de tenant**.

---

## 🔄 Como Funciona Agora

### Modo Desenvolvimento (Local)
**Quando:** `NODE_ENV=development`

✅ **Permite:**
- Login sem tenant (para técnicos testarem)
- Acesso ao sistema mesmo sem tenantId
- Testes sem precisar criar tenant

⚠️ **Avisos:**
- Logs mostram avisos quando usuário não tem tenant
- Mas **não bloqueia** o acesso

### Modo Produção
**Quando:** `NODE_ENV=production`

✅ **Mantém:**
- Validação rigorosa de tenant
- Bloqueio de acesso sem tenant
- Verificação de status e expiração
- Isolamento completo de dados

---

## 🚀 Como Usar para Testes Locais

### 1. Certifique-se que está em modo desenvolvimento

No arquivo `.env` ou `.env.local`:
```env
NODE_ENV=development
```

### 2. Crie usuários normalmente

Você pode criar usuários **sem tenantId** que funcionarão em modo local:

```sql
-- Criar usuário para teste (sem tenant)
INSERT INTO users (
  name, email, cpf, passwordHash, role, openId,
  empresaId, createdAt, updatedAt, lastSignedIn
) VALUES (
  'Técnico Teste',
  'tecnico@teste.com',
  '12345678900',
  '$2b$10$...', -- hash da senha
  'user', -- ou 'admin', 'gestor', etc
  CONCAT('local-', UNIX_TIMESTAMP(NOW())),
  NULL,
  NOW(),
  NOW(),
  NOW()
);
```

### 3. Faça login normalmente

- **Email/CPF:** O que você cadastrou
- **Senha:** A senha que você definiu

**Funcionará mesmo sem tenant!** ✅

---

## 📋 Diferenças entre Ambientes

| Recurso | Desenvolvimento (Local) | Produção |
|---------|------------------------|----------|
| Validação de Tenant | ⚠️ Aviso apenas | ✅ Bloqueia acesso |
| Login sem tenantId | ✅ Permitido | ❌ Bloqueado |
| Verificação de status | ⚠️ Opcional | ✅ Obrigatória |
| Verificação de expiração | ⚠️ Opcional | ✅ Obrigatória |
| Isolamento de dados | ⚠️ Flexível | ✅ Rigoroso |

---

## 🔧 Para Técnicos Testarem

### Opção 1: Criar usuário simples (sem tenant)
```sql
-- Gerar hash da senha primeiro
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('senha123', 10).then(h => console.log(h));"

INSERT INTO users (
  name, email, passwordHash, role, openId,
  createdAt, updatedAt, lastSignedIn
) VALUES (
  'Nome do Técnico',
  'tecnico@email.com',
  '$2b$10$...', -- hash da senha
  'user',
  CONCAT('local-', UNIX_TIMESTAMP(NOW())),
  NOW(),
  NOW(),
  NOW()
);
```

### Opção 2: Usar usuário admin existente
- CPF: `38099529820`
- Senha: `G476589496i@`

### Opção 3: Criar com tenant (se quiser testar isolamento)
Use o formulário de cadastro na página de Administração de Clientes.

---

## ⚙️ Configuração do Servidor Local

Certifique-se de que o servidor está rodando em modo desenvolvimento:

```bash
# Verificar NODE_ENV
echo $env:NODE_ENV  # Windows PowerShell
# ou
echo $NODE_ENV      # Linux/Mac

# Deve mostrar: development
```

Se não estiver, configure no `.env`:
```env
NODE_ENV=development
```

---

## 🎯 Exemplo Prático

### Criar usuário de teste rapidamente:

1. **Gerar hash da senha:**
   ```bash
   npx tsx scripts/gerar-hash-senha.ts
   # (edite o script para mudar a senha)
   ```

2. **Executar SQL:**
   ```sql
   INSERT INTO users (name, email, passwordHash, role, openId, createdAt, updatedAt, lastSignedIn)
   VALUES ('Técnico Teste', 'teste@local.com', 'HASH_AQUI', 'user', 'local-123', NOW(), NOW(), NOW());
   ```

3. **Fazer login:**
   - Email: `teste@local.com`
   - Senha: A senha que você usou

**Funcionará em modo local!** ✅

---

## 📝 Notas Importantes

1. **Em produção:** Todas as validações são rigorosas
2. **Em desenvolvimento:** Validações são flexíveis para facilitar testes
3. **Logs:** Você verá avisos no console, mas o acesso não será bloqueado
4. **Isolamento:** Em desenvolvimento, o isolamento ainda funciona se o usuário tiver tenantId

---

## ✅ Status

**Sistema configurado para testes locais!**

- ✅ Login funciona sem tenant em desenvolvimento
- ✅ Técnicos podem testar localmente
- ✅ Produção mantém segurança rigorosa
- ✅ Validações automáticas por ambiente








