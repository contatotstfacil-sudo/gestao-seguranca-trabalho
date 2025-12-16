-- Script SQL para vincular todos os treinamentos existentes ao cargo "Analista de recursos humanos"
-- 
-- Este script:
-- 1. Encontra o cargo "Analista de recursos humanos" (CBO 2524-05)
-- 2. Busca todos os tipos de treinamentos do mesmo tenant
-- 3. Vincula cada treinamento ao cargo (evitando duplicatas)

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

-- Passo 2: Vincular todos os treinamentos do mesmo tenant ao cargo
-- (apenas os que ainda não estão vinculados)
INSERT INTO cargoTreinamentos (cargoId, tipoTreinamentoId, empresaId, tenantId, createdAt, updatedAt)
SELECT 
    @cargo_id AS cargoId,
    tt.id AS tipoTreinamentoId,
    NULL AS empresaId,
    @tenant_id AS tenantId,
    NOW() AS createdAt,
    NOW() AS updatedAt
FROM tiposTreinamentos tt
WHERE tt.tenantId = @tenant_id
  AND NOT EXISTS (
    SELECT 1 
    FROM cargoTreinamentos ct 
    WHERE ct.cargoId = @cargo_id 
      AND ct.tipoTreinamentoId = tt.id
      AND ct.tenantId = @tenant_id
  );

-- Passo 3: Mostrar resultado
SELECT 
    CONCAT('Treinamentos vinculados: ', ROW_COUNT()) AS resultado;

-- Verificar os treinamentos vinculados
SELECT 
    ct.id,
    ct.cargoId,
    ct.tipoTreinamentoId,
    tt.nomeTreinamento,
    tt.tipoNr,
    ct.tenantId
FROM cargoTreinamentos ct
INNER JOIN tiposTreinamentos tt ON ct.tipoTreinamentoId = tt.id
WHERE ct.cargoId = @cargo_id
  AND ct.tenantId = @tenant_id
ORDER BY tt.nomeTreinamento;


