/**
 * Criar tabela asos no banco de dados
 */

import mysql from "mysql2/promise";

async function criarTabelaAsos() {
  console.log("🔄 Criando tabela asos...");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`asos\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`tenantId\` int NOT NULL,
        \`colaboradorId\` int NOT NULL,
        \`empresaId\` int NOT NULL,
        \`numeroAso\` varchar(100),
        \`tipoAso\` enum('admissional','periodico','retorno_trabalho','mudanca_funcao','demissional') NOT NULL,
        \`dataEmissao\` date NOT NULL,
        \`dataValidade\` date NOT NULL,
        \`medicoResponsavel\` varchar(255),
        \`clinicaMedica\` varchar(255),
        \`crmMedico\` varchar(50),
        \`apto\` enum('sim','nao','apto_com_restricoes') NOT NULL,
        \`restricoes\` text,
        \`observacoes\` text,
        \`anexoUrl\` varchar(500),
        \`status\` enum('ativo','vencido') NOT NULL DEFAULT 'ativo',
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`asos_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log("✅ Tabela asos criada com sucesso!");
    
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  } finally {
    await connection.end();
  }
}

criarTabelaAsos();























