-- Script para corrigir o role do usuário admin
-- Este script atualiza o role do usuário para 'admin' ou 'super_admin'

-- 1. Verificar todos os usuários e seus roles
SELECT id, name, email, cpf, cnpj, role, tenantId 
FROM users 
ORDER BY id;

-- 2. Atualizar o usuário específico para 'admin' (substitua o ID pelo seu usuário admin)
-- Baseado nos logs, o usuário ID 4198 precisa ser atualizado:
UPDATE users SET role = 'admin', updatedAt = NOW() WHERE id = 4198;

-- 3. Verificar se foi atualizado corretamente
SELECT id, name, email, role, tenantId 
FROM users 
WHERE id = 4198;

-- 4. OU atualizar por email (se souber o email do admin)
-- UPDATE users SET role = 'admin', updatedAt = NOW() WHERE email = 'seu-email@admin.com';

-- 5. OU atualizar por CPF (se souber o CPF do admin)
-- UPDATE users SET role = 'admin', updatedAt = NOW() WHERE cpf = 'SEU_CPF_AQUI';

-- 6. Verificar usuários sem tenantId (geralmente são admins)
SELECT id, name, email, role, tenantId 
FROM users 
WHERE tenantId IS NULL;

-- 7. Verificar todos os usuários com role 'admin' ou 'super_admin'
SELECT id, name, email, role, tenantId 
FROM users 
WHERE role IN ('admin', 'super_admin');

