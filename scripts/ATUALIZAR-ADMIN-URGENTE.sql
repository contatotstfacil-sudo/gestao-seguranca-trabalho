-- ⚠️ SCRIPT URGENTE PARA ATUALIZAR ROLE DO ADMIN
-- Execute este SQL diretamente no MySQL para corrigir o role

-- 1. Ver o usuário atual (ID 4198 baseado nos logs)
SELECT id, name, email, cpf, role, tenantId FROM users WHERE id = 4198;

-- 2. ATUALIZAR PARA ADMIN (EXECUTE ESTE COMANDO):
UPDATE users SET role = 'admin', updatedAt = NOW() WHERE id = 4198;

-- 3. Verificar se foi atualizado:
SELECT id, name, email, cpf, role, tenantId FROM users WHERE id = 4198;

-- 4. Se quiser atualizar TODOS os usuários sem tenantId para admin:
-- UPDATE users SET role = 'admin', updatedAt = NOW() WHERE tenantId IS NULL AND role != 'super_admin';



