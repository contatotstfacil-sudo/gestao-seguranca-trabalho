import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { users, cargos } from "../drizzle/schema";
import { eq, sql, like } from "drizzle-orm";

// Carregar .env.local primeiro (prioridade), depois .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Carregar .env primeiro (base)
config({ path: envPath });
// Carregar .env.local depois (sobrescreve)
config({ path: envLocalPath, override: true });

async function verificarUsuarioFilipi() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log("🔍 Verificando usuário Filipi...\n");

    // Buscar usuário Filipi
    const usuariosFilipi = await db.select()
      .from(users)
      .where(like(users.name, "%Filipi%"))
      .limit(10);

    console.log(`✅ Encontrados ${usuariosFilipi.length} usuários com nome Filipi\n`);

    if (usuariosFilipi.length === 0) {
      console.log("⚠️  Nenhum usuário encontrado com nome Filipi");
      process.exit(0);
    }

    console.log("📋 Usuários encontrados:");
    console.log("─".repeat(100));
    usuariosFilipi.forEach((user) => {
      console.log(`ID: ${user.id} | Nome: ${user.name} | Email: ${user.email || "N/A"} | Role: ${user.role} | TenantId: ${user.tenantId || "NULL"} | EmpresaId: ${user.empresaId || "NULL"}`);
    });
    console.log("─".repeat(100));

    // Verificar cargos que o usuário deveria ver
    for (const user of usuariosFilipi) {
      console.log(`\n🔍 Verificando cargos para usuário: ${user.name} (ID: ${user.id}, TenantId: ${user.tenantId || "NULL"})`);
      
      if (user.tenantId) {
        const cargosDoTenant = await db.select()
          .from(cargos)
          .where(eq(cargos.tenantId, user.tenantId))
          .limit(10);
        
        console.log(`   ✅ Cargos do tenant ${user.tenantId}: ${cargosDoTenant.length} encontrados`);
        if (cargosDoTenant.length > 0) {
          console.log(`   Primeiros cargos:`);
          cargosDoTenant.slice(0, 5).forEach((cargo) => {
            console.log(`     - ${cargo.nomeCargo} (ID: ${cargo.id}, TenantId: ${cargo.tenantId})`);
          });
        }
      } else {
        console.log(`   ⚠️  Usuário SEM tenantId - verá TODOS os cargos (problema!)`);
      }

      // Verificar cargos sem tenantId (que não deveriam aparecer)
      const cargosSemTenant = await db.select()
        .from(cargos)
        .where(sql`${cargos.tenantId} IS NULL`)
        .limit(10);
      
      if (cargosSemTenant.length > 0) {
        console.log(`   ⚠️  ATENÇÃO: Existem ${cargosSemTenant.length} cargos SEM tenantId que podem aparecer indevidamente!`);
        console.log(`   Primeiros cargos sem tenantId:`);
        cargosSemTenant.slice(0, 5).forEach((cargo) => {
          console.log(`     - ${cargo.nomeCargo} (ID: ${cargo.id})`);
        });
      }
    }

    // Verificar total de cargos no sistema
    const totalCargos = await db.execute(sql`SELECT COUNT(*) as total FROM cargos`);
    const totalCargosComTenant = await db.execute(sql`SELECT COUNT(*) as total FROM cargos WHERE tenantId IS NOT NULL`);
    const totalCargosSemTenant = await db.execute(sql`SELECT COUNT(*) as total FROM cargos WHERE tenantId IS NULL`);

    console.log(`\n📊 Estatísticas Gerais:`);
    console.log(`   Total de cargos: ${(totalCargos as any)[0]?.total || 0}`);
    console.log(`   Cargos com tenantId: ${(totalCargosComTenant as any)[0]?.total || 0}`);
    console.log(`   Cargos sem tenantId: ${(totalCargosSemTenant as any)[0]?.total || 0}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao verificar usuário Filipi:", error);
    process.exit(1);
  }
}

verificarUsuarioFilipi();



