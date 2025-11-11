/**
 * Script de teste para verificar se o servidor inicia corretamente
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local primeiro (prioridade), depois .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

console.log("🔍 Carregando variáveis de ambiente...");
config({ path: envPath });
config({ path: envLocalPath, override: true });

console.log("📋 Variáveis carregadas:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "não definido"}`);
console.log(`   PORT: ${process.env.PORT || "3000"}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "configurado" : "não configurado"}`);
console.log("");

console.log("🚀 Tentando importar servidor...");
try {
  const serverModule = await import("./server/_core/index.js");
  console.log("✅ Servidor importado com sucesso");
} catch (error: any) {
  console.error("❌ Erro ao importar servidor:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}

