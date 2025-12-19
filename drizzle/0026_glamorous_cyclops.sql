ALTER TABLE `tenants` MODIFY COLUMN `plano` enum('bronze','prata','ouro','diamante') NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `tenants` ADD `telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `tenants` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `tenants` ADD `cnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `tenants` ADD `valorPlano` varchar(20);--> statement-breakpoint
ALTER TABLE `tenants` ADD `dataUltimoPagamento` date;--> statement-breakpoint
ALTER TABLE `tenants` ADD `dataProximoPagamento` date;--> statement-breakpoint
ALTER TABLE `tenants` ADD `periodicidade` enum('mensal','trimestral','semestral','anual') DEFAULT 'mensal';--> statement-breakpoint
ALTER TABLE `tenants` ADD `statusPagamento` enum('pago','pendente','atrasado','cancelado') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `tenants` ADD `observacoes` text;