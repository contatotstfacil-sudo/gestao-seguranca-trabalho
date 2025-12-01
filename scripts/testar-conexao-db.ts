import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath, override: true });

async function testarConexao() {
  console.log("🔍 Testando configuração do banco de dados...\n");
  
  // Verificar DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não encontrada!");
    console.log("\n📝 Configure no arquivo .env.local:");
    console.log("   DATABASE_URL=mysql://usuario:senha@host:porta/banco");
    console.log("\n   Exemplo:");
    console.log("   DATABASE_URL=mysql://root:senha123@localhost:3306/sst");
    process.exit(1);
  }
  
  console.log("✅ DATABASE_URL encontrada");
  console.log(`   URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`); // Ocultar senha
  
  // Verificar formato
  if (!dbUrl.startsWith("mysql://")) {
    console.error("\n❌ Formato inválido! Deve começar com 'mysql://'");
    console.log("   Formato correto: mysql://usuario:senha@host:porta/banco");
    process.exit(1);
  }
  
  console.log("✅ Formato válido\n");
  
  // Testar conexão
  console.log("🔌 Testando conexão com banco de dados...");
  try {
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Não foi possível conectar ao banco");
    }
    
    // Testar query simples
    await db.execute("SELECT 1 as test");
    console.log("✅ Conexão estabelecida com sucesso!");
    console.log("✅ Banco de dados está acessível\n");
    
    // Verificar se a tabela cargosCbo existe
    try {
      await db.execute("SELECT 1 FROM cargosCbo LIMIT 1");
      console.log("✅ Tabela 'cargosCbo' existe");
      
      // Contar registros
      const result = await db.execute("SELECT COUNT(*) as total FROM cargosCbo");
      const total = (result as any)[0]?.[0]?.total || 0;
      console.log(`📊 Total de CBOs no banco: ${total}`);
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.message?.includes("Unknown table")) {
        console.log("⚠️  Tabela 'cargosCbo' não existe");
        console.log("   Execute: pnpm migrate:cargos-cbo");
      } else {
        throw error;
      }
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erro ao conectar:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Verifique se:");
      console.log("   - MySQL está rodando");
      console.log("   - Host e porta estão corretos");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Verifique se:");
      console.log("   - Usuário e senha estão corretos");
      console.log("   - Usuário tem permissão para acessar o banco");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n💡 Verifique se:");
      console.log("   - O banco de dados existe");
      console.log("   - O nome do banco está correto na URL");
    }
    process.exit(1);
  }
}

testarConexao();











