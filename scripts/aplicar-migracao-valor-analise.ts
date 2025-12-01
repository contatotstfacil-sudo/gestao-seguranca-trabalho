import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

import { getDb } from "../server/db";

async function aplicarMigracaoValorAnalise() {
  try {
    console.log("=== Aplicando migração do campo valorAnaliseQuantitativa ===");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }

    try {
      await db.execute("ALTER TABLE cargoRiscos ADD COLUMN valorAnaliseQuantitativa varchar(200)");
      console.log("✅ Campo valorAnaliseQuantitativa adicionado com sucesso!");
    } catch (error: any) {
      // Ignorar erro se a coluna já existir
      if (error.message?.includes("Duplicate column name") || error.message?.includes("already exists")) {
        console.log("⚠️ Campo já existe, pulando...");
      } else {
        throw error;
      }
    }

    console.log("✅ Migração aplicada com sucesso!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro ao aplicar migração:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

aplicarMigracaoValorAnalise();











