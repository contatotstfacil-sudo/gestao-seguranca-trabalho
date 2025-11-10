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

CREATE TABLE `cargoRiscos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cargoId` int NOT NULL,
	`riscoOcupacionalId` int NOT NULL,
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cargoRiscos_id` PRIMARY KEY(`id`)
);

