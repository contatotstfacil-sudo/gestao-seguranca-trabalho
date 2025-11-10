ALTER TABLE `colaboradores` ADD `dataPrimeiroAso` date;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `rg` varchar(20);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `pis` varchar(20);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `endereco` text;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `telefonePrincipal` varchar(20);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `telefoneRecado` varchar(20);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `nomePessoaRecado` varchar(255);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `grauParentesco` varchar(50);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `observacoes` text;