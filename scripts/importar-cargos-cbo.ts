import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { cargosCbo } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CargoCboData {
  codigoCbo: string;
  nomeCargo: string;
  descricao?: string;
  familiaOcupacional?: string;
  sinonimia?: string;
}

async function importarCargosCbo(arquivoJson?: string) {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada. Configure e rode novamente.");
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    console.log("🔄 Iniciando importação de cargos CBO...\n");

    // Caminho do arquivo JSON
    const arquivo = arquivoJson || resolve(__dirname, "../data/cargos-cbo-exemplo.json");

    console.log(`📂 Lendo arquivo: ${arquivo}`);

    // Ler arquivo JSON
    const conteudo = await readFile(arquivo, "utf-8");
    const cargos: CargoCboData[] = JSON.parse(conteudo);

    console.log(`📊 Total de cargos encontrados: ${cargos.length}\n`);

    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    // Inserir cargos em lotes
    const loteSize = 10;
    for (let i = 0; i < cargos.length; i += loteSize) {
      const lote = cargos.slice(i, i + loteSize);

      for (const cargo of lote) {
        try {
          // Verificar se o cargo já existe pelo código CBO
          const existente = await db
            .select()
            .from(cargosCbo)
            .where(eq(cargosCbo.codigoCbo, cargo.codigoCbo))
            .limit(1);

          if (existente.length > 0) {
            // Atualizar cargo existente
            await db
              .update(cargosCbo)
              .set({
                nomeCargo: cargo.nomeCargo,
                descricao: cargo.descricao || null,
                familiaOcupacional: cargo.familiaOcupacional || null,
                sinonimia: cargo.sinonimia || null,
                updatedAt: new Date(),
              })
              .where(eq(cargosCbo.codigoCbo, cargo.codigoCbo));

            atualizados++;
            console.log(`🔄 Atualizado: ${cargo.codigoCbo} - ${cargo.nomeCargo}`);
          } else {
            // Inserir novo cargo
            await db.insert(cargosCbo).values({
              codigoCbo: cargo.codigoCbo,
              nomeCargo: cargo.nomeCargo,
              descricao: cargo.descricao || null,
              familiaOcupacional: cargo.familiaOcupacional || null,
              sinonimia: cargo.sinonimia || null,
            });

            inseridos++;
            console.log(`✅ Inserido: ${cargo.codigoCbo} - ${cargo.nomeCargo}`);
          }
        } catch (error: any) {
          erros++;
          console.error(`❌ Erro ao processar ${cargo.codigoCbo}:`, error.message);
        }
      }

      console.log(`\n📈 Progresso: ${Math.min(i + loteSize, cargos.length)}/${cargos.length}\n`);
    }

    // Estatísticas finais
    const totalNoBanco = await db.select().from(cargosCbo);
    console.log("\n" + "=".repeat(50));
    console.log("✨ Importação concluída!");
    console.log("=".repeat(50));
    console.log(`✅ Cargos inseridos: ${inseridos}`);
    console.log(`🔄 Cargos atualizados: ${atualizados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📊 Total no banco: ${totalNoBanco.length}`);
    console.log("=".repeat(50));

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro na importação:", error);
    process.exit(1);
  }
}

// Executar
const arquivo = process.argv[2];
importarCargosCbo(arquivo);

