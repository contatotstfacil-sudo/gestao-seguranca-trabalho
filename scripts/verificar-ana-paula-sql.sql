-- Script SQL para verificar se Ana Paula foi criada corretamente
-- Execute este script diretamente no seu banco MySQL

-- 1. Verificar se o usuário existe
SELECT 
  '=== VERIFICAÇÃO DO USUÁRIO ===' as verificacao,
  u.id as user_id,
  u.name as nome,
  u.email,
  u.cpf,
  u.role,
  u.tenantId,
  CASE 
    WHEN u.passwordHash IS NULL THEN '❌ NÃO TEM SENHA'
    WHEN u.passwordHash = '' THEN '❌ SENHA VAZIA'
    ELSE '✅ TEM SENHA'
  END as status_senha,
  u.openId,
  u.createdAt,
  u.updatedAt
FROM users u
WHERE u.email = 'ana.paula@consultoriasst.com.br' 
   OR u.cpf = '55566677788';

-- 2. Verificar se o tenant existe e está ativo
SELECT 
  '=== VERIFICAÇÃO DO TENANT ===' as verificacao,
  t.id as tenant_id,
  t.nome,
  t.plano,
  t.status,
  CASE 
    WHEN t.status != 'ativo' THEN '❌ NÃO ESTÁ ATIVO'
    ELSE '✅ ESTÁ ATIVO'
  END as status_tenant,
  t.dataInicio,
  t.dataFim,
  CASE 
    WHEN t.dataFim IS NULL THEN '✅ NÃO EXPIRA'
    WHEN t.dataFim < CURDATE() THEN '❌ EXPIRADO'
    ELSE '✅ VÁLIDO'
  END as status_expiracao,
  t.statusPagamento,
  t.createdAt
FROM tenants t
WHERE t.cpf = '55566677788'
   OR t.email = 'ana.paula@consultoriasst.com.br'
   OR t.nome LIKE '%Ana Paula%';

-- 3. Verificar vínculo entre usuário e tenant
SELECT 
  '=== VÍNCULO USUÁRIO-TENANT ===' as verificacao,
  u.id as user_id,
  u.name as nome_usuario,
  u.email as email_usuario,
  u.tenantId,
  t.id as tenant_id,
  t.nome as nome_tenant,
  t.plano,
  t.status as status_tenant,
  CASE 
    WHEN u.tenantId IS NULL THEN '❌ USUÁRIO SEM TENANT'
    WHEN t.id IS NULL THEN '❌ TENANT NÃO EXISTE'
    WHEN t.status != 'ativo' THEN '❌ TENANT NÃO ESTÁ ATIVO'
    WHEN t.dataFim IS NOT NULL AND t.dataFim < CURDATE() THEN '❌ TENANT EXPIRADO'
    WHEN u.passwordHash IS NULL THEN '❌ USUÁRIO SEM SENHA'
    ELSE '✅ TUDO OK - PODE FAZER LOGIN'
  END as status_geral
FROM users u
LEFT JOIN tenants t ON u.tenantId = t.id
WHERE u.email = 'ana.paula@consultoriasst.com.br' 
   OR u.cpf = '55566677788';

-- 4. Se não encontrou nada, mostrar instruções
SELECT 
  '=== INSTRUÇÕES ===' as instrucoes,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM users 
      WHERE email = 'ana.paula@consultoriasst.com.br' 
         OR cpf = '55566677788'
    ) THEN '❌ USUÁRIO NÃO EXISTE - Execute o script criar-ana-paula-sql.sql'
    WHEN NOT EXISTS (
      SELECT 1 FROM tenants t
      INNER JOIN users u ON u.tenantId = t.id
      WHERE u.email = 'ana.paula@consultoriasst.com.br' 
         OR u.cpf = '55566677788'
    ) THEN '❌ TENANT NÃO EXISTE - Execute o script criar-ana-paula-sql.sql'
    ELSE '✅ Verifique os resultados acima'
  END as acao_necessaria;








