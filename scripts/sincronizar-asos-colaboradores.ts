import "dotenv/config";
import { getDb, upsertAsoForColaborador } from "../server/db";
import { colaboradores } from "../drizzle/schema";
import { and, isNotNull } from "drizzle-orm";

async function sincronizarAsos() {
  const db = await getDb();
  if (!db) {
    console.error("[Sync] Banco de dados indisponível");
    return;
  }

  console.log("🔄 Sincronizando ASOs existentes a partir do cadastro de colaboradores...");

  const registros = await db
    .select({
      id: colaboradores.id,
      tenantId: colaboradores.tenantId,
      empresaId: colaboradores.empresaId,
      dataPrimeiroAso: colaboradores.dataPrimeiroAso,
      validadeAso: colaboradores.validadeAso,
    })
    .from(colaboradores)
    .where(
      and(isNotNull(colaboradores.dataPrimeiroAso), isNotNull(colaboradores.validadeAso))
    );

  let criados = 0;

  for (const registro of registros) {
    if (!registro.tenantId || !registro.empresaId || !registro.dataPrimeiroAso || !registro.validadeAso) {
      continue;
    }

    await upsertAsoForColaborador({
      tenantId: registro.tenantId,
      colaboradorId: registro.id,
      empresaId: registro.empresaId,
      dataEmissao: new Date(registro.dataPrimeiroAso),
      dataValidade: new Date(registro.validadeAso),
    });

    criados += 1;
  }

  console.log(`✅ Sincronização concluída! Registros atualizados: ${criados}`);
  process.exit(0);
}

sincronizarAsos().catch((error) => {
  console.error("❌ Erro na sincronização de ASOs:", error);
  process.exit(1);
});
