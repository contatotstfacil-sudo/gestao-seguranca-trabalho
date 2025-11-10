CREATE TABLE `fichasEpiEmitidas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `empresaId` int NOT NULL,
  `colaboradorId` int NOT NULL,
  `nomeArquivo` varchar(255) NOT NULL,
  `caminhoArquivo` varchar(500),
  `urlArquivo` varchar(500),
  `dataEmissao` timestamp NOT NULL DEFAULT (now()),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fichasEpiEmitidas_id` PRIMARY KEY(`id`)
);



