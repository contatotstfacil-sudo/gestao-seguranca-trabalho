import { empresas, cargos, riscosOcupacionais, cargoRiscos } from "../drizzle/schema";
import { eq, like, and, desc } from "drizzle-orm";
import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath });
config(); // Carregar .env também

// Dados de riscos ocupacionais por tipo
const riscosPorTipo = {
  fisico: [
    {
      nomeRisco: "Ruído",
      descricao: "Exposição a ruído contínuo ou intermitente acima dos limites de tolerância estabelecidos pela NR-15",
      codigo: "FIS-001",
      tipoAgente: "Ruído",
      fonteGeradora: "Fachada, Lixadeira, Betoneira, Serras elétricas, Marteletes, Compressores",
      tipo: "Intermitente",
      meioPropagacao: "Ar",
      meioContato: "Auditivo",
      possiveisDanosSaude: "Perda de Audição, Zumbido, Estresse, Fadiga auditiva",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Em caso de Ruído usar Protetor Auricular tipo plug ou abafador de ruído.",
    },
    {
      nomeRisco: "Vibração",
      descricao: "Exposição a vibrações de máquinas e equipamentos",
      codigo: "FIS-002",
      tipoAgente: "Vibração",
      fonteGeradora: "Marteletes, Serras elétricas, Compactadores, Equipamentos vibratórios",
      tipo: "Contínua",
      meioPropagacao: "Contato direto",
      meioContato: "Com o corpo",
      possiveisDanosSaude: "Lesões osteomusculares, Síndrome do túnel do carpo, Problemas circulatórios",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Usar luvas anti-vibração e realizar pausas regulares durante o trabalho.",
    },
    {
      nomeRisco: "Radiação Não Ionizante",
      descricao: "Exposição a radiação solar e fontes de calor",
      codigo: "FIS-003",
      tipoAgente: "Radiação Solar",
      fonteGeradora: "Exposição ao sol, Trabalho em áreas abertas",
      tipo: "Contínua",
      meioPropagacao: "Radiação",
      meioContato: "Com a pele",
      possiveisDanosSaude: "Queimaduras, Insolação, Câncer de pele, Desidratação",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Usar protetor solar, roupas de proteção, bonés e realizar trabalho em horários de menor exposição solar.",
    },
  ],
  quimico: [
    {
      nomeRisco: "Poeira",
      descricao: "Exposição a poeiras diversas geradas em atividades de construção",
      codigo: "QUI-001",
      tipoAgente: "Poeira",
      fonteGeradora: "Corte de paredes, Vigas de concreto, Poeira diversas do solo, Lixamento, Demolições",
      tipo: "Particulado",
      meioPropagacao: "Ar",
      meioContato: "Respiratório",
      possiveisDanosSaude: "Para pulmões, Doenças respiratórias, Silicose, Asma ocupacional",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Em caso de poeira usar Protetor respiratório com filtro PFF2.",
    },
    {
      nomeRisco: "Produtos Químicos",
      descricao: "Exposição a produtos químicos utilizados na construção",
      codigo: "QUI-002",
      tipoAgente: "Produtos Químicos",
      fonteGeradora: "Tintas, Solventes, Adesivos, Impermeabilizantes, Produtos de limpeza",
      tipo: "Vapores/Gases",
      meioPropagacao: "Ar",
      meioContato: "Respiratório e dérmico",
      possiveisDanosSaude: "Irritação das vias respiratórias, Dermatites, Intoxicação, Problemas neurológicos",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Usar máscara com filtro químico apropriado, luvas de proteção química e roupas adequadas.",
    },
  ],
  biologico: [
    {
      nomeRisco: "Agentes Biológicos",
      descricao: "Exposição a agentes biológicos em ambientes de trabalho",
      codigo: "BIO-001",
      tipoAgente: "Agentes Biológicos",
      fonteGeradora: "Águas paradas, Resíduos orgânicos, Animais, Vegetação",
      tipo: "Microorganismos",
      meioPropagacao: "Ar/Contato",
      meioContato: "Respiratório, dérmico, digestivo",
      possiveisDanosSaude: "Infecções, Alergias, Doenças transmissíveis",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "01",
      gradacaoExposicao: "01",
      descricaoRiscos: "Manter higiene pessoal, usar luvas e roupas de proteção quando necessário.",
    },
  ],
  ergonomico: [
    {
      nomeRisco: "Trabalho Excessivo",
      descricao: "Jornada de trabalho prolongada e sobrecarga física",
      codigo: "ERG-001",
      tipoAgente: "Trabalho excessivo",
      fonteGeradora: "Jornada de trabalho prolongada",
      tipo: "",
      meioPropagacao: "Ar",
      meioContato: "Com o corpo",
      possiveisDanosSaude: "Para lesões, Fadiga, Estresse, Doenças osteomusculares",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Não fazer jornadas extras além das permitidas. Trabalhar de forma organizada para cumprir suas tarefas dentro do horário de expediente.",
    },
    {
      nomeRisco: "Posturas Inadequadas",
      descricao: "Trabalho em posturas inadequadas e movimentos repetitivos",
      codigo: "ERG-002",
      tipoAgente: "Posturas Inadequadas",
      fonteGeradora: "Trabalho em altura, Trabalho em espaços confinados, Movimentos repetitivos",
      tipo: "",
      meioPropagacao: "Contato direto",
      meioContato: "Com o corpo",
      possiveisDanosSaude: "Lesões por esforço repetitivo (LER), Dores musculares, Problemas na coluna",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Realizar pausas regulares, alongamentos, manter postura correta e usar equipamentos ergonômicos.",
    },
  ],
  mecanico: [
    {
      nomeRisco: "Local Sujo e Desorganizado",
      descricao: "Ambiente de trabalho desorganizado e com materiais espalhados",
      codigo: "MEC-001",
      tipoAgente: "Local sujo e desorganizado",
      fonteGeradora: "Materiais diversos, Ferramentas e equipamentos",
      tipo: "",
      meioPropagacao: "",
      meioContato: "Contato físico",
      possiveisDanosSaude: "Queda de mesmo nível, Corte por queda de ferramentas, Acidentes diversos",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Manter ambiente limpo e organizado para evitar possíveis acidentes. Deixar o ambiente mais limpo e organizado para ter um trabalho mais produtivo.",
    },
    {
      nomeRisco: "Queda de Altura",
      descricao: "Risco de queda de diferentes níveis",
      codigo: "MEC-002",
      tipoAgente: "Queda de altura",
      fonteGeradora: "Diferentes níveis, Andaimes, Escadas, Telhados",
      tipo: "",
      meioPropagacao: "",
      meioContato: "Contato físico",
      possiveisDanosSaude: "Morte",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "04",
      gradacaoExposicao: "04",
      descricaoRiscos: "Usar Cinto de Segurança nos trabalhos em altura. Verificar condições dos andaimes e equipamentos antes do uso.",
    },
    {
      nomeRisco: "Cortes e Perfurações",
      descricao: "Risco de cortes e perfurações por ferramentas e materiais",
      codigo: "MEC-003",
      tipoAgente: "Cortes e Perfurações",
      fonteGeradora: "Ferramentas cortantes, Vidros, Metais, Materiais de construção",
      tipo: "",
      meioPropagacao: "",
      meioContato: "Contato físico",
      possiveisDanosSaude: "Cortes, Perfurações, Amputações",
      tipoAnalise: "Qualitativa",
      gradacaoEfeitos: "02",
      gradacaoExposicao: "02",
      descricaoRiscos: "Usar luvas de proteção, manter ferramentas afiadas e em bom estado, seguir procedimentos de segurança.",
    },
  ],
};

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Erro: Não foi possível conectar ao banco de dados");
    process.exit(1);
  }

  console.log("🚀 Iniciando cadastro de riscos ocupacionais...");

  try {
    // Buscar a empresa
    const empresaResult = await db
      .select()
      .from(empresas)
      .where(like(empresas.razaoSocial, "%Construções e Infraestrutura Brasil%"))
      .limit(1);

    if (empresaResult.length === 0) {
      console.error("❌ Empresa 'Construções e Infraestrutura Brasil Ltda' não encontrada");
      process.exit(1);
    }

    const empresa = empresaResult[0];
    console.log(`✅ Empresa encontrada: ${empresa.razaoSocial} (ID: ${empresa.id}, Tenant: ${empresa.tenantId})`);

    // Buscar cargos da empresa
    const cargosEmpresa = await db
      .select()
      .from(cargos)
      .where(eq(cargos.empresaId, empresa.id));

    if (cargosEmpresa.length === 0) {
      console.error("❌ Nenhum cargo encontrado para esta empresa");
      process.exit(1);
    }

    console.log(`✅ Encontrados ${cargosEmpresa.length} cargos`);

    // Criar riscos ocupacionais
    const riscosCriados: { [key: string]: number } = {};

    for (const [tipo, riscos] of Object.entries(riscosPorTipo)) {
      for (const riscoData of riscos) {
        // Verificar se o risco já existe
        const riscoExistente = await db
          .select()
          .from(riscosOcupacionais)
          .where(
            and(
              eq(riscosOcupacionais.nomeRisco, riscoData.nomeRisco),
              eq(riscosOcupacionais.empresaId, empresa.id)
            )
          )
          .limit(1);

        let riscoId: number;

        if (riscoExistente.length > 0) {
          riscoId = riscoExistente[0].id;
          console.log(`   ⚠️  Risco '${riscoData.nomeRisco}' já existe (ID: ${riscoId})`);
        } else {
          // Criar novo risco
          await db.insert(riscosOcupacionais).values({
            tenantId: empresa.tenantId,
            nomeRisco: riscoData.nomeRisco,
            descricao: riscoData.descricao,
            tipoRisco: tipo as any,
            codigo: riscoData.codigo,
            empresaId: empresa.id,
            status: "ativo",
          });

          // Obter o ID do risco criado
          const riscoInserido = await db
            .select()
            .from(riscosOcupacionais)
            .where(
              and(
                eq(riscosOcupacionais.nomeRisco, riscoData.nomeRisco),
                eq(riscosOcupacionais.empresaId, empresa.id)
              )
            )
            .orderBy(desc(riscosOcupacionais.id))
            .limit(1);

          if (riscoInserido.length === 0) {
            console.error(`   ❌ Erro ao criar risco '${riscoData.nomeRisco}'`);
            continue;
          }

          riscoId = riscoInserido[0].id;
          riscosCriados[riscoData.nomeRisco] = riscoId;
          console.log(`   ✅ Risco '${riscoData.nomeRisco}' criado (ID: ${riscoId})`);
        }

        // Vincular risco aos cargos
        for (const cargo of cargosEmpresa) {
          // Verificar se já existe vínculo
          const vinculoExistente = await db
            .select()
            .from(cargoRiscos)
            .where(
              and(
                eq(cargoRiscos.cargoId, cargo.id),
                eq(cargoRiscos.riscoOcupacionalId, riscoId)
              )
            )
            .limit(1);

          if (vinculoExistente.length === 0) {
            await db.insert(cargoRiscos).values({
              tenantId: empresa.tenantId,
              cargoId: cargo.id,
              riscoOcupacionalId: riscoId,
              tipoAgente: riscoData.tipoAgente,
              descricaoRiscos: riscoData.descricaoRiscos,
              fonteGeradora: riscoData.fonteGeradora,
              tipo: riscoData.tipo,
              meioPropagacao: riscoData.meioPropagacao,
              meioContato: riscoData.meioContato,
              possiveisDanosSaude: riscoData.possiveisDanosSaude,
              tipoAnalise: riscoData.tipoAnalise,
              gradacaoEfeitos: riscoData.gradacaoEfeitos,
              gradacaoExposicao: riscoData.gradacaoExposicao,
            });
            console.log(`      ✅ Risco '${riscoData.nomeRisco}' vinculado ao cargo '${cargo.nomeCargo}'`);
          } else {
            // Atualizar dados do vínculo existente
            await db
              .update(cargoRiscos)
              .set({
                tipoAgente: riscoData.tipoAgente,
                descricaoRiscos: riscoData.descricaoRiscos,
                fonteGeradora: riscoData.fonteGeradora,
                tipo: riscoData.tipo,
                meioPropagacao: riscoData.meioPropagacao,
                meioContato: riscoData.meioContato,
                possiveisDanosSaude: riscoData.possiveisDanosSaude,
                tipoAnalise: riscoData.tipoAnalise,
                gradacaoEfeitos: riscoData.gradacaoEfeitos,
                gradacaoExposicao: riscoData.gradacaoExposicao,
              })
              .where(eq(cargoRiscos.id, vinculoExistente[0].id));
            console.log(`      🔄 Risco '${riscoData.nomeRisco}' atualizado para o cargo '${cargo.nomeCargo}'`);
          }
        }
      }
    }

    console.log("\n📈 Resumo:");
    console.log(`   Empresa: ${empresa.razaoSocial}`);
    console.log(`   Cargos processados: ${cargosEmpresa.length}`);
    console.log(`   Riscos criados/atualizados: ${Object.keys(riscosCriados).length}`);
    console.log("\n✅ Cadastro de riscos concluído com sucesso!");

  } catch (error: any) {
    console.error("❌ Erro ao cadastrar riscos:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

