/**
 * Script para atualizar o role de um usuário para 'admin'
 * 
 * Uso:
 *   npx tsx scripts/atualizar-role-admin.ts <ID_DO_USUARIO>
 *   ou
 *   npx tsx scripts/atualizar-role-admin.ts --email <EMAIL>
 *   ou
 *   npx tsx scripts/atualizar-role-admin.ts --cpf <CPF>
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function updateUserRole() {
  console.log("🔧 Atualizando role do usuário para 'admin'...\n");

  try {
    // Verifica se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada no .env");
    }

    console.log("📋 Conectando ao banco de dados...");
    const { getDb } = await import("../server/db");
    const db = await getDb();

    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }

    console.log("✅ Conexão estabelecida\n");

    // Importa funções necessárias
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const { getUserByIdentifier } = await import("../server/db");
    const { normalizeCPF } = await import("../server/utils/validation");

    // Verifica argumentos
    const args = process.argv.slice(2);
    let userId: number | null = null;
    let userEmail: string | null = null;
    let userCPF: string | null = null;

    if (args.length === 0) {
      // Se não passou argumentos, lista todos os usuários
      console.log("📋 Listando todos os usuários:\n");
      const allUsers = await db.select().from(users);
      
      console.log("ID  | Nome              | Email              | CPF            | Role         | TenantId");
      console.log("----|-------------------|--------------------|----------------|--------------|----------");
      allUsers.forEach(user => {
        const name = (user.name || "").substring(0, 18).padEnd(18);
        const email = (user.email || "").substring(0, 18).padEnd(18);
        const cpf = (user.cpf || "").substring(0, 14).padEnd(14);
        const role = (user.role || "").substring(0, 12).padEnd(12);
        const tenantId = user.tenantId || "NULL";
        console.log(`${String(user.id).padEnd(3)} | ${name} | ${email} | ${cpf} | ${role} | ${tenantId}`);
      });
      
      console.log("\n💡 Para atualizar um usuário, use:");
      console.log("   npx tsx scripts/atualizar-role-admin.ts <ID>");
      console.log("   npx tsx scripts/atualizar-role-admin.ts --email <EMAIL>");
      console.log("   npx tsx scripts/atualizar-role-admin.ts --cpf <CPF>");
      process.exit(0);
    }

    // Processa argumentos
    if (args[0] === "--email" && args[1]) {
      userEmail = args[1];
    } else if (args[0] === "--cpf" && args[1]) {
      userCPF = normalizeCPF(args[1]);
    } else if (!isNaN(Number(args[0]))) {
      userId = Number(args[0]);
    } else {
      throw new Error("Argumento inválido. Use: <ID>, --email <EMAIL>, ou --cpf <CPF>");
    }

    // Busca o usuário
    let user;
    if (userId) {
      console.log(`🔍 Buscando usuário com ID: ${userId}...`);
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = result[0] || null;
    } else if (userEmail) {
      console.log(`🔍 Buscando usuário com email: ${userEmail}...`);
      user = await getUserByIdentifier(userEmail);
    } else if (userCPF) {
      console.log(`🔍 Buscando usuário com CPF: ${userCPF}...`);
      user = await getUserByIdentifier(userCPF);
    }

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    console.log("\n📋 Usuário encontrado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || "N/A"}`);
    console.log(`   Email: ${user.email || "N/A"}`);
    console.log(`   CPF: ${user.cpf || "N/A"}`);
    console.log(`   Role atual: ${user.role}`);
    console.log(`   TenantId: ${user.tenantId || "NULL"}`);

    // Atualiza o role
    console.log("\n🔄 Atualizando role para 'admin'...");
    await db
      .update(users)
      .set({ 
        role: "admin",
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    console.log("\n✅ Role atualizado com sucesso!");
    console.log(`   Novo role: admin`);
    console.log("\n💡 Faça logout e login novamente para ver as mudanças.");

  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    console.error(error);
    process.exit(1);
  }
}

updateUserRole();







