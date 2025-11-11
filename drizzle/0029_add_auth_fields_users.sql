-- Adiciona campos de autenticação tradicional à tabela users
ALTER TABLE `users` 
  MODIFY COLUMN `openId` varchar(64) NULL,
  ADD COLUMN `cpf` varchar(14) NULL UNIQUE AFTER `email`,
  ADD COLUMN `cnpj` varchar(18) NULL UNIQUE AFTER `cpf`,
  ADD COLUMN `passwordHash` varchar(255) NULL AFTER `cnpj`;



