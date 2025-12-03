import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function aplicarMigracao() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada. Configure e rode novamente.");
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("🔄 Aplicando migração: criar tabela cargosCbo...\n");

    const sqlFile = resolve(__dirname, "../drizzle/0028_create_cargos_cbo.sql");
    const sql = await readFile(sqlFile, "utf-8");

    // Dividir por statement-breakpoint ou ponto e vírgula
    const statements = sql
      .split(/;[\s]*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim().length > 0) {
        try {
          await connection.execute(statement);
          console.log("✅ Comando executado com sucesso");
        } catch (error: any) {
          // Ignorar erro se a tabela já existir
          if (
            error.code === "ER_TABLE_EXISTS_ERROR" ||
            error.message?.includes("already exists") ||
            error.message?.includes("Duplicate table")
          ) {
            console.log("⚠️  Tabela já existe, ignorando...");
          } else {
            console.error("❌ Erro ao executar:", statement.substring(0, 100));
            throw error;
          }
        }
      }
    }

    console.log("\n✨ Migração aplicada com sucesso!");
    
    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro na migração:", error);
    process.exit(1);
  }
}

aplicarMigracao();


















