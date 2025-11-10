ALTER TABLE `colaboradores` ADD `dataNascimento` date;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `cidadeNascimento` varchar(255);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `estadoNascimento` varchar(2);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `tipoLogradouro` varchar(50);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `nomeLogradouro` varchar(255);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `numeroEndereco` varchar(20);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `complementoEndereco` varchar(255);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `cidadeEndereco` varchar(255);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `estadoEndereco` varchar(2);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `cep` varchar(10);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `fotoUrl` text;--> statement-breakpoint
ALTER TABLE `colaboradores` DROP COLUMN `endereco`;