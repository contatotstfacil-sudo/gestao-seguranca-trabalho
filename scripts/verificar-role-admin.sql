-- Script para verificar o role do usuário admin
-- Execute este script no seu banco de dados MySQL

SELECT 
    id,
    name,
    email,
    cpf,
    cnpj,
    role,
    tenantId,
    openId,
    createdAt,
    updatedAt
FROM users
WHERE role IN ('admin', 'super_admin')
ORDER BY id;

-- Verificar se há usuários com role diferente
SELECT 
    role,
    COUNT(*) as total
FROM users
GROUP BY role;





