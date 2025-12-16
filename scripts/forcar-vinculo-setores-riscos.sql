-- Script SQL para FORÇAR vínculo de setores e riscos ao cargo "Analista de recursos humanos"
-- Este script FORÇA a inserção mesmo que já exista

-- Passo 1: Encontrar o cargo
SET @cargo_id = NULL;
SET @tenant_id = NULL;

SELECT id, tenantId INTO @cargo_id, @tenant_id
FROM cargos
WHERE (LOWER(nomeCargo) LIKE '%analista de recursos humanos%' OR codigoCbo = '2524-05')
LIMIT 1;

SELECT CONCAT('Cargo encontrado: ID=', @cargo_id, ', Tenant=', @tenant_id) AS status;

-- ========== FORÇAR VÍNCULO DE SETORES ==========
-- Deletar vínculos existentes primeiro (opcional - comente se não quiser deletar)
-- DELETE FROM cargoSetores WHERE cargoId = @cargo_id AND tenantId = @tenant_id;

-- Inserir TODOS os setores do tenant (IGNORAR duplicatas)
INSERT IGNORE INTO cargoSetores (cargoId, setorId, empresaId, tenantId, createdAt, updatedAt)
SELECT 
    @cargo_id AS cargoId,
    s.id AS setorId,
    NULL AS empresaId,
    @tenant_id AS tenantId,
    NOW() AS createdAt,
    NOW() AS updatedAt
FROM setores s
WHERE s.tenantId = @tenant_id;

SELECT CONCAT('Setores vinculados: ', ROW_COUNT()) AS resultado_setores;

-- ========== FORÇAR VÍNCULO DE RISCOS ==========
-- Deletar vínculos existentes primeiro (opcional - comente se não quiser deletar)
-- DELETE FROM cargoRiscos WHERE cargoId = @cargo_id AND tenantId = @tenant_id;

-- Inserir TODOS os riscos do tenant (IGNORAR duplicatas)
INSERT IGNORE INTO cargoRiscos (cargoId, riscoOcupacionalId, empresaId, tenantId, createdAt, updatedAt)
SELECT 
    @cargo_id AS cargoId,
    r.id AS riscoOcupacionalId,
    NULL AS empresaId,
    @tenant_id AS tenantId,
    NOW() AS createdAt,
    NOW() AS updatedAt
FROM riscosOcupacionais r
WHERE r.tenantId = @tenant_id;

SELECT CONCAT('Riscos vinculados: ', ROW_COUNT()) AS resultado_riscos;

-- ========== VERIFICAR RESULTADOS ==========
SELECT 
    'SETORES VINCULADOS' AS tipo,
    COUNT(*) AS total
FROM cargoSetores cs
WHERE cs.cargoId = @cargo_id AND cs.tenantId = @tenant_id;

SELECT 
    'RISCOS VINCULADOS' AS tipo,
    COUNT(*) AS total
FROM cargoRiscos cr
WHERE cr.cargoId = @cargo_id AND cr.tenantId = @tenant_id;

-- Listar setores vinculados
SELECT 
    cs.id,
    s.nomeSetor,
    cs.createdAt
FROM cargoSetores cs
INNER JOIN setores s ON cs.setorId = s.id
WHERE cs.cargoId = @cargo_id AND cs.tenantId = @tenant_id
ORDER BY s.nomeSetor;

-- Listar riscos vinculados
SELECT 
    cr.id,
    r.nomeRisco,
    r.tipoRisco,
    cr.createdAt
FROM cargoRiscos cr
INNER JOIN riscosOcupacionais r ON cr.riscoOcupacionalId = r.id
WHERE cr.cargoId = @cargo_id AND cr.tenantId = @tenant_id
ORDER BY r.nomeRisco;


