CREATE TABLE `certificadosEmitidos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modeloCertificadoId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`responsavelId` int,
	`nomeColaborador` varchar(255) NOT NULL,
	`rgColaborador` varchar(50),
	`nomeEmpresa` varchar(255),
	`cnpjEmpresa` varchar(20),
	`datasRealizacao` text,
	`htmlGerado` text NOT NULL,
	`dataEmissao` timestamp NOT NULL DEFAULT (now()),
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificadosEmitidos_id` PRIMARY KEY(`id`)
);
