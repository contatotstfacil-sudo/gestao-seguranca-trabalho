/**
 * Script para criar usuário administrador em produção
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function createAdmin() {
  console.log("👤 Criando usuário administrador...\n");
  
  try {
    // Verifica se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }
    
    console.log("📋 Conectando ao banco de dados...");
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    console.log("✅ Conexão estabelecida\n");
    
    // Importa funções necessárias
    const bcrypt = (await import("bcryptjs")).default;
    const { getUserByIdentifier, createUser } = await import("../server/db");
    const { normalizeCPF } = await import("../server/utils/validation");
    
    // Dados do admin
    const adminCPF = "38099529820";
    const adminPassword = "G476589496i@";
    const normalizedCPF = normalizeCPF(adminCPF);
    
    // Verifica se admin já existe
    console.log("🔍 Verificando se admin já existe...");
    const existingAdmin = await getUserByIdentifier(normalizedCPF);
    
    if (existingAdmin) {
      console.log("⚠️  Admin já existe! ID:", existingAdmin.id);
      console.log("💡 Para redefinir senha, use o script de reset de senha.");
      process.exit(0);
    }
    
    // Cria hash da senha
    console.log("🔐 Gerando hash da senha...");
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Cria usuário admin
    console.log("👤 Criando usuário...");
    const newAdmin = await createUser({
      name: "Administrador",
      cpf: normalizedCPF,
      passwordHash,
      role: "admin",
      openId: `local-${Date.now()}`,
      empresaId: null,
    });
    
    console.log("\n✅ Administrador criado com sucesso!");
    console.log("📋 Detalhes:");
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Nome: ${newAdmin.name}`);
    console.log(`   CPF: ${normalizedCPF}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log("\n🔑 Credenciais de acesso:");
    console.log(`   CPF: ${adminCPF}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!");
    
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

createAdmin();


