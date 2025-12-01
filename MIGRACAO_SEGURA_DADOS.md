# 🔒 Migração Segura - Preservação de Dados Existentes

## ✅ Garantia Total

**NENHUM DADO SERÁ PERDIDO!**

A migração será feita de forma incremental e segura, preservando 100% dos dados existentes.

---

## 🎯 Estratégia de Migração

### Fase 1: Preparação (SEM PERDA DE DADOS)

1. **Criar tabela `tenants`**
   - Nova tabela vazia
   - Não afeta dados existentes

2. **Adicionar coluna `tenantId` como NULLABLE**
   ```sql
   ALTER TABLE users ADD COLUMN tenantId INT NULL;
   ALTER TABLE empresas ADD COLUMN tenantId INT NULL;
   -- etc...
   ```
   - Colunas começam como NULL (opcional)
   - Todos os dados existentes continuam funcionando normalmente

### Fase 2: Criar Tenant Padrão

3. **Criar tenant padrão para dados existentes**
   ```sql
   INSERT INTO tenants (nome, plano, status, dataInicio)
   VALUES ('Dados Existentes', 'profissional', 'ativo', CURDATE());
   ```
   - Cria um tenant especial para seus dados atuais
   - Você será o admin deste tenant

### Fase 3: Atribuir Dados ao Tenant Padrão

4. **Atribuir todos os registros existentes ao tenant padrão**
   ```sql
   -- Atualizar usuários existentes
   UPDATE users SET tenantId = 1 WHERE tenantId IS NULL;
   
   -- Atualizar empresas existentes
   UPDATE empresas SET tenantId = 1 WHERE tenantId IS NULL;
   
   -- Atualizar colaboradores existentes
   UPDATE colaboradores SET tenantId = 1 WHERE tenantId IS NULL;
   
   -- E assim por diante para todas as tabelas...
   ```
   - Todos os dados existentes são atribuídos ao tenant padrão
   - Nenhum dado é deletado ou modificado (apenas adiciona tenantId)

### Fase 4: Tornar tenantId Obrigatório (Opcional)

5. **Tornar tenantId obrigatório (após migração)**
   ```sql
   -- Só fazer DEPOIS de garantir que todos os registros têm tenantId
   ALTER TABLE empresas MODIFY COLUMN tenantId INT NOT NULL;
   ```
   - Isso garante que novos registros sempre tenham tenantId
   - Só fazer depois de migrar todos os dados existentes

---

## 📋 Script de Migração Completo

```sql
-- ============================================
-- MIGRAÇÃO SEGURA - PRESERVA TODOS OS DADOS
-- ============================================

-- PASSO 1: Criar tabela tenants (não afeta dados existentes)
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

-- PASSO 2: Adicionar tenantId como NULLABLE (não quebra nada)
ALTER TABLE users ADD COLUMN tenantId INT NULL;
ALTER TABLE empresas ADD COLUMN tenantId INT NULL;
ALTER TABLE colaboradores ADD COLUMN tenantId INT NULL;
ALTER TABLE obras ADD COLUMN tenantId INT NULL;
ALTER TABLE treinamentos ADD COLUMN tenantId INT NULL;
ALTER TABLE epis ADD COLUMN tenantId INT NULL;
-- ... adicionar nas demais tabelas

-- PASSO 3: Criar tenant padrão para dados existentes
INSERT INTO tenants (nome, plano, status, dataInicio)
VALUES ('Dados Existentes', 'profissional', 'ativo', CURDATE());

-- Guardar o ID do tenant criado (geralmente será 1)
SET @tenant_padrao_id = LAST_INSERT_ID();

-- PASSO 4: Atribuir todos os dados existentes ao tenant padrão
UPDATE users SET tenantId = @tenant_padrao_id WHERE tenantId IS NULL;
UPDATE empresas SET tenantId = @tenant_padrao_id WHERE tenantId IS NULL;
UPDATE colaboradores SET tenantId = @tenant_padrao_id WHERE tenantId IS NULL;
UPDATE obras SET tenantId = @tenant_padrao_id WHERE tenantId IS NULL;
UPDATE treinamentos SET tenantId = @tenant_padrao_id WHERE tenantId IS NULL;
UPDATE epis SET tenantId = @tenant_padrao_id WHERE tenantId IS NULL;
-- ... atualizar nas demais tabelas

-- PASSO 5: Criar índices para performance (opcional, mas recomendado)
CREATE INDEX idx_users_tenant ON users(tenantId);
CREATE INDEX idx_empresas_tenant ON empresas(tenantId);
CREATE INDEX idx_colaboradores_tenant ON colaboradores(tenantId);
-- ... criar índices para todas as tabelas

-- PASSO 6: Verificar que todos os registros têm tenantId
-- (Fazer queries de verificação antes de tornar obrigatório)
SELECT COUNT(*) as total, COUNT(tenantId) as com_tenant 
FROM empresas;
-- Se total == com_tenant, está tudo certo!

-- PASSO 7: Tornar tenantId obrigatório (SÓ DEPOIS de verificar)
-- ALTER TABLE empresas MODIFY COLUMN tenantId INT NOT NULL;
-- (Comentar por enquanto, fazer depois de testar)
```

