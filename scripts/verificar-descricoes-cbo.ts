import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { cargosCbo } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath, override: true });

async function verificarDescricoes() {
  try {
    console.log("🔍 Verificando descrições geradas...\n");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    // Buscar alguns exemplos
    const exemplos = [
      "ajudante",
      "servente",
      "eletricista",
      "médico",
      "técnico de segurança",
      "pedreiro",
      "operador",
    ];
    
    for (const termo of exemplos) {
      const cargos = await db
        .select()
        .from(cargosCbo)
        .where(like(cargosCbo.nomeCargo, `%${termo}%`))
        .limit(3);
      
      if (cargos.length > 0) {
        console.log(`\n📋 Exemplos de cargos com "${termo}":`);
        cargos.forEach(cargo => {
          console.log(`\n   Código: ${cargo.codigoCbo}`);
          console.log(`   Nome: ${cargo.nomeCargo}`);
          console.log(`   Família: ${cargo.familiaOcupacional || "Não definida"}`);
          console.log(`   Descrição: ${cargo.descricao?.substring(0, 100)}...`);
        });
      }
    }
    
    // Estatísticas
    const total = await db.select().from(cargosCbo);
    const comDescricao = total.filter(c => c.descricao && c.descricao.trim() !== "");
    const comFamilia = total.filter(c => c.familiaOcupacional && c.familiaOcupacional.trim() !== "");
    
    console.log("\n\n📊 Estatísticas:");
    console.log(`   Total de CBOs: ${total.length}`);
    console.log(`   Com descrição: ${comDescricao.length} (${((comDescricao.length / total.length) * 100).toFixed(1)}%)`);
    console.log(`   Com família ocupacional: ${comFamilia.length} (${((comFamilia.length / total.length) * 100).toFixed(1)}%)`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    process.exit(1);
  }
}

verificarDescricoes();














