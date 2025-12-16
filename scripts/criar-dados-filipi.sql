-- Script SQL para criar dados fictícios para o usuário Filipi
-- Respeitando os limites do plano Bronze:
-- - maxEmpresas: 5
-- - maxColaboradores: 20 por empresa

-- Primeiro, vamos encontrar o tenantId do Filipi
SET @tenant_id = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1);

-- Verificar se encontrou o tenant
SELECT CONCAT('Tenant ID encontrado: ', @tenant_id) AS info;

-- Verificar quantas empresas já existem
SET @total_empresas = (SELECT COUNT(*) FROM empresas WHERE tenantId = @tenant_id);
SELECT CONCAT('Empresas existentes: ', @total_empresas, '/5') AS info;

-- Criar empresas (máximo 5, respeitando o limite)
INSERT INTO empresas (
  tenantId, razaoSocial, cnpj, grauRisco, cnae, responsavelTecnico,
  emailContato, tipoLogradouro, nomeLogradouro, numeroEndereco,
  complementoEndereco, bairroEndereco, cidadeEndereco, estadoEndereco, cep,
  descricaoAtividade, status, createdAt, updatedAt
) VALUES
  (@tenant_id, 'Construtora Filipi & Associados Ltda', '12345678000190', '4', '4110700', 'Filipi José Silva',
   'contato@filipiconstrucoes.com.br', 'Avenida', 'Principal', '1234', 'Sala 101', 'Centro', 'São Paulo', 'SP', '01310100',
   'Construção de edifícios e obras de infraestrutura', 'ativa', NOW(), NOW()),
  
  (@tenant_id, 'Filipi Engenharia e Projetos ME', '98765432000111', '3', '7111100', 'Filipi José Silva',
   'engenharia@filipiproj.com.br', 'Rua', 'Engenheiros', '567', '', 'Jardim das Flores', 'Campinas', 'SP', '13000000',
   'Serviços de engenharia e projetos', 'ativa', NOW(), NOW()),
  
  (@tenant_id, 'Filipi Serviços de Manutenção Ltda', '11223344000155', '2', '4321500', 'Filipi José Silva',
   'manutencao@filipiservicos.com.br', 'Rua', 'Manutenção', '890', 'Galpão 2', 'Industrial', 'Guarulhos', 'SP', '07000000',
   'Serviços de manutenção e reparo', 'ativa', NOW(), NOW()),
  
  (@tenant_id, 'Filipi Transportes e Logística ME', '55667788000122', '3', '4923000', 'Filipi José Silva',
   'transporte@filipilog.com.br', 'Avenida', 'Transportes', '2345', '', 'Logística', 'São Bernardo do Campo', 'SP', '09700000',
   'Transporte rodoviário de cargas', 'ativa', NOW(), NOW()),
  
  (@tenant_id, 'Filipi Comércio de Materiais de Construção Ltda', '99887766000133', '1', '4663100', 'Filipi José Silva',
   'vendas@filipimateriais.com.br', 'Rua', 'Comércio', '678', 'Loja 1', 'Comercial', 'Osasco', 'SP', '06000000',
   'Comércio varejista de materiais de construção', 'ativa', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Obter IDs das empresas criadas
SET @empresa1 = (SELECT id FROM empresas WHERE tenantId = @tenant_id AND cnpj = '12345678000190' LIMIT 1);
SET @empresa2 = (SELECT id FROM empresas WHERE tenantId = @tenant_id AND cnpj = '98765432000111' LIMIT 1);
SET @empresa3 = (SELECT id FROM empresas WHERE tenantId = @tenant_id AND cnpj = '11223344000155' LIMIT 1);
SET @empresa4 = (SELECT id FROM empresas WHERE tenantId = @tenant_id AND cnpj = '55667788000122' LIMIT 1);
SET @empresa5 = (SELECT id FROM empresas WHERE tenantId = @tenant_id AND cnpj = '99887766000133' LIMIT 1);

-- Criar setores para cada empresa
INSERT INTO setores (tenantId, empresaId, nomeSetor, descricao, createdAt, updatedAt) VALUES
  (@tenant_id, @empresa1, 'Obra', 'Setor de Obra', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Administrativo', 'Setor Administrativo', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Almoxarifado', 'Setor de Almoxarifado', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Manutenção', 'Setor de Manutenção', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Transporte', 'Setor de Transporte', NOW(), NOW()),
  
  (@tenant_id, @empresa2, 'Obra', 'Setor de Obra', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Administrativo', 'Setor Administrativo', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Projetos', 'Setor de Projetos', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Qualidade', 'Setor de Qualidade', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Vendas', 'Setor de Vendas', NOW(), NOW()),
  
  (@tenant_id, @empresa3, 'Manutenção', 'Setor de Manutenção', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Administrativo', 'Setor Administrativo', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Almoxarifado', 'Setor de Almoxarifado', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Transporte', 'Setor de Transporte', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Logística', 'Setor de Logística', NOW(), NOW()),
  
  (@tenant_id, @empresa4, 'Transporte', 'Setor de Transporte', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Administrativo', 'Setor Administrativo', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Manutenção', 'Setor de Manutenção', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Logística', 'Setor de Logística', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Vendas', 'Setor de Vendas', NOW(), NOW()),
  
  (@tenant_id, @empresa5, 'Vendas', 'Setor de Vendas', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Administrativo', 'Setor Administrativo', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Estoque', 'Setor de Estoque', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Logística', 'Setor de Logística', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Atendimento', 'Setor de Atendimento', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Criar cargos para cada empresa
INSERT INTO cargos (tenantId, empresaId, nomeCargo, descricao, codigoCbo, createdAt, updatedAt) VALUES
  (@tenant_id, @empresa1, 'Pedreiro', 'Cargo de Pedreiro', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Carpinteiro', 'Cargo de Carpinteiro', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Eletricista', 'Cargo de Eletricista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Encanador', 'Cargo de Encanador', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Pintor', 'Cargo de Pintor', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Soldador', 'Cargo de Soldador', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Operador de Máquinas', 'Cargo de Operador de Máquinas', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Ajudante de Obra', 'Cargo de Ajudante de Obra', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Mestre de Obras', 'Cargo de Mestre de Obras', '000000', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Engenheiro Civil', 'Cargo de Engenheiro Civil', '000000', NOW(), NOW()),
  
  (@tenant_id, @empresa2, 'Engenheiro Civil', 'Cargo de Engenheiro Civil', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Arquiteto', 'Cargo de Arquiteto', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Técnico em Segurança', 'Cargo de Técnico em Segurança', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Auxiliar Administrativo', 'Cargo de Auxiliar Administrativo', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Gerente de Projetos', 'Cargo de Gerente de Projetos', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Desenhista', 'Cargo de Desenhista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Supervisor', 'Cargo de Supervisor', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Coordenador', 'Cargo de Coordenador', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Analista', 'Cargo de Analista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Assistente', 'Cargo de Assistente', '000000', NOW(), NOW()),
  
  (@tenant_id, @empresa3, 'Técnico em Manutenção', 'Cargo de Técnico em Manutenção', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Mecânico', 'Cargo de Mecânico', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Eletricista', 'Cargo de Eletricista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Auxiliar de Manutenção', 'Cargo de Auxiliar de Manutenção', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Supervisor de Manutenção', 'Cargo de Supervisor de Manutenção', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Auxiliar Administrativo', 'Cargo de Auxiliar Administrativo', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Estoquista', 'Cargo de Estoquista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Motorista', 'Cargo de Motorista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Ajudante', 'Cargo de Ajudante', '000000', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Gerente', 'Cargo de Gerente', '000000', NOW(), NOW()),
  
  (@tenant_id, @empresa4, 'Motorista', 'Cargo de Motorista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Ajudante de Motorista', 'Cargo de Ajudante de Motorista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Carregador', 'Cargo de Carregador', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Despachante', 'Cargo de Despachante', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Supervisor de Transporte', 'Cargo de Supervisor de Transporte', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Auxiliar Administrativo', 'Cargo de Auxiliar Administrativo', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Técnico em Logística', 'Cargo de Técnico em Logística', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Operador de Empilhadeira', 'Cargo de Operador de Empilhadeira', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Estoquista', 'Cargo de Estoquista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Gerente de Logística', 'Cargo de Gerente de Logística', '000000', NOW(), NOW()),
  
  (@tenant_id, @empresa5, 'Vendedor', 'Cargo de Vendedor', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Vendedor Externo', 'Cargo de Vendedor Externo', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Caixa', 'Cargo de Caixa', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Estoquista', 'Cargo de Estoquista', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Auxiliar de Vendas', 'Cargo de Auxiliar de Vendas', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Gerente de Vendas', 'Cargo de Gerente de Vendas', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Supervisor de Vendas', 'Cargo de Supervisor de Vendas', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Atendente', 'Cargo de Atendente', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Auxiliar Administrativo', 'Cargo de Auxiliar Administrativo', '000000', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Gerente Comercial', 'Cargo de Gerente Comercial', '000000', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Criar tipos de treinamentos
INSERT INTO tiposTreinamentos (tenantId, nomeTipoTreinamento, tipoNr, descricao, createdAt, updatedAt) VALUES
  (@tenant_id, 'NR-10 - Segurança em Instalações Elétricas', 'NR-10', 'Treinamento NR-10', NOW(), NOW()),
  (@tenant_id, 'NR-11 - Transporte de Materiais', 'NR-11', 'Treinamento NR-11', NOW(), NOW()),
  (@tenant_id, 'NR-12 - Segurança em Máquinas', 'NR-12', 'Treinamento NR-12', NOW(), NOW()),
  (@tenant_id, 'NR-18 - Condições de Trabalho na Construção', 'NR-18', 'Treinamento NR-18', NOW(), NOW()),
  (@tenant_id, 'NR-35 - Trabalho em Altura', 'NR-35', 'Treinamento NR-35', NOW(), NOW()),
  (@tenant_id, 'NR-33 - Espaço Confinado', 'NR-33', 'Treinamento NR-33', NOW(), NOW()),
  (@tenant_id, 'Primeiros Socorros', 'PS', 'Treinamento de Primeiros Socorros', NOW(), NOW()),
  (@tenant_id, 'Combate a Incêndio', 'CI', 'Treinamento de Combate a Incêndio', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Criar EPIs
INSERT INTO epis (tenantId, nomeEpi, ca, validade, descricao, createdAt, updatedAt) VALUES
  (@tenant_id, 'Capacete de Segurança', '123456', 365, 'EPI: Capacete de Segurança', NOW(), NOW()),
  (@tenant_id, 'Óculos de Proteção', '234567', 730, 'EPI: Óculos de Proteção', NOW(), NOW()),
  (@tenant_id, 'Protetor Auricular', '345678', 365, 'EPI: Protetor Auricular', NOW(), NOW()),
  (@tenant_id, 'Luvas de Segurança', '456789', 180, 'EPI: Luvas de Segurança', NOW(), NOW()),
  (@tenant_id, 'Botas de Segurança', '567890', 365, 'EPI: Botas de Segurança', NOW(), NOW()),
  (@tenant_id, 'Cinto de Segurança', '678901', 365, 'EPI: Cinto de Segurança', NOW(), NOW()),
  (@tenant_id, 'Máscara Respiratória', '789012', 180, 'EPI: Máscara Respiratória', NOW(), NOW()),
  (@tenant_id, 'Avental de Proteção', '890123', 365, 'EPI: Avental de Proteção', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Criar responsáveis técnicos
INSERT INTO responsaveis (tenantId, empresaId, nome, registroCrea, cargo, createdAt, updatedAt) VALUES
  (@tenant_id, @empresa1, 'João Silva Santos', 'CREA-123456-SP', 'Engenheiro de Segurança', NOW(), NOW()),
  (@tenant_id, @empresa1, 'Maria Oliveira Costa', 'CREA-234567-SP', 'Técnico em Segurança', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Pedro Alves Lima', 'CREA-345678-SP', 'Engenheiro de Segurança', NOW(), NOW()),
  (@tenant_id, @empresa2, 'Ana Paula Ferreira', 'CREA-456789-SP', 'Técnico em Segurança', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Carlos Roberto Souza', 'CREA-567890-SP', 'Engenheiro de Segurança', NOW(), NOW()),
  (@tenant_id, @empresa3, 'Juliana Martins Rocha', 'CREA-678901-SP', 'Técnico em Segurança', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Ricardo Barbosa Gomes', 'CREA-789012-SP', 'Engenheiro de Segurança', NOW(), NOW()),
  (@tenant_id, @empresa4, 'Fernanda Dias Ribeiro', 'CREA-890123-SP', 'Técnico em Segurança', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Thiago Carvalho Monteiro', 'CREA-901234-SP', 'Engenheiro de Segurança', NOW(), NOW()),
  (@tenant_id, @empresa5, 'Bruna Araujo Castro', 'CREA-012345-SP', 'Técnico em Segurança', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Criar colaboradores (máximo 20 por empresa)
-- Empresa 1
INSERT INTO colaboradores (
  tenantId, empresaId, nomeCompleto, cargoId, setorId, cpf, rg, pis,
  dataAdmissao, dataPrimeiroAso, validadeAso, status, createdAt, updatedAt
) 
SELECT 
  @tenant_id, @empresa1, nome, cargo_id, setor_id, cpf, rg, pis,
  data_admissao, data_aso, validade_aso, 'ativo', NOW(), NOW()
FROM (
  SELECT 'João Silva' as nome, (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Pedreiro' LIMIT 1) as cargo_id, (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1) as setor_id, '10000000001' as cpf, 'RG000000001' as rg, '10000000001' as pis, DATE_SUB(CURDATE(), INTERVAL 6 MONTH) as data_admissao, DATE_SUB(CURDATE(), INTERVAL 6 MONTH) as data_aso, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), INTERVAL 30 DAY) as validade_aso
  UNION ALL SELECT 'Maria Santos', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Carpinteiro' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000002', 'RG000000002', '10000000002', DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Pedro Oliveira', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Eletricista' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000003', 'RG000000003', '10000000003', DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Ana Costa', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Encanador' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000004', 'RG000000004', '10000000004', DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Carlos Souza', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Pintor' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000005', 'RG000000005', '10000000005', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Juliana Ferreira', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Soldador' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000006', 'RG000000006', '10000000006', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Roberto Alves', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Operador de Máquinas' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000007', 'RG000000007', '10000000007', DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Fernanda Lima', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Ajudante de Obra' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000008', 'RG000000008', '10000000008', DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Ricardo Martins', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Mestre de Obras' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000009', 'RG000000009', '10000000009', DATE_SUB(CURDATE(), INTERVAL 9 MONTH), DATE_SUB(CURDATE(), INTERVAL 9 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 9 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Patricia Rocha', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Engenheiro Civil' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Administrativo' LIMIT 1), '10000000010', 'RG000000010', '10000000010', DATE_SUB(CURDATE(), INTERVAL 10 MONTH), DATE_SUB(CURDATE(), INTERVAL 10 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Marcos Pereira', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Pedreiro' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000011', 'RG000000011', '10000000011', DATE_SUB(CURDATE(), INTERVAL 11 MONTH), DATE_SUB(CURDATE(), INTERVAL 11 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Camila Rodrigues', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Carpinteiro' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000012', 'RG000000012', '10000000012', DATE_SUB(CURDATE(), INTERVAL 12 MONTH), DATE_SUB(CURDATE(), INTERVAL 12 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Lucas Barbosa', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Eletricista' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000013', 'RG000000013', '10000000013', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Amanda Gomes', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Encanador' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000014', 'RG000000014', '10000000014', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Thiago Ribeiro', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Pintor' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000015', 'RG000000015', '10000000015', DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Bruna Carvalho', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Soldador' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000016', 'RG000000016', '10000000016', DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Felipe Araujo', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Operador de Máquinas' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000017', 'RG000000017', '10000000017', DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Larissa Dias', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Ajudante de Obra' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000018', 'RG000000018', '10000000018', DATE_SUB(CURDATE(), INTERVAL 6 MONTH), DATE_SUB(CURDATE(), INTERVAL 6 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Gabriel Monteiro', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Mestre de Obras' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Obra' LIMIT 1), '10000000019', 'RG000000019', '10000000019', DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Isabela Castro', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeCargo = 'Engenheiro Civil' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND nomeSetor = 'Administrativo' LIMIT 1), '10000000020', 'RG000000020', '10000000020', DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), INTERVAL 30 DAY)
) AS dados
WHERE NOT EXISTS (
  SELECT 1 FROM colaboradores WHERE tenantId = @tenant_id AND empresaId = @empresa1 AND cpf = dados.cpf
)
LIMIT 20;

-- Repetir para outras empresas (simplificado - você pode expandir)
-- Empresa 2 (10 colaboradores)
INSERT INTO colaboradores (tenantId, empresaId, nomeCompleto, cargoId, setorId, cpf, rg, pis, dataAdmissao, dataPrimeiroAso, validadeAso, status, createdAt, updatedAt)
SELECT @tenant_id, @empresa2, nome, cargo_id, setor_id, cpf, rg, pis, data_admissao, data_aso, validade_aso, 'ativo', NOW(), NOW()
FROM (
  SELECT 'João Silva' as nome, (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Engenheiro Civil' LIMIT 1) as cargo_id, (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Obra' LIMIT 1) as setor_id, '20000000001' as cpf, 'RG000000101' as rg, '20000000001' as pis, DATE_SUB(CURDATE(), INTERVAL 6 MONTH) as data_admissao, DATE_SUB(CURDATE(), INTERVAL 6 MONTH) as data_aso, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), INTERVAL 30 DAY) as validade_aso
  UNION ALL SELECT 'Maria Santos', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Arquiteto' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Projetos' LIMIT 1), '20000000002', 'RG000000102', '20000000002', DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Pedro Oliveira', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Técnico em Segurança' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Qualidade' LIMIT 1), '20000000003', 'RG000000103', '20000000003', DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Ana Costa', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Auxiliar Administrativo' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Administrativo' LIMIT 1), '20000000004', 'RG000000104', '20000000004', DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Carlos Souza', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Gerente de Projetos' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Projetos' LIMIT 1), '20000000005', 'RG000000105', '20000000005', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Juliana Ferreira', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Desenhista' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Projetos' LIMIT 1), '20000000006', 'RG000000106', '20000000006', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Roberto Alves', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Supervisor' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Obra' LIMIT 1), '20000000007', 'RG000000107', '20000000007', DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Fernanda Lima', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Coordenador' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Administrativo' LIMIT 1), '20000000008', 'RG000000108', '20000000008', DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Ricardo Martins', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Analista' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Projetos' LIMIT 1), '20000000009', 'RG000000109', '20000000009', DATE_SUB(CURDATE(), INTERVAL 9 MONTH), DATE_SUB(CURDATE(), INTERVAL 9 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 9 MONTH), INTERVAL 30 DAY)
  UNION ALL SELECT 'Patricia Rocha', (SELECT id FROM cargos WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeCargo = 'Assistente' LIMIT 1), (SELECT id FROM setores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND nomeSetor = 'Administrativo' LIMIT 1), '20000000010', 'RG000000110', '20000000010', DATE_SUB(CURDATE(), INTERVAL 10 MONTH), DATE_SUB(CURDATE(), INTERVAL 10 MONTH), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 MONTH), INTERVAL 30 DAY)
) AS dados
WHERE NOT EXISTS (SELECT 1 FROM colaboradores WHERE tenantId = @tenant_id AND empresaId = @empresa2 AND cpf = dados.cpf)
LIMIT 20;

-- Resumo final
SELECT 
  'Dados criados com sucesso!' AS mensagem,
  (SELECT COUNT(*) FROM empresas WHERE tenantId = @tenant_id) AS total_empresas,
  (SELECT COUNT(*) FROM colaboradores WHERE tenantId = @tenant_id) AS total_colaboradores,
  (SELECT COUNT(*) FROM cargos WHERE tenantId = @tenant_id) AS total_cargos,
  (SELECT COUNT(*) FROM setores WHERE tenantId = @tenant_id) AS total_setores,
  (SELECT COUNT(*) FROM tiposTreinamentos WHERE tenantId = @tenant_id) AS total_tipos_treinamentos,
  (SELECT COUNT(*) FROM epis WHERE tenantId = @tenant_id) AS total_epis,
  (SELECT COUNT(*) FROM responsaveis WHERE tenantId = @tenant_id) AS total_responsaveis;








