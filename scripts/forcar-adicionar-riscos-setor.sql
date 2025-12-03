-- Script SQL para FORÇAR adição de 2 riscos físicos e setor "Compras" ao cargo "Analista de recursos humanos"
-- Este script FORÇA a inserção diretamente no banco

-- Passo 1: Encontrar o cargo
SET @cargo_id = NULL;
SET @tenant_id = NULL;

SELECT id, tenantId INTO @cargo_id, @tenant_id
FROM cargos
WHERE (LOWER(nomeCargo) LIKE '%analista de recursos humanos%' OR codigoCbo = '2524-05')
LIMIT 1;

SELECT CONCAT('Cargo encontrado: ID=', @cargo_id, ', Tenant=', @tenant_id) AS status;

-- Passo 2: Encontrar ou criar 2 riscos físicos
SET @risco1_id = NULL;
SET @risco2_id = NULL;

-- Buscar riscos físicos existentes
SELECT id INTO @risco1_id
FROM riscosOcupacionais
WHERE tenantId = @tenant_id 
  AND (LOWER(tipoRisco) = 'fisico' OR LOWER(tipoRisco) = 'físico' OR LOWER(nomeRisco) LIKE '%fisico%' OR LOWER(nomeRisco) LIKE '%físico%')
LIMIT 1;

SELECT id INTO @risco2_id
FROM riscosOcupacionais
WHERE tenantId = @tenant_id 
  AND (LOWER(tipoRisco) = 'fisico' OR LOWER(tipoRisco) = 'físico' OR LOWER(nomeRisco) LIKE '%fisico%' OR LOWER(nomeRisco) LIKE '%físico%')
  AND id != IFNULL(@risco1_id, 0)
LIMIT 1;

-- Se não encontrou riscos físicos, criar 2
IF @risco1_id IS NULL THEN
  INSERT INTO riscosOcupacionais (nomeRisco, tipoRisco, status, tenantId, createdAt, updatedAt)
  VALUES ('Ruído', 'fisico', 'ativo', @tenant_id, NOW(), NOW());
  SET @risco1_id = LAST_INSERT_ID();
END IF;

IF @risco2_id IS NULL THEN
  INSERT INTO riscosOcupacionais (nomeRisco, tipoRisco, status, tenantId, createdAt, updatedAt)
  VALUES ('Vibração', 'fisico', 'ativo', @tenant_id, NOW(), NOW());
  SET @risco2_id = LAST_INSERT_ID();
END IF;

SELECT CONCAT('Risco 1: ID=', @risco1_id, ', Risco 2: ID=', @risco2_id) AS riscos_encontrados;

-- Passo 3: Encontrar ou criar setor "Compras"
SET @setor_id = NULL;

SELECT id INTO @setor_id
FROM setores
WHERE tenantId = @tenant_id 
  AND (LOWER(nomeSetor) LIKE '%compra%')
LIMIT 1;

-- Se não encontrou, criar
IF @setor_id IS NULL THEN
  INSERT INTO setores (nomeSetor, tenantId, createdAt, updatedAt)
  VALUES ('Compras', @tenant_id, NOW(), NOW());
  SET @setor_id = LAST_INSERT_ID();
END IF;

SELECT CONCAT('Setor encontrado/criado: ID=', @setor_id) AS setor_status;

-- Passo 4: FORÇAR vínculo dos 2 riscos (IGNORAR duplicatas)
INSERT IGNORE INTO cargoRiscos (cargoId, riscoOcupacionalId, empresaId, tenantId, createdAt, updatedAt)
VALUES 
  (@cargo_id, @risco1_id, NULL, @tenant_id, NOW(), NOW()),
  (@cargo_id, @risco2_id, NULL, @tenant_id, NOW(), NOW());

SELECT CONCAT('Riscos vinculados: ', ROW_COUNT()) AS resultado_riscos;

-- Passo 5: FORÇAR vínculo do setor (IGNORAR duplicatas)
INSERT IGNORE INTO cargoSetores (cargoId, setorId, empresaId, tenantId, createdAt, updatedAt)
VALUES (@cargo_id, @setor_id, NULL, @tenant_id, NOW(), NOW());

SELECT CONCAT('Setor vinculado: ', ROW_COUNT()) AS resultado_setor;

-- Passo 6: Verificar resultados
SELECT 
    'RISCOS VINCULADOS' AS tipo,
    cr.id,
    r.nomeRisco,
    r.tipoRisco
FROM cargoRiscos cr
INNER JOIN riscosOcupacionais r ON cr.riscoOcupacionalId = r.id
WHERE cr.cargoId = @cargo_id AND cr.tenantId = @tenant_id
ORDER BY r.nomeRisco;

SELECT 
    'SETORES VINCULADOS' AS tipo,
    cs.id,
    s.nomeSetor
FROM cargoSetores cs
INNER JOIN setores s ON cs.setorId = s.id
WHERE cs.cargoId = @cargo_id AND cs.tenantId = @tenant_id
ORDER BY s.nomeSetor;

