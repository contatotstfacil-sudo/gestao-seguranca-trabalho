CREATE TABLE `cargosCbo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoCbo` varchar(20) NOT NULL,
	`nomeCargo` varchar(255) NOT NULL,
	`descricao` text,
	`familiaOcupacional` varchar(255),
	`sinonimia` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cargosCbo_id` PRIMARY KEY(`id`),
	CONSTRAINT `cargosCbo_codigoCbo_unique` UNIQUE(`codigoCbo`)
);
--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `fonteGeradora` varchar(500);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `tipo` varchar(100);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `meioPropagacao` varchar(500);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `meioContato` varchar(500);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `possiveisDanosSaude` text;--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `tipoAnalise` varchar(100);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `valorAnaliseQuantitativa` varchar(200);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `gradacaoEfeitos` varchar(50);--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `gradacaoExposicao` varchar(50);--> statement-breakpoint
ALTER TABLE `cargos` ADD `codigoCbo` varchar(20);