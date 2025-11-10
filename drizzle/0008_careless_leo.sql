CREATE TABLE `tiposTreinamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeTreinamento` varchar(255) NOT NULL,
	`descricao` text,
	`tipoNr` varchar(50),
	`validadeEmMeses` int,
	`empresaId` int,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiposTreinamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cargoTreinamentos` ADD `tipoTreinamentoId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cargoTreinamentos` DROP COLUMN `tipoNr`;--> statement-breakpoint
ALTER TABLE `cargoTreinamentos` DROP COLUMN `nomeTreinamento`;