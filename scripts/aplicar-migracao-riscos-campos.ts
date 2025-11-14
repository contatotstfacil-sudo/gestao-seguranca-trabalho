import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { getDb } from "../server/db";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function aplicarMigracao() {
  console.log("========================================");
  console.log("  Aplicando Migração: Campos de Riscos");
  console.log("========================================\n");

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Ler o arquivo SQL
    const sqlPath = resolve(__dirname, "../drizzle/0027_add_campos_riscos_completos.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    
    console.log("SQL a ser executado:");
    console.log(sql);
    console.log("\n");

    // Executar o SQL
    const statements = sql.split(";").filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length > 0 && !trimmed.startsWith("--")) {
        try {
          await db.execute(trimmed);
          console.log("✓ Comando executado com sucesso");
        } catch (error: any) {
          // Ignorar erro se a coluna já existir
          if (error.code === "ER_DUP_FIELDNAME" || error.message?.includes("Duplicate column name") || error.message?.includes("already exists")) {
            console.log("⚠ Coluna já existe, ignorando...");
          } else {
            console.error("❌ Erro ao executar:", trimmed);
            throw error;
          }
        }
      }
    }

    console.log("\n========================================");
    console.log("  MIGRAÇÃO APLICADA COM SUCESSO!");
    console.log("========================================\n");

  } catch (error: any) {
    console.error("\n❌ ERRO AO APLICAR MIGRAÇÃO:");
    console.error(error);
    process.exit(1);
  }
}

aplicarMigracao();

