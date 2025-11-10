CREATE TABLE `cargoRiscos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cargoId` int NOT NULL,
	`riscoOcupacionalId` int NOT NULL,
	`tipoAgente` varchar(255),
	`descricaoRiscos` text,
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cargoRiscos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `modelosOrdemServico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`htmlTemplate` text,
	`empresaId` int,
	`padrao` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modelosOrdemServico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`tipoRisco` varchar(255),
	`nrRelacionada` varchar(50),
	`acaoCorretiva` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordensServico_id` PRIMARY KEY(`id`),
	CONSTRAINT `ordensServico_numeroOrdem_unique` UNIQUE(`numeroOrdem`)
);
--> statement-breakpoint
CREATE TABLE `riscosOcupacionais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeRisco` varchar(255) NOT NULL,
	`descricao` text,
	`tipoRisco` enum('fisico','quimico','biologico','ergonomico','mecanico') NOT NULL,
	`codigo` varchar(50),
	`empresaId` int,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riscosOcupacionais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tiposEpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipoEpi` varchar(255) NOT NULL,
	`caNumero` varchar(50),
	`fabricante` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiposEpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `epis` ADD `tipoEpiId` int;--> statement-breakpoint
ALTER TABLE `epis` ADD `quantidade` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `epis` ADD `caNumero` varchar(50);