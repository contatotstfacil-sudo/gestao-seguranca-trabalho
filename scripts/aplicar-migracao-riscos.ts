import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

import { getDb } from "../server/db";

async function aplicarMigracaoRiscos() {
  try {
    console.log("=== Aplicando migração de campos de riscos ===");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }

    const migracaoPath = resolve(process.cwd(), "drizzle", "0027_add_campos_riscos_completos.sql");
    const sql = readFileSync(migracaoPath, "utf-8");
    
    // Dividir em comandos individuais
    const comandos = sql
      .split(";")
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith("--"));

    console.log(`\nExecutando ${comandos.length} comando(s)...\n`);

    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i];
      if (!comando) continue;
      
      try {
        console.log(`[${i + 1}/${comandos.length}] Executando: ${comando.substring(0, 60)}...`);
        await db.execute(comando);
        console.log(`✅ Comando ${i + 1} executado com sucesso\n`);
      } catch (error: any) {
        // Ignorar erro se a coluna já existir
        if (error.message?.includes("Duplicate column name") || error.message?.includes("already exists")) {
          console.log(`⚠️ Coluna já existe, pulando...\n`);
        } else {
          throw error;
        }
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

aplicarMigracaoRiscos();

