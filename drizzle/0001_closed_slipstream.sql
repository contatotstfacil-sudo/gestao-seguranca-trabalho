CREATE TABLE `colaboradores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeCompleto` varchar(255) NOT NULL,
	`funcao` varchar(255),
	`empresaId` int NOT NULL,
	`obraId` int,
	`dataAdmissao` date,
	`validadeAso` date,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colaboradores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `empresas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`razaoSocial` varchar(255) NOT NULL,
	`cnpj` varchar(18) NOT NULL,
	`responsavelTecnico` varchar(255),
	`emailContato` varchar(320),
	`status` enum('ativa','inativa') NOT NULL DEFAULT 'ativa',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `empresas_id` PRIMARY KEY(`id`),
	CONSTRAINT `empresas_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `epis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeEquipamento` varchar(255) NOT NULL,
	`colaboradorId` int NOT NULL,
	`empresaId` int NOT NULL,
	`dataEntrega` date,
	`dataValidade` date,
	`status` enum('em_uso','vencido','devolvido') NOT NULL DEFAULT 'em_uso',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeObra` varchar(255) NOT NULL,
	`endereco` text,
	`empresaId` int NOT NULL,
	`dataInicio` date,
	`dataFim` date,
	`status` enum('ativa','concluida') NOT NULL DEFAULT 'ativa',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treinamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeTreinamento` varchar(255) NOT NULL,
	`tipoNr` varchar(50),
	`colaboradorId` int NOT NULL,
	`empresaId` int NOT NULL,
	`dataRealizacao` date,
	`dataValidade` date,
	`status` enum('valido','vencido','a_vencer') NOT NULL DEFAULT 'valido',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treinamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','gestor','tecnico') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `empresaId` int;