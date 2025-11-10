CREATE TABLE `setores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeSetor` varchar(255) NOT NULL,
	`descricao` text,
	`empresaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `setores_id` PRIMARY KEY(`id`)
);
