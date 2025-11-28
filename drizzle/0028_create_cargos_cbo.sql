-- Criar tabela cargosCbo para armazenar cargos da Classificação Brasileira de Ocupações
CREATE TABLE IF NOT EXISTS `cargosCbo` (
  `id` int AUTO_INCREMENT NOT NULL,
  `codigoCbo` varchar(20) NOT NULL,
  `nomeCargo` varchar(255) NOT NULL,
  `descricao` text,
  `familiaOcupacional` varchar(255),
  `sinonimia` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `cargosCbo_id` PRIMARY KEY(`id`),
  CONSTRAINT `cargosCbo_codigoCbo_unique` UNIQUE(`codigoCbo`)
);










