-- Criar tabela tiposEpis
CREATE TABLE IF NOT EXISTS `tiposEpis` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tipoEpi` varchar(255) NOT NULL,
  `caNumero` varchar(50),
  `fabricante` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tiposEpis_id` PRIMARY KEY(`id`)
);

-- Adicionar campo tipoEpiId na tabela epis
ALTER TABLE `epis` ADD COLUMN `tipoEpiId` int;