---

## 🛡️ Proteções Implementadas

### 1. Backup Automático
**SEMPRE fazer backup antes de migrar:**
```bash
# Usar o script de backup existente
.\fazer-backup-node.ps1
```

### 2. Migração Incremental
- Cada passo é independente
- Pode parar a qualquer momento
- Dados sempre funcionam (mesmo sem tenantId inicialmente)

### 3. Validação em Cada Etapa
```sql
-- Verificar antes de continuar
SELECT COUNT(*) FROM empresas WHERE tenantId IS NULL;
-- Se retornar 0, todos os registros foram migrados
```

### 4. Rollback Possível
Se algo der errado:
```sql
-- Remover tenantId (volta ao estado anterior)
ALTER TABLE empresas DROP COLUMN tenantId;
-- Dados continuam intactos!
```

---

## ✅ Checklist de Migração Segura

- [ ] **Fazer backup completo do banco**
- [ ] Criar tabela `tenants`
- [ ] Adicionar `tenantId` como NULLABLE em todas as tabelas
- [ ] Criar tenant padrão
- [ ] Atribuir dados existentes ao tenant padrão
- [ ] Verificar que todos os registros têm tenantId
- [ ] Testar sistema funcionando normalmente
- [ ] Criar índices para performance
- [ ] (Opcional) Tornar tenantId obrigatório

---

## 🎯 O Que Acontece Com Seus Dados

### Antes da Migração:
```
Empresas: [Empresa A, Empresa B, Empresa C]
Colaboradores: [João, Maria, Pedro]
Obras: [Obra 1, Obra 2]
```

### Durante a Migração:
```
Tenants: [Tenant Padrão (ID: 1)]

Empresas: 
  - Empresa A (tenantId: 1) ✅
  - Empresa B (tenantId: 1) ✅
  - Empresa C (tenantId: 1) ✅

Colaboradores:
  - João (tenantId: 1) ✅
  - Maria (tenantId: 1) ✅
  - Pedro (tenantId: 1) ✅
```

### Depois da Migração:
```
✅ Todos os dados preservados
✅ Todos atribuídos ao tenant padrão
✅ Sistema funcionando normalmente
✅ Você continua tendo acesso a tudo
```

---

## 🔄 Processo de Teste

### 1. Testar em Ambiente de Desenvolvimento Primeiro

```bash
# 1. Fazer backup
.\fazer-backup-node.ps1

# 2. Aplicar migração
# (executar script SQL)

# 3. Testar sistema
# - Login funciona?
# - Dados aparecem?
# - Queries funcionam?

# 4. Se tudo OK, aplicar em produção
```

### 2. Validação Pós-Migração

```sql
-- Verificar contagens
SELECT 
  (SELECT COUNT(*) FROM empresas) as total_empresas,
  (SELECT COUNT(*) FROM empresas WHERE tenantId IS NOT NULL) as empresas_com_tenant,
  (SELECT COUNT(*) FROM colaboradores) as total_colaboradores,
  (SELECT COUNT(*) FROM colaboradores WHERE tenantId IS NOT NULL) as colaboradores_com_tenant;

-- Se os números forem iguais, está tudo certo!
```

---

## ⚠️ Importante

1. **SEMPRE fazer backup antes**
2. **Testar em desenvolvimento primeiro**
3. **Migração incremental** (passo a passo)
4. **Validar cada etapa**
5. **Dados nunca são deletados** (apenas adicionamos tenantId)

---

## 🎉 Resultado Final

Após a migração:
- ✅ **Todos os seus dados preservados**
- ✅ **Você será admin do tenant padrão**
- ✅ **Sistema funcionando normalmente**
- ✅ **Novos clientes terão seus próprios tenants isolados**
- ✅ **Você não perde acesso a nada**

---

## 📞 Se Algo Der Errado

1. **Parar imediatamente**
2. **Restaurar backup**
3. **Analisar o problema**
4. **Corrigir e tentar novamente**

**Nunca perderemos dados porque:**
- Migração é incremental
- Dados nunca são deletados
- Sempre podemos fazer rollback
- Backup sempre disponível















