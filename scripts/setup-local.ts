/**
 * Script para configurar ambiente local automaticamente
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, writeFileSync, readFileSync } from "fs";

const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

async function setupLocal() {
  console.log("🔧 Configurando ambiente local...\n");

  // Verificar se .env.local existe
  if (!existsSync(envLocalPath)) {
    console.log("📝 Criando arquivo .env.local...");
    
    const defaultEnvLocal = `# Configuração Local - Desenvolvimento
# Este arquivo não é commitado (está no .gitignore)

# Banco de Dados Local
DATABASE_URL=mysql://root:senha@localhost:3306/sst

# Ambiente
NODE_ENV=development
PORT=3000

# Segurança (chaves locais - diferentes das de produção)
JWT_SECRET=chave-local-desenvolvimento-123
COOKIE_SECRET=chave-local-cookie-123
ENCRYPTION_KEY=chave-local-criptografia-123

# CORS - Permitir localhost
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# OAuth (opcional)
VITE_USE_TRADITIONAL_LOGIN=1
`;

    writeFileSync(envLocalPath, defaultEnvLocal, "utf-8");
    console.log("✅ Arquivo .env.local criado!\n");
  } else {
    console.log("✅ Arquivo .env.local já existe\n");
  }

  // Carregar variáveis
  config({ path: envPath });
  config({ path: envLocalPath, override: true });

  // Verificar DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("senha")) {
    console.log("⚠️  ATENÇÃO: Configure sua DATABASE_URL no arquivo .env.local");
    console.log("   Formato: mysql://usuario:senha@host:porta/banco\n");
  }

  // Testar conexão com banco
  console.log("🔍 Testando conexão com banco de dados...");
  try {
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (db) {
      await db.execute("SELECT 1");
      console.log("✅ Conexão com banco de dados OK\n");
    } else {
      console.log("❌ Não foi possível conectar ao banco de dados\n");
      console.log("   Verifique se:");
      console.log("   - MySQL está rodando");
      console.log("   - DATABASE_URL está correta no .env.local");
      console.log("   - Usuário e senha estão corretos\n");
    }
  } catch (error: any) {
    console.log("❌ Erro ao conectar:", error.message);
    console.log("\n   Verifique se MySQL está rodando e DATABASE_URL está correta\n");
  }

  console.log("📋 Configuração atual:");
  console.log(`   DATABASE_URL: ${dbUrl ? dbUrl.replace(/:[^:@]+@/, ":****@") : "não configurada"}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "não configurado"}`);
  console.log(`   PORT: ${process.env.PORT || "3000"}`);
  console.log(`   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || "não configurado"}\n`);

  console.log("✅ Configuração local concluída!");
  console.log("▶️  Para iniciar o servidor local, execute: pnpm dev\n");
}

setupLocal().catch(console.error);

