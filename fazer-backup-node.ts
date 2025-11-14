/**
 * Script para fazer backup do banco de dados MySQL usando Node.js
 * Sobrescreve o backup anterior (backup.sql)
 */

import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

config({ path: envPath });
config({ path: envLocalPath, override: true });

async function fazerBackup() {
  console.log("=== BACKUP DO BANCO DE DADOS ===\n");

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("ERRO: DATABASE_URL não encontrado!");
    console.error("Configure DATABASE_URL no arquivo .env ou .env.local");
    process.exit(1);
  }

  console.log("DATABASE_URL encontrado");

  // Extrair informações da URL
  // Formato: mysql://usuario:senha@host:porta/banco
  const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    console.error("ERRO: Formato de DATABASE_URL inválido!");
    console.error("Formato esperado: mysql://usuario:senha@host:porta/banco");
    process.exit(1);
  }

  const [, usuario, senha, host, porta, bancoComQuery] = urlMatch;
  const banco = bancoComQuery.split("?")[0]; // Remove query string se houver

  console.log(`Usuário: ${usuario}`);
  console.log(`Host: ${host}`);
  console.log(`Porta: ${porta}`);
  console.log(`Banco: ${banco}\n`);

  // Nome do arquivo de backup (será sobrescrito)
  const backupFile = resolve(process.cwd(), "backup.sql");
  
  console.log("Criando backup...");
  console.log(`Arquivo: ${backupFile}\n`);

  let connection: mysql.Connection | null = null;

  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host,
      port: parseInt(porta),
      user: usuario,
      password: senha,
      database: banco,
    });

    console.log("Conectado ao banco de dados\n");

    // Obter lista de tabelas
    const [tables] = await connection.execute<mysql.RowDataPacket[]>(
      "SHOW TABLES"
    );

    const tableKey = `Tables_in_${banco}`;
    const tableNames = tables.map((row) => row[tableKey]);

    console.log(`Encontradas ${tableNames.length} tabelas\n`);

    // Iniciar arquivo de backup
    let backupContent = `-- Backup do banco de dados: ${banco}\n`;
    backupContent += `-- Data: ${new Date().toISOString()}\n`;
    backupContent += `-- Gerado automaticamente\n\n`;
    backupContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    // Fazer backup de cada tabela
    for (const tableName of tableNames) {
      console.log(`Backup da tabela: ${tableName}...`);

      // Obter estrutura da tabela
      const [createTable] = await connection.execute<mysql.RowDataPacket[]>(
        `SHOW CREATE TABLE \`${tableName}\``
      );

      backupContent += `-- Estrutura da tabela: ${tableName}\n`;
      backupContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      backupContent += `${createTable[0]["Create Table"]};\n\n`;

      // Obter dados da tabela
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT * FROM \`${tableName}\``
      );

      if (rows.length > 0) {
        backupContent += `-- Dados da tabela: ${tableName}\n`;
        backupContent += `LOCK TABLES \`${tableName}\` WRITE;\n`;

        // Obter nomes das colunas
        const columns = Object.keys(rows[0]);
        const columnsStr = columns.map((c) => `\`${c}\``).join(", ");

        // Inserir dados em lotes
        const batchSize = 1000;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const values = batch.map((row) => {
            const vals = columns.map((col) => {
              const val = row[col];
              if (val === null) return "NULL";
              if (typeof val === "string") {
                return `'${val.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
              }
              return val;
            });
            return `(${vals.join(", ")})`;
          });

          backupContent += `INSERT INTO \`${tableName}\` (${columnsStr}) VALUES\n`;
          backupContent += `${values.join(",\n")};\n\n`;
        }

        backupContent += `UNLOCK TABLES;\n\n`;
      } else {
        backupContent += `-- Tabela ${tableName} está vazia\n\n`;
      }
    }

    backupContent += `SET FOREIGN_KEY_CHECKS=1;\n`;

    // Salvar arquivo (sobrescreve o anterior)
    fs.writeFileSync(backupFile, backupContent, "utf-8");

    const fileSize = fs.statSync(backupFile).size / (1024 * 1024);

    console.log("\n=== BACKUP CONCLUÍDO COM SUCESSO ===");
    console.log(`Arquivo: ${backupFile}`);
    console.log(`Tamanho: ${fileSize.toFixed(2)} MB`);
    console.log("\nO backup anterior foi sobrescrito.");
  } catch (error: any) {
    console.error("\nERRO ao criar backup:");
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fazerBackup().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});





