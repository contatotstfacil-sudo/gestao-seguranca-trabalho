CREATE TABLE `asos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`empresaId` int NOT NULL,
	`numeroAso` varchar(100),
	`tipoAso` enum('admissional','periodico','retorno_trabalho','mudanca_funcao','demissional') NOT NULL,
	`dataEmissao` date NOT NULL,
	`dataValidade` date NOT NULL,
	`medicoResponsavel` varchar(255),
	`clinicaMedica` varchar(255),
	`crmMedico` varchar(50),
	`apto` enum('sim','nao','apto_com_restricoes') NOT NULL,
	`restricoes` text,
	`observacoes` text,
	`anexoUrl` varchar(500),
	`status` enum('ativo','vencido') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(100) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`modulo` varchar(100) NOT NULL,
	`acao` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissoes_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `permissoes_usuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`empresas_view` boolean NOT NULL DEFAULT false,
	`empresas_add` boolean NOT NULL DEFAULT false,
	`empresas_edit` boolean NOT NULL DEFAULT false,
	`empresas_delete` boolean NOT NULL DEFAULT false,
	`empregados_view` boolean NOT NULL DEFAULT false,
	`empregados_add` boolean NOT NULL DEFAULT false,
	`empregados_edit` boolean NOT NULL DEFAULT false,
	`empregados_delete` boolean NOT NULL DEFAULT false,
	`fichas_view` boolean NOT NULL DEFAULT false,
	`fichas_add` boolean NOT NULL DEFAULT false,
	`fichas_edit` boolean NOT NULL DEFAULT false,
	`fichas_delete` boolean NOT NULL DEFAULT false,
	`os_view` boolean NOT NULL DEFAULT false,
	`os_add` boolean NOT NULL DEFAULT false,
	`os_edit` boolean NOT NULL DEFAULT false,
	`os_delete` boolean NOT NULL DEFAULT false,
	`treinamentos_view` boolean NOT NULL DEFAULT false,
	`treinamentos_add` boolean NOT NULL DEFAULT false,
	`treinamentos_edit` boolean NOT NULL DEFAULT false,
	`treinamentos_delete` boolean NOT NULL DEFAULT false,
	`certificados_view` boolean NOT NULL DEFAULT false,
	`certificados_add` boolean NOT NULL DEFAULT false,
	`certificados_edit` boolean NOT NULL DEFAULT false,
	`certificados_delete` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissoes_usuarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`plano` enum('basico','profissional') NOT NULL,
	`status` enum('ativo','suspenso','cancelado') NOT NULL DEFAULT 'ativo',
	`dataInicio` date NOT NULL,
	`dataFim` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPermissoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissaoId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userPermissoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `empresas` DROP INDEX `empresas_cnpj_unique`;--> statement-breakpoint
ALTER TABLE `ordensServico` DROP INDEX `ordensServico_numeroOrdem_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','tenant_admin','user','admin','gestor','tecnico') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `cargoRiscos` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cargoSetores` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cargoTreinamentos` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cargos` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `certificadosEmitidos` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `empresas` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `epis` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `fichasEpiEmitidas` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `modelosCertificados` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `modelosOrdemServico` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `obras` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `responsaveis` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `riscosOcupacionais` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `setores` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tiposTreinamentos` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `treinamentos` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `cnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);