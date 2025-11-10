CREATE TABLE `cargoTreinamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cargoId` int NOT NULL,
	`tipoNr` varchar(50) NOT NULL,
	`nomeTreinamento` varchar(255) NOT NULL,
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cargoTreinamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cargos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeCargo` varchar(255) NOT NULL,
	`descricao` text,
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cargos_id` PRIMARY KEY(`id`)
);
