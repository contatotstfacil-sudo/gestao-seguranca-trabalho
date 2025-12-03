-- Script SQL para vincular todos os setores e riscos existentes ao cargo "Analista de recursos humanos"
-- 
-- Este script:
-- 1. Encontra o cargo "Analista de recursos humanos" (CBO 2524-05)
-- 2. Busca todos os setores e riscos do mesmo tenant
-- 3. Vincula cada item ao cargo (evitando duplicatas)

-- Passo 1: Encontrar o cargo
SET @cargo_id = NULL;
SET @tenant_id = NULL;

SELECT id, tenantId INTO @cargo_id, @tenant_id
FROM cargos
WHERE (LOWER(nomeCargo) LIKE '%analista de recursos humanos%' OR codigoCbo = '2524-05')
LIMIT 1;

-- Verificar se encontrou o cargo
SELECT 
    CASE 
        WHEN @cargo_id IS NULL THEN 'ERRO: Cargo não encontrado!'
        ELSE CONCAT('Cargo encontrado: ID=', @cargo_id, ', Tenant=', @tenant_id)
    END AS status;

-- ========== VINCULAR SETORES ==========
-- Passo 2: Vincular todos os setores do mesmo tenant ao cargo
-- (apenas os que ainda não estão vinculados)
INSERT INTO cargoSetores (cargoId, setorId, empresaId, tenantId, createdAt, updatedAt)
SELECT 
    @cargo_id AS cargoId,
    s.id AS setorId,
    NULL AS empresaId,
    @tenant_id AS tenantId,
    NOW() AS createdAt,
    NOW() AS updatedAt
FROM setores s
WHERE s.tenantId = @tenant_id
  AND NOT EXISTS (
    SELECT 1 
    FROM cargoSetores cs 
    WHERE cs.cargoId = @cargo_id 
      AND cs.setorId = s.id
      AND cs.tenantId = @tenant_id
  );

-- Mostrar resultado dos setores
SELECT 
    CONCAT('Setores vinculados: ', ROW_COUNT()) AS resultado_setores;

-- ========== VINCULAR RISCOS ==========
-- Passo 3: Vincular todos os riscos do mesmo tenant ao cargo
-- (apenas os que ainda não estão vinculados)
INSERT INTO cargoRiscos (cargoId, riscoOcupacionalId, empresaId, tenantId, createdAt, updatedAt)
SELECT 
    @cargo_id AS cargoId,
    r.id AS riscoOcupacionalId,
    NULL AS empresaId,
    @tenant_id AS tenantId,
    NOW() AS createdAt,
    NOW() AS updatedAt
FROM riscosOcupacionais r
WHERE r.tenantId = @tenant_id
  AND NOT EXISTS (
    SELECT 1 
    FROM cargoRiscos cr 
    WHERE cr.cargoId = @cargo_id 
      AND cr.riscoOcupacionalId = r.id
      AND cr.tenantId = @tenant_id
  );

-- Mostrar resultado dos riscos
SELECT 
    CONCAT('Riscos vinculados: ', ROW_COUNT()) AS resultado_riscos;

-- ========== VERIFICAR RESULTADOS ==========
-- Verificar os setores vinculados
SELECT 
    'SETORES VINCULADOS' AS tipo,
    cs.id,
    cs.cargoId,
    cs.setorId,
    s.nomeSetor,
    cs.tenantId
FROM cargoSetores cs
INNER JOIN setores s ON cs.setorId = s.id
WHERE cs.cargoId = @cargo_id
  AND cs.tenantId = @tenant_id
ORDER BY s.nomeSetor;

-- Verificar os riscos vinculados
SELECT 
    'RISCOS VINCULADOS' AS tipo,
    cr.id,
    cr.cargoId,
    cr.riscoOcupacionalId,
    r.nomeRisco,
    r.tipoRisco,
    cr.tenantId
FROM cargoRiscos cr
INNER JOIN riscosOcupacionais r ON cr.riscoOcupacionalId = r.id
WHERE cr.cargoId = @cargo_id
  AND cr.tenantId = @tenant_id
ORDER BY r.nomeRisco;

