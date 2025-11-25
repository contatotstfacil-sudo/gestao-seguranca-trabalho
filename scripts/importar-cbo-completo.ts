import { config } from "dotenv";
import { resolve } from "path";
import axios from "axios";
import { getDb } from "../server/db";
import { cargosCbo } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath, override: true });

const URL_CBO = "https://raw.githubusercontent.com/lucassmacedo/cbo-brasil/master/json/CBO2002%20-%20Ocupacao.json";

interface CboItem {
  code: string;
  name: string;
}

async function importarCboCompleto() {
  try {
    console.log("🔄 Iniciando importação completa de CBOs...\n");
    
    // 1. Baixar o JSON da API
    console.log("📡 Baixando dados do GitHub...");
    const response = await axios.get(URL_CBO, { timeout: 30000 });
    const dados: CboItem[] = response.data;
    
    if (!Array.isArray(dados)) {
      throw new Error("Os dados não estão no formato esperado (array)");
    }
    
    console.log(`✅ ${dados.length} CBOs encontrados no arquivo\n`);
    
    // 2. Conectar ao banco
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    console.log("📊 Verificando tabela cargosCbo...");
    
    // Verificar se a tabela existe
    try {
      await db.select().from(cargosCbo).limit(1);
      console.log("✅ Tabela cargosCbo existe\n");
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.message?.includes("Unknown table")) {
        console.error("❌ Tabela cargosCbo não existe! Execute a migração primeiro:");
        console.error("   pnpm migrate:cargos-cbo");
        process.exit(1);
      }
      throw error;
    }
    
    // 3. Processar e importar os dados
    console.log("🔄 Processando e importando CBOs...\n");
    
    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;
    const batchSize = 100; // Processar em lotes de 100
    
    for (let i = 0; i < dados.length; i += batchSize) {
      const batch = dados.slice(i, i + batchSize);
      const promises = batch.map(async (item) => {
        try {
          // Formatar código CBO (adicionar hífen se necessário: 515105 -> 5151-05)
          let codigoFormatado = item.code;
          if (codigoFormatado.length === 6 && !codigoFormatado.includes('-')) {
            codigoFormatado = `${codigoFormatado.substring(0, 4)}-${codigoFormatado.substring(4)}`;
          }
          
          // Verificar se já existe
          const existente = await db
            .select()
            .from(cargosCbo)
            .where(eq(cargosCbo.codigoCbo, codigoFormatado))
            .limit(1);
          
          if (existente.length > 0) {
            // Atualizar se o nome mudou
            if (existente[0].nomeCargo !== item.name) {
              await db
                .update(cargosCbo)
                .set({
                  nomeCargo: item.name,
                  updatedAt: new Date(),
                })
                .where(eq(cargosCbo.codigoCbo, codigoFormatado));
              atualizados++;
            }
          } else {
            // Inserir novo
            await db.insert(cargosCbo).values({
              codigoCbo: codigoFormatado,
              nomeCargo: item.name,
              descricao: null,
              familiaOcupacional: null,
              sinonimia: null,
            });
            inseridos++;
          }
        } catch (error: any) {
          console.error(`❌ Erro ao processar CBO ${item.code}: ${error.message}`);
          erros++;
        }
      });
      
      await Promise.all(promises);
      
      const progresso = Math.min(i + batchSize, dados.length);
      const percentual = ((progresso / dados.length) * 100).toFixed(1);
      console.log(`📊 Progresso: ${progresso}/${dados.length} (${percentual}%) - Inseridos: ${inseridos}, Atualizados: ${atualizados}, Erros: ${erros}`);
    }
    
    console.log("\n✨ Importação concluída!\n");
    console.log("📊 Resumo:");
    console.log(`   ✅ CBOs inseridos: ${inseridos}`);
    console.log(`   ✏️  CBOs atualizados: ${atualizados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📋 Total processado: ${dados.length}`);
    
    // Contar total no banco
    const totalNoBanco = await db.select().from(cargosCbo);
    console.log(`\n💾 Total de CBOs no banco de dados: ${totalNoBanco.length}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erro na importação:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    process.exit(1);
  }
}

importarCboCompleto();

