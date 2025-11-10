-- Adicionar campos cidade e uf na tabela ordensServico
ALTER TABLE `ordensServico` ADD COLUMN `cidade` varchar(255) NULL;
ALTER TABLE `ordensServico` ADD COLUMN `uf` varchar(2) NULL;


