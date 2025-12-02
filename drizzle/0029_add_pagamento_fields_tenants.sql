-- Adicionar campos de pagamento e contato à tabela tenants
ALTER TABLE `tenants` 
  ADD COLUMN `email` varchar(320) NULL AFTER `nome`,
  ADD COLUMN `telefone` varchar(20) NULL AFTER `email`,
  ADD COLUMN `cpf` varchar(14) NULL AFTER `telefone`,
  ADD COLUMN `cnpj` varchar(18) NULL AFTER `cpf`,
  ADD COLUMN `valorPlano` varchar(20) NULL AFTER `plano`,
  ADD COLUMN `dataUltimoPagamento` date NULL AFTER `dataFim`,
  ADD COLUMN `dataProximoPagamento` date NULL AFTER `dataUltimoPagamento`,
  ADD COLUMN `periodicidade` enum('mensal','trimestral','semestral','anual') NOT NULL DEFAULT 'mensal' AFTER `dataProximoPagamento`,
  ADD COLUMN `statusPagamento` enum('pago','pendente','atrasado','cancelado') NOT NULL DEFAULT 'pendente' AFTER `periodicidade`,
  ADD COLUMN `observacoes` text NULL AFTER `statusPagamento`;

-- Atualizar enum de planos para incluir os novos planos
ALTER TABLE `tenants` 
  MODIFY COLUMN `plano` enum('bronze','prata','ouro','diamante') NOT NULL;




