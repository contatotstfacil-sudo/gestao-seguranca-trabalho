/**
 * Script para verificar se Ana Paula foi criada corretamente
 * 
 * Uso: npx tsx scripts/verificar-ana-paula.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carrega variáveis de ambiente
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function verificarAnaPaula() {
  console.log("🔍 Verificando cadastro de Ana Paula...\n");
  
  try {
    // Verifica se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada. Configure no arquivo .env");
    }
    
    if (process.env.DATABASE_URL.startsWith("postgresql://")) {
      throw new Error("DATABASE_URL está configurada como PostgreSQL, mas o sistema usa MySQL.");
    }
    
    console.log("📋 Conectando ao banco de dados...");
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    console.log("✅ Conexão estabelecida\n");
    
    // Importa funções necessárias
    const { getUserByIdentifier } = await import("../server/db");
    const { normalizeCPF } = await import("../server/utils/validation");
    const { tenants, users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const email = "ana.paula@consultoriasst.com.br";
    const cpf = "55566677788";
    const normalizedCPF = normalizeCPF(cpf);
    
    console.log("🔍 Buscando usuário...");
    console.log(`   Email: ${email}`);
    console.log(`   CPF: ${normalizedCPF}\n`);
    
    // Busca por email
    let user = await getUserByIdentifier(email);
    
    // Se não encontrou por email, tenta por CPF
    if (!user) {
      user = await getUserByIdentifier(normalizedCPF);
    }
    
    if (!user) {
      console.log("❌ USUÁRIO NÃO ENCONTRADO!");
      console.log("\n💡 Execute o script SQL para criar:");
      console.log("   scripts/criar-ana-paula-sql.sql");
      process.exit(1);
    }
    
    console.log("✅ Usuário encontrado!");
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email || "N/A"}`);
    console.log(`   CPF: ${user.cpf || "N/A"}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   TenantId: ${user.tenantId || "N/A"}`);
    console.log(`   PasswordHash: ${user.passwordHash ? "✅ Definido" : "❌ Não definido"}`);
    console.log(`   OpenId: ${user.openId || "N/A"}\n`);
    
    // Verifica tenant
    if (!user.tenantId) {
      console.log("❌ PROBLEMA: Usuário não possui tenantId!");
      console.log("   O usuário precisa estar vinculado a um tenant para fazer login.\n");
      process.exit(1);
    }
    
    console.log("🔍 Verificando tenant...");
    const tenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);
    
    if (tenant.length === 0) {
      console.log(`❌ PROBLEMA: Tenant ID ${user.tenantId} não encontrado!`);
      console.log("   O tenant foi deletado ou não existe.\n");
      process.exit(1);
    }
    
    const tenantData = tenant[0];
    console.log("✅ Tenant encontrado!");
    console.log(`   ID: ${tenantData.id}`);
    console.log(`   Nome: ${tenantData.nome}`);
    console.log(`   Plano: ${tenantData.plano}`);
    console.log(`   Status: ${tenantData.status}`);
    console.log(`   Data Início: ${tenantData.dataInicio}`);
    console.log(`   Data Fim: ${tenantData.dataFim || "Não expira"}`);
    console.log(`   Status Pagamento: ${tenantData.statusPagamento || "N/A"}\n`);
    
    // Verifica se está ativo
    if (tenantData.status !== "ativo") {
      console.log(`❌ PROBLEMA: Tenant está ${tenantData.status}!`);
      console.log("   O tenant precisa estar 'ativo' para permitir login.\n");
      process.exit(1);
    }
    
    // Verifica se expirou
    if (tenantData.dataFim) {
      const dataFim = new Date(tenantData.dataFim);
      const hoje = new Date();
      if (dataFim < hoje) {
        console.log(`❌ PROBLEMA: Tenant expirou em ${tenantData.dataFim}!`);
        console.log("   O tenant precisa ter dataFim no futuro ou NULL.\n");
        process.exit(1);
      }
    }
    
    // Verifica senha
    if (!user.passwordHash) {
      console.log("❌ PROBLEMA: Usuário não possui senha cadastrada!");
      console.log("   É necessário definir passwordHash para fazer login.\n");
      process.exit(1);
    }
    
    // Testa login
    console.log("🔐 Testando login...");
    const bcrypt = (await import("bcryptjs")).default;
    const senha = "111814gi";
    const senhaCorreta = await bcrypt.compare(senha, user.passwordHash);
    
    if (!senhaCorreta) {
      console.log("❌ PROBLEMA: Senha não confere!");
      console.log("   O passwordHash não corresponde à senha '111814gi'.\n");
      process.exit(1);
    }
    
    console.log("✅ Senha correta!\n");
    
    // Resumo final
    console.log("═══════════════════════════════════════");
    console.log("✅ TUDO OK! Usuário pronto para login");
    console.log("═══════════════════════════════════════\n");
    console.log("📋 Credenciais:");
    console.log(`   Email/CPF: ${email} ou ${normalizedCPF}`);
    console.log(`   Senha: ${senha}\n`);
    console.log("💡 Se ainda não conseguir fazer login:");
    console.log("   1. Verifique os logs do servidor");
    console.log("   2. Verifique se o servidor está rodando");
    console.log("   3. Verifique se há erros no console do navegador");
    
  } catch (error: any) {
    console.error("\n❌ Erro ao verificar:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executa o script
verificarAnaPaula()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });








