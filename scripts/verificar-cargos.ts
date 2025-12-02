import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { cargos } from "../drizzle/schema";
import { sql, desc } from "drizzle-orm";

// Carregar .env.local primeiro (prioridade), depois .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Carregar .env primeiro (base)
config({ path: envPath });
// Carregar .env.local depois (sobrescreve)
config({ path: envLocalPath, override: true });

async function verificarCargos() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log("🔍 Verificando cargos no banco de dados...\n");

    // Buscar todos os cargos usando Drizzle
    const result = await db.select({
      id: cargos.id,
      nomeCargo: cargos.nomeCargo,
      tenantId: cargos.tenantId,
      empresaId: cargos.empresaId,
      createdAt: cargos.createdAt,
    })
    .from(cargos)
    .orderBy(desc(cargos.id))
    .limit(20);

    console.log(`✅ Total de cargos encontrados: ${result.length}\n`);

    if (result.length === 0) {
      console.log("⚠️  Nenhum cargo encontrado no banco de dados!");
      return;
    }

    console.log("📋 Primeiros 20 cargos:");
    console.log("─".repeat(80));
    result.forEach((cargo) => {
      console.log(`ID: ${cargo.id} | Nome: ${cargo.nomeCargo} | TenantId: ${cargo.tenantId} | EmpresaId: ${cargo.empresaId || "N/A"} | Criado em: ${cargo.createdAt}`);
    });
    console.log("─".repeat(80));

    // Verificar distribuição por tenantId
    const distribuicao = await db.execute(
      sql`SELECT tenantId, COUNT(*) as total FROM cargos GROUP BY tenantId`
    );

    console.log("\n📊 Distribuição por TenantId:");
    console.log("─".repeat(40));
    if (Array.isArray(distribuicao) && distribuicao.length > 0) {
      distribuicao.forEach((item: any) => {
        console.log(`TenantId ${item.tenantId}: ${item.total} cargos`);
      });
    } else {
      console.log("Nenhuma distribuição encontrada");
    }
    console.log("─".repeat(40));

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao verificar cargos:", error);
    process.exit(1);
  }
}

verificarCargos();

