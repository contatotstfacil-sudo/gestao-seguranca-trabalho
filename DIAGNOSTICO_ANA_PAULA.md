# 🔍 Diagnóstico - Por que Ana Paula não consegue fazer login?

## 🚨 Problemas Comuns

### 1. Usuário não existe no banco
**Sintoma:** "Usuário não encontrado"

**Solução:**
```bash
npx tsx scripts/criar-ana-paula-local.ts
```

### 2. Senha incorreta
**Sintoma:** "Senha incorreta"

**Solução:**
- Verifique se a senha no banco está correta
- O hash deve ser gerado com bcrypt
- Use o script de verificação para testar

### 3. Tenant não existe ou está inativo
**Sintoma:** "Sistema não encontrado" ou "Sistema suspenso/cancelado"

**Solução:**
- Verifique se o tenant foi criado
- Verifique se o status é "ativo"
- Verifique se o tenantId está vinculado ao usuário

### 4. Tenant expirado
**Sintoma:** "Seu sistema expirou"

**Solução:**
- Verifique a dataFim do tenant
- Se expirou, atualize a dataFim ou crie novo tenant

### 5. CPF/Email não normalizado
**Sintoma:** "Usuário não encontrado" (mesmo existindo)

**Solução:**
- O sistema normaliza CPF (remove pontos e traços)
- Tente fazer login com CPF apenas números: `12345678901`
- Ou use o email completo

---

## 🔧 Script de Diagnóstico

Execute para verificar tudo:

```bash
npx tsx scripts/verificar-ana-paula-login.ts
```

**IMPORTANTE:** Configure a senha do MySQL no script antes de executar!

O script vai verificar:
- ✅ Se o usuário existe
- ✅ Se a senha está correta
- ✅ Se o tenant existe
- ✅ Se o tenant está ativo
- ✅ Se o tenant não expirou

---

## 📋 Verificação Manual no Banco

### 1. Verificar se usuário existe
```sql
SELECT id, name, email, cpf, tenantId, role 
FROM users 
WHERE email = 'ana.paula@teste.com' 
   OR cpf = '12345678901';
```

### 2. Verificar se tenant existe e está ativo
```sql
SELECT id, nome, plano, status, dataInicio, dataFim 
FROM tenants 
WHERE id = (SELECT tenantId FROM users WHERE email = 'ana.paula@teste.com');
```

### 3. Verificar senha (hash)
```sql
SELECT passwordHash 
FROM users 
WHERE email = 'ana.paula@teste.com';
```

---

## 🎯 Passo a Passo para Resolver

### Passo 1: Executar Diagnóstico
```bash
npx tsx scripts/verificar-ana-paula-login.ts
```

### Passo 2: Verificar Logs do Servidor
Quando tentar fazer login, observe os logs do servidor. Eles mostram:
- Qual identificador foi usado
- Se o usuário foi encontrado
- Se a senha está correta
- Se o tenant foi validado
- Qual erro específico ocorreu

### Passo 3: Corrigir Problemas Encontrados

**Se usuário não existe:**
```bash
npx tsx scripts/criar-ana-paula-local.ts
```

**Se tenant não existe ou está inativo:**
- Crie o tenant via interface (Administração de Clientes)
- Ou via SQL direto

**Se senha está incorreta:**
- Use o script de gerar hash: `npx tsx scripts/gerar-hash-senha.ts`
- Atualize no banco

### Passo 4: Testar Login Novamente

Use as credenciais:
- **Email/CPF:** `ana.paula@teste.com` ou `12345678901`
- **Senha:** `111814gi`

---

## 🔑 Credenciais Esperadas

- **Email:** `ana.paula@teste.com`
- **CPF:** `12345678901` (apenas números, sem pontos/traços)
- **Senha:** `111814gi`
- **Plano:** Bronze
- **Role:** `tenant_admin`

---

## 📝 Logs do Servidor

Quando tentar fazer login, os logs mostram:

```
[Login] Identificador recebido: "12345678901"
[Login] CPF detectado (11 dígitos): 12345678901
[Login] Buscando usuário com identificador: "12345678901"
[Login] Usuário encontrado: ID=123, Email=ana.paula@teste.com, CPF=12345678901, Role=tenant_admin, TenantId=456
[Login] Senha correta para usuário ID=123
[Login] Validando tenant ID=456 para usuário ID=123
[Login] Tenant encontrado: ID=456, Status=ativo, DataFim=2025-12-08
[Login] ✅ Tenant validado com sucesso: ID=456, Status=ativo
[Login] ✅ Login bem-sucedido para usuário ID=123
```

Se houver erro, o log mostrará exatamente onde falhou.

---

## 🆘 Ainda não funciona?

1. **Verifique os logs do servidor** quando tentar fazer login
2. **Execute o script de diagnóstico** para ver o que está errado
3. **Verifique o console do navegador** (F12) para erros de frontend
4. **Teste com outro usuário** para ver se o problema é específico da Ana Paula

---

## 💡 Dica

O sistema tem logs detalhados. Sempre verifique os logs do servidor quando houver problemas de login. Eles mostram exatamente onde está falhando!

