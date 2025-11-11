/**
 * Script para executar migrações no ambiente de produção
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function runMigrations() {
  console.log("🔄 Executando migrações do banco de dados...\n");
  
  try {
    // Verifica se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }
    
    console.log("📋 Verificando conexão com banco...");
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    console.log("✅ Conexão estabelecida\n");
    
    // Executa migrações usando drizzle-kit
    console.log("🔄 Executando drizzle-kit push...");
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    try {
      const { stdout, stderr } = await execAsync("pnpm db:push");
      console.log(stdout);
      if (stderr) {
        console.warn("⚠️  Avisos:", stderr);
      }
      console.log("\n✅ Migrações executadas com sucesso!");
    } catch (error: any) {
      console.error("❌ Erro ao executar migrações:", error.message);
      if (error.stdout) console.log("Saída:", error.stdout);
      if (error.stderr) console.error("Erros:", error.stderr);
      throw error;
    }
    
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    process.exit(1);
  }
}

runMigrations();


