import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { cargos, empresas } from "../drizzle/schema";
import { eq, isNull, sql } from "drizzle-orm";

// Carregar .env.local primeiro (prioridade), depois .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Carregar .env primeiro (base)
config({ path: envPath });
// Carregar .env.local depois (sobrescreve)
config({ path: envLocalPath, override: true });

async function corrigirTenantCargos() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log("🔍 Verificando cargos com tenantId null...\n");

    // Buscar cargos com tenantId null
    const cargosSemTenant = await db.select()
      .from(cargos)
      .where(isNull(cargos.tenantId));

    console.log(`✅ Encontrados ${cargosSemTenant.length} cargos sem tenantId\n`);

    if (cargosSemTenant.length === 0) {
      console.log("✅ Todos os cargos já têm tenantId!");
      process.exit(0);
    }

    // Para cada cargo sem tenantId, buscar o tenantId da empresa vinculada
    let atualizados = 0;
    let semEmpresa = 0;

    for (const cargo of cargosSemTenant) {
      if (cargo.empresaId) {
        // Buscar a empresa para obter o tenantId
        const empresa = await db.select()
          .from(empresas)
          .where(eq(empresas.id, cargo.empresaId))
          .limit(1);

        if (empresa.length > 0 && empresa[0].tenantId) {
          // Atualizar o cargo com o tenantId da empresa
          await db.update(cargos)
            .set({ tenantId: empresa[0].tenantId })
            .where(eq(cargos.id, cargo.id));

          console.log(`✅ Cargo "${cargo.nomeCargo}" (ID: ${cargo.id}) atualizado com tenantId: ${empresa[0].tenantId}`);
          atualizados++;
        } else {
          console.log(`⚠️  Cargo "${cargo.nomeCargo}" (ID: ${cargo.id}) - Empresa não encontrada ou sem tenantId`);
          semEmpresa++;
        }
      } else {
        console.log(`⚠️  Cargo "${cargo.nomeCargo}" (ID: ${cargo.id}) - Sem empresa vinculada`);
        semEmpresa++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Atualizados: ${atualizados}`);
    console.log(`   ⚠️  Sem empresa/tenantId: ${semEmpresa}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao corrigir tenantId dos cargos:", error);
    process.exit(1);
  }
}

corrigirTenantCargos();






