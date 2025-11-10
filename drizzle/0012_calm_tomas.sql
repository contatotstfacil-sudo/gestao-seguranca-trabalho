CREATE TABLE `cargoSetores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cargoId` int NOT NULL,
	`setorId` int NOT NULL,
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cargoSetores_id` PRIMARY KEY(`id`)
);
