import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { isNull, eq, sql } from "drizzle-orm";

// Carregar .env.local primeiro (prioridade), depois .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Carregar .env primeiro (base)
config({ path: envPath });
// Carregar .env.local depois (sobrescreve)
config({ path: envLocalPath, override: true });

async function verificarECorrigirTenantUsuarios() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log("🔍 Verificando usuários sem tenantId...\n");

    // Buscar usuários sem tenantId (exceto super_admin)
    const usuariosSemTenant = await db.select()
      .from(users)
      .where(
        sql`${users.tenantId} IS NULL AND ${users.role} NOT IN ('super_admin', 'admin')`
      );

    console.log(`✅ Encontrados ${usuariosSemTenant.length} usuários sem tenantId (exceto admins)\n`);

    if (usuariosSemTenant.length === 0) {
      console.log("✅ Todos os usuários já têm tenantId ou são admins!");
      process.exit(0);
    }

    console.log("📋 Usuários sem tenantId:");
    console.log("─".repeat(80));
    usuariosSemTenant.forEach((user) => {
      console.log(`ID: ${user.id} | Nome: ${user.name || "N/A"} | Email: ${user.email || "N/A"} | Role: ${user.role}`);
    });
    console.log("─".repeat(80));

    console.log("\n⚠️  ATENÇÃO: Estes usuários precisam ser associados a um tenant.");
    console.log("   Para corrigir, você precisa:");
    console.log("   1. Identificar qual tenant cada usuário pertence");
    console.log("   2. Atualizar manualmente o tenantId de cada usuário");
    console.log("   3. Ou deletar usuários que não devem existir\n");

    // Verificar distribuição de usuários por tenant
    const distribuicao = await db.execute(
      sql`SELECT tenantId, role, COUNT(*) as total FROM users GROUP BY tenantId, role ORDER BY tenantId, role`
    );

    console.log("📊 Distribuição de usuários por TenantId e Role:");
    console.log("─".repeat(60));
    if (Array.isArray(distribuicao) && distribuicao.length > 0) {
      distribuicao.forEach((item: any) => {
        const tenantInfo = item.tenantId ? `TenantId ${item.tenantId}` : "Sem Tenant";
        console.log(`${tenantInfo} | Role: ${item.role} | Total: ${item.total}`);
      });
    } else {
      console.log("Nenhuma distribuição encontrada");
    }
    console.log("─".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
    process.exit(1);
  }
}

verificarECorrigirTenantUsuarios();





