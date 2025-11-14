import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { getDb } from "../server/db";
import { cargoRiscos, riscosOcupacionais } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function testarSalvarRiscos() {
  console.log("========================================");
  console.log("  TESTE: Salvar Riscos Diretamente");
  console.log("========================================\n");

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // 1. Buscar ou criar um risco ocupacional "Físico"
    console.log("1. Buscando risco ocupacional 'Físico'...");
    const riscosExistentes = await db
      .select()
      .from(riscosOcupacionais)
      .where(eq(riscosOcupacionais.nomeRisco, "Físico"))
      .limit(1);

    let riscoId: number;
    if (riscosExistentes.length > 0) {
      riscoId = riscosExistentes[0].id;
      console.log(`   ✓ Risco encontrado com ID: ${riscoId}`);
    } else {
      console.log("   Criando novo risco 'Físico'...");
      const novoRisco = await db.insert(riscosOcupacionais).values({
        nomeRisco: "Físico",
        tipoRisco: "fisico",
        status: "ativo",
      });
      console.log("   Resultado do insert:", novoRisco);
      
      // Buscar o risco criado
      const riscosCriados = await db
        .select()
        .from(riscosOcupacionais)
        .where(eq(riscosOcupacionais.nomeRisco, "Físico"))
        .limit(1);
      
      if (riscosCriados.length === 0) {
        throw new Error("Não foi possível criar o risco ocupacional");
      }
      riscoId = riscosCriados[0].id;
      console.log(`   ✓ Risco criado com ID: ${riscoId}`);
    }

    // 2. Buscar um cargo existente
    console.log("\n2. Buscando um cargo existente...");
    const { cargos } = await import("../drizzle/schema");
    const cargosExistentes = await db.select().from(cargos).limit(1);
    
    if (cargosExistentes.length === 0) {
      throw new Error("Nenhum cargo encontrado no banco. Crie um cargo primeiro.");
    }
    
    const cargoId = cargosExistentes[0].id;
    console.log(`   ✓ Cargo encontrado com ID: ${cargoId} (${cargosExistentes[0].nomeCargo})`);

    // 3. Verificar se já existe vínculo
    console.log("\n3. Verificando se já existe vínculo...");
    const vinculosExistentes = await db
      .select()
      .from(cargoRiscos)
      .where(eq(cargoRiscos.cargoId, cargoId))
      .where(eq(cargoRiscos.riscoOcupacionalId, riscoId));

    if (vinculosExistentes.length > 0) {
      console.log("   ⚠ Vínculo já existe. Removendo para testar novamente...");
      await db
        .delete(cargoRiscos)
        .where(eq(cargoRiscos.cargoId, cargoId))
        .where(eq(cargoRiscos.riscoOcupacionalId, riscoId));
    }

    // 4. Criar vínculo cargo-risco
    console.log("\n4. Criando vínculo cargo-risco...");
    const dadosVinculo = {
      cargoId: cargoId,
      riscoOcupacionalId: riscoId,
      tenantId: 1,
      tipoAgente: "Físico",
      fonteGeradora: "Teste de fonte",
      possiveisDanosSaude: "Teste de danos",
      descricaoRiscos: "Teste de descrição",
    };

    console.log("   Dados:", JSON.stringify(dadosVinculo, null, 2));
    
    const resultado = await db.insert(cargoRiscos).values(dadosVinculo);
    console.log("   Resultado do insert:", resultado);

    // 5. Verificar se foi criado
    console.log("\n5. Verificando se o vínculo foi criado...");
    const vinculosCriados = await db
      .select()
      .from(cargoRiscos)
      .where(eq(cargoRiscos.cargoId, cargoId))
      .where(eq(cargoRiscos.riscoOcupacionalId, riscoId));

    if (vinculosCriados.length > 0) {
      console.log("   ✓ SUCESSO! Vínculo criado:");
      console.log("   ", JSON.stringify(vinculosCriados[0], null, 2));
    } else {
      throw new Error("Vínculo não foi criado, mas não houve erro no insert");
    }

    // 6. Testar usando a função do db.ts
    console.log("\n6. Testando função createCargoRisco do db.ts...");
    const { createCargoRisco } = await import("../server/db");
    
    // Remover o vínculo anterior
    await db
      .delete(cargoRiscos)
      .where(eq(cargoRiscos.cargoId, cargoId))
      .where(eq(cargoRiscos.riscoOcupacionalId, riscoId));

    const resultadoFuncao = await createCargoRisco(dadosVinculo);
    console.log("   Resultado da função:", JSON.stringify(resultadoFuncao, null, 2));

    console.log("\n========================================");
    console.log("  TESTE CONCLUÍDO COM SUCESSO!");
    console.log("========================================\n");

  } catch (error: any) {
    console.error("\n❌ ERRO NO TESTE:");
    console.error(error);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

testarSalvarRiscos();

