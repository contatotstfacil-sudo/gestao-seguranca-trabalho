CREATE TABLE `ordensServico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroOrdem` varchar(50) NOT NULL,
	`empresaId` int NOT NULL,
	`colaboradorId` int,
	`obraId` int,
	`descricaoServico` text NOT NULL,
	`tipoServico` varchar(255),
	`prioridade` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`status` enum('aberta','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'aberta',
	`dataEmissao` date NOT NULL,
	`dataPrevistaConclusao` date,
	`dataConclusao` date,
	`observacoes` text,
	`responsavelEmissao` varchar(255),
	`valorServico` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordensServico_id` PRIMARY KEY(`id`),
	CONSTRAINT `ordensServico_numeroOrdem_unique` UNIQUE(`numeroOrdem`)
);



