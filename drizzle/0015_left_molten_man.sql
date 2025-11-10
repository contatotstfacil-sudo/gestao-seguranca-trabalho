ALTER TABLE `modelosCertificados` ADD `conteudoProgramatico` text;--> statement-breakpoint
ALTER TABLE `modelosCertificados` ADD `tipoTreinamentoId` int;--> statement-breakpoint
ALTER TABLE `modelosCertificados` ADD `mostrarConteudoProgramatico` boolean DEFAULT true;