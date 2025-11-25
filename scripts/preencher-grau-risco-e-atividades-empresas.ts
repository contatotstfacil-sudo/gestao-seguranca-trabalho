import { empresas } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath });
config(); // Carregar .env também

// Descrições de atividades baseadas em CNAE
const descricoesPorCnae: Record<string, string> = {
  "4120400": "Construção de edifícios residenciais e comerciais, incluindo obras de infraestrutura, acabamentos, instalações elétricas, hidráulicas e sistemas de segurança.",
  "4211103": "Construção de rodovias, ferrovias, pontes, viadutos e obras de arte especiais, incluindo terraplenagem, pavimentação e sinalização.",
  "4211104": "Construção de obras de arte especiais, pontes, viadutos, túneis e estruturas metálicas para infraestrutura de transporte.",
  "4212000": "Obras de urbanização, pavimentação de ruas, construção de calçadas, drenagem pluvial e infraestrutura urbana.",
  "4220100": "Construção de obras de infraestrutura para geração, transmissão e distribuição de energia elétrica, incluindo subestações e linhas de transmissão.",
  "4711301": "Comércio varejista de materiais de construção, ferragens, equipamentos e acessórios para construção civil.",
  "4110700": "Incorporação de empreendimentos imobiliários, desenvolvimento de projetos habitacionais e comerciais, planejamento e gestão de obras.",
};

// Descrições genéricas para CNAEs não mapeados
const descricoesGenericas = [
  "Construção civil, obras de infraestrutura, reformas e ampliações, incluindo serviços de terraplenagem, fundações, estruturas e acabamentos.",
  "Engenharia e construção de obras civis, infraestrutura rodoviária, edificações comerciais e residenciais, com foco em qualidade e segurança.",
  "Construção e reforma de edifícios, obras de infraestrutura urbana, pavimentação, drenagem e serviços de engenharia civil especializada.",
  "Obras de construção civil, infraestrutura, edificações, reformas, ampliações e serviços de engenharia relacionados à construção.",
  "Construção de obras de infraestrutura, edificações comerciais e residenciais, reformas, ampliações e serviços de engenharia civil.",
];

// Graus de risco (maioria será Grau 4 para construção)
const grausRisco = ["Grau 1 (Mínimo)", "Grau 2 (Baixo)", "Grau 3 (Médio)", "Grau 4 (Alto)"];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Erro: Não foi possível conectar ao banco de dados");
    process.exit(1);
  }

  console.log("🚀 Iniciando preenchimento de grau de risco e descrição de atividades...");

  try {
    // Buscar todas as empresas
    const todasEmpresas = await db.select().from(empresas);

    console.log(`📊 Encontradas ${todasEmpresas.length} empresas`);

    let atualizadas = 0;
    let comGrauRisco = 0;
    let comAtividade = 0;

    for (const empresa of todasEmpresas) {
      const atualizacoes: any = {};
      let precisaAtualizar = false;

      // Preencher grau de risco se estiver vazio, null ou undefined
      const grauRiscoAtual = empresa.grauRisco;
      if (!grauRiscoAtual || (typeof grauRiscoAtual === "string" && grauRiscoAtual.trim() === "")) {
        // Para construção civil, maioria será Grau 4
        const cnae = empresa.cnae || "";
        if (cnae.startsWith("41") || cnae.startsWith("42")) {
          atualizacoes.grauRisco = "Grau 4 (Alto)";
        } else {
          // Para outros setores, distribuir entre os graus
          atualizacoes.grauRisco = grausRisco[Math.floor(Math.random() * grausRisco.length)];
        }
        precisaAtualizar = true;
        comGrauRisco++;
      }

      // Preencher descrição de atividades se estiver vazia
      if (!empresa.descricaoAtividade || empresa.descricaoAtividade.trim() === "") {
        const cnae = empresa.cnae || "";
        if (cnae && descricoesPorCnae[cnae]) {
          atualizacoes.descricaoAtividade = descricoesPorCnae[cnae];
        } else {
          // Usar descrição genérica
          atualizacoes.descricaoAtividade =
            descricoesGenericas[Math.floor(Math.random() * descricoesGenericas.length)];
        }
        precisaAtualizar = true;
        comAtividade++;
      }

      if (precisaAtualizar) {
        await db.update(empresas).set(atualizacoes).where(eq(empresas.id, empresa.id));
        atualizadas++;
        console.log(
          `✅ Empresa ${empresa.id} (${empresa.razaoSocial}): ${atualizacoes.grauRisco ? "Grau de Risco" : ""} ${atualizacoes.grauRisco && atualizacoes.descricaoAtividade ? "e" : ""} ${atualizacoes.descricaoAtividade ? "Descrição de Atividades" : ""} preenchidos`
        );
      }
    }

    console.log("\n📈 Resumo:");
    console.log(`   Total de empresas: ${todasEmpresas.length}`);
    console.log(`   Empresas atualizadas: ${atualizadas}`);
    console.log(`   Graus de risco preenchidos: ${comGrauRisco}`);
    console.log(`   Descrições de atividades preenchidas: ${comAtividade}`);
    console.log("\n✅ Preenchimento concluído com sucesso!");

  } catch (error: any) {
    console.error("❌ Erro ao preencher dados:", error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

