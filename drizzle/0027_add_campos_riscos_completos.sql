-- Adicionar novos campos à tabela cargoRiscos para tabela completa de riscos ocupacionais
-- O script de migração trata erros de coluna duplicada automaticamente
ALTER TABLE `cargoRiscos` ADD COLUMN `fonteGeradora` varchar(500);
ALTER TABLE `cargoRiscos` ADD COLUMN `tipo` varchar(100);
ALTER TABLE `cargoRiscos` ADD COLUMN `meioPropagacao` varchar(500);
ALTER TABLE `cargoRiscos` ADD COLUMN `meioContato` varchar(500);
ALTER TABLE `cargoRiscos` ADD COLUMN `possiveisDanosSaude` text;
ALTER TABLE `cargoRiscos` ADD COLUMN `tipoAnalise` varchar(100);
ALTER TABLE `cargoRiscos` ADD COLUMN `gradacaoEfeitos` varchar(50);
ALTER TABLE `cargoRiscos` ADD COLUMN `gradacaoExposicao` varchar(50);

