/**
 * Script para aplicar migração de planos manualmente
 */

import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

async function aplicarMigracao() {
  console.log("🔄 Aplicando migração de planos e assinaturas...\n");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  try {
    // Conectar ao banco
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("✅ Conectado ao banco de dados\n");

    // Ler arquivo SQL
    const sqlFile = readFileSync("drizzle/0023_last_photon.sql", "utf-8");
    
    // Dividir em comandos individuais
    const commands = sqlFile
      .split("--> statement-breakpoint")
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith("--"));

    console.log(`📋 Executando ${commands.length} comando(s) SQL...\n`);

    for (const command of commands) {
      if (command.trim().length === 0) continue;
      
      try {
        await connection.execute(command);
        // Extrair nome da tabela do comando
        const tableMatch = command.match(/CREATE TABLE `(\w+)`/);
        if (tableMatch) {
          console.log(`   ✅ Tabela '${tableMatch[1]}' criada`);
        } else if (command.includes("ALTER TABLE")) {
          console.log(`   ✅ Alteração aplicada`);
        }
      } catch (error: any) {
        // Ignorar erro se tabela já existe
        if (error.code === "ER_TABLE_EXISTS_ERROR" || error.code === "ER_DUP_FIELDNAME") {
          console.log(`   ⚠️  Tabela/campo já existe, pulando...`);
        } else {
          throw error;
        }
      }
    }

    await connection.end();
    console.log("\n✅ Migração aplicada com sucesso!\n");

  } catch (error: any) {
    console.error("\n❌ Erro ao aplicar migração:", error.message);
    if (error.sql) {
      console.error("SQL:", error.sql);
    }
    throw error;
  }
}

// Executar
aplicarMigracao()
  .then(() => {
    console.log("🎉 Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });


















