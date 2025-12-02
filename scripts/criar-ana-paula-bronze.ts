/**
 * Script para criar acesso fictício para Ana Paula no plano Bronze
 * 
 * Uso: npx tsx scripts/criar-ana-paula-bronze.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carrega variáveis de ambiente
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function criarAnaPaula() {
  console.log("👤 Criando acesso para Ana Paula (Plano Bronze)...\n");
  
  try {
    // Verifica se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada. Configure no arquivo .env");
    }
    
    // Verifica se é MySQL (não PostgreSQL)
    if (process.env.DATABASE_URL.startsWith("postgresql://")) {
      throw new Error(
        "DATABASE_URL está configurada como PostgreSQL, mas o sistema usa MySQL.\n" +
        "Configure no arquivo .env:\n" +
        "DATABASE_URL=mysql://usuario:senha@host:porta/banco\n" +
        "Exemplo: DATABASE_URL=mysql://root:senha@localhost:3306/sst"
      );
    }
    
    if (!process.env.DATABASE_URL.startsWith("mysql://")) {
      console.warn("⚠️  DATABASE_URL não parece ser MySQL. Verifique a configuração.");
    }
    
    console.log("📋 Conectando ao banco de dados...");
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      throw new Error(
        "Não foi possível conectar ao banco de dados.\n" +
        "Verifique:\n" +
        "1. Se o MySQL está rodando\n" +
        "2. Se a DATABASE_URL está correta no arquivo .env\n" +
        "3. Se as credenciais estão corretas"
      );
    }
    
    console.log("✅ Conexão estabelecida\n");
    
    // Importa funções necessárias
    const bcrypt = (await import("bcryptjs")).default;
    const { getUserByIdentifier, createUser } = await import("../server/db");
    const { normalizeCPF } = await import("../server/utils/validation");
    const { tenants, users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    // Dados de Ana Paula
    const nome = "Ana Paula";
    const cpf = "55566677788"; // CPF do cadastro encontrado
    const email = "ana.paula@consultoriasst.com.br";
    const telefone = "(11) 91111-0000";
    const senha = "111814gi";
    const plano = "bronze";
    
    const normalizedCPF = normalizeCPF(cpf);
    
    // Verifica se usuário já existe
    console.log("🔍 Verificando se usuário já existe...");
    const existingUser = await getUserByIdentifier(normalizedCPF);
    
    if (existingUser) {
      console.log("⚠️  Usuário já existe! ID:", existingUser.id);
      console.log("💡 Usuário já possui acesso ao sistema.");
      
      // Verifica se tem tenant
      if (existingUser.tenantId) {
        const tenant = await db.select()
          .from(tenants)
          .where(eq(tenants.id, existingUser.tenantId))
          .limit(1);
        
        if (tenant.length > 0) {
          console.log(`\n📋 Tenant existente:`);
          console.log(`   ID: ${tenant[0].id}`);
          console.log(`   Nome: ${tenant[0].nome}`);
          console.log(`   Plano: ${tenant[0].plano}`);
          console.log(`   Status: ${tenant[0].status}`);
        }
      }
      
      process.exit(0);
    }
    
    // Cria tenant primeiro
    console.log("🏢 Criando tenant (plano bronze)...");
    const dataInicio = new Date();
    const dataProximoPagamento = new Date();
    dataProximoPagamento.setMonth(dataProximoPagamento.getMonth() + 1); // Próximo mês
    
    const tenantResult = await db.insert(tenants).values({
      nome: nome,
      email: email,
      telefone: telefone,
      cpf: normalizedCPF,
      plano: plano as any,
      status: "ativo" as any,
      dataInicio: dataInicio,
      dataFim: null,
      valorPlano: "67,90",
      dataUltimoPagamento: dataInicio,
      dataProximoPagamento: dataProximoPagamento,
      periodicidade: "mensal" as any,
      statusPagamento: "pago" as any,
      observacoes: "Acesso fictício criado automaticamente",
    });
    
    const tenantId = (tenantResult as any)[0]?.insertId;
    
    if (!tenantId) {
      throw new Error("Erro ao criar tenant");
    }
    
    console.log(`✅ Tenant criado! ID: ${tenantId}\n`);
    
    // Cria hash da senha
    console.log("🔐 Gerando hash da senha...");
    const passwordHash = await bcrypt.hash(senha, 10);
    
    // Cria usuário vinculado ao tenant
    console.log("👤 Criando usuário...");
    const newUser = await createUser({
      name: nome,
      email: email,
      cpf: normalizedCPF,
      passwordHash,
      role: "tenant_admin", // Admin do próprio tenant
      openId: `local-${Date.now()}`,
      empresaId: null,
      tenantId: tenantId, // VINCULA AO TENANT CRIADO
    });
    
    if (!newUser) {
      throw new Error("Erro ao criar usuário");
    }
    
    console.log("\n✅ Acesso criado com sucesso!");
    console.log("📋 Detalhes:");
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   Usuário ID: ${newUser.id}`);
    console.log(`   Nome: ${newUser.name}`);
    console.log(`   CPF: ${normalizedCPF}`);
    console.log(`   Email: ${email}`);
    console.log(`   Plano: ${plano}`);
    console.log(`   Status: ativo`);
    console.log(`   Senha: ${senha}`);
    console.log("\n🔑 Credenciais de acesso:");
    console.log(`   CPF/Email: ${normalizedCPF} ou ${email}`);
    console.log(`   Senha: ${senha}`);
    console.log("\n✅ Pronto! Ana Paula já pode fazer login no sistema.");
    
  } catch (error: any) {
    console.error("\n❌ Erro ao criar acesso:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executa o script
criarAnaPaula()
  .then(() => {
    console.log("\n✅ Script concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

