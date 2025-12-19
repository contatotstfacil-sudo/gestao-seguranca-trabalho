/**
 * Script para popular os planos iniciais no banco de dados
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

import { getDb } from "../server/db";
import { planos } from "../drizzle/schema";

async function popularPlanos() {
  console.log("📦 Populando planos iniciais...");

  const db = await getDb();
  if (!db) {
    throw new Error("Não foi possível conectar ao banco de dados");
  }

  const planosIniciais = [
    {
      nome: "basico",
      nomeExibicao: "Básico",
      descricao: "Para empresas que querem sistema fácil e barato",
      precoMensal: 14700, // R$ 147,00 em centavos
      precoTrimestral: 39700, // R$ 397,00 em centavos
      limiteEmpresas: 1,
      limiteColaboradoresPorEmpresa: null, // Sem limite por empresa
      limiteColaboradoresTotal: 50,
      recursos: JSON.stringify([
        "Gestão completa de treinamentos",
        "Controle total de EPIs",
        "Emissão de certificados digitais",
        "Alertas automáticos",
        "Suporte por email",
        "Treinamento básico",
        "Sistema fácil de usar",
      ]),
      ativo: true,
      ordem: 1,
    },
    {
      nome: "tecnico",
      nomeExibicao: "Técnico/Engenheiro",
      descricao: "O plano perfeito para profissionais autônomos que querem otimizar e ganhar tempo",
      precoMensal: 14700, // R$ 147,00 em centavos
      precoTrimestral: 39700, // R$ 397,00 em centavos
      limiteEmpresas: 6,
      limiteColaboradoresPorEmpresa: 30,
      limiteColaboradoresTotal: null, // Total calculado: 6 × 30 = 180
      recursos: JSON.stringify([
        "Até 6 empresas diferentes",
        "Até 30 colaboradores por empresa",
        "Total: até 180 colaboradores",
        "Ganhe 40 horas/mês de tempo livre",
        "Controle total e qualidade garantida",
        "Emissão ilimitada de certificados",
        "Sistema fácil - aprenda em minutos",
        "Relatórios profissionais por empresa",
        "Modelos personalizáveis",
        "Suporte especializado",
        "Acesso mobile completo",
        "Preço justo e acessível",
      ]),
      ativo: true,
      ordem: 2,
    },
    {
      nome: "profissional",
      nomeExibicao: "Profissional",
      descricao: "Para empresas que querem otimizar processos e garantir qualidade",
      precoMensal: 29700, // R$ 297,00 em centavos
      precoTrimestral: 79700, // R$ 797,00 em centavos
      limiteEmpresas: null, // Ilimitado
      limiteColaboradoresPorEmpresa: null, // Ilimitado
      limiteColaboradoresTotal: 200,
      recursos: JSON.stringify([
        "Até 200 colaboradores",
        "Otimização completa de processos",
        "Controle total e qualidade garantida",
        "Múltiplas empresas ilimitadas",
        "Relatórios avançados profissionais",
        "Suporte prioritário 24/7",
        "Ganhe tempo e eficiência",
        "Sistema completo e fácil",
      ]),
      ativo: true,
      ordem: 3,
    },
    {
      nome: "enterprise",
      nomeExibicao: "Enterprise",
      descricao: "Solução personalizada para grandes empresas",
      precoMensal: 0, // Sob consulta
      precoTrimestral: 0, // Sob consulta
      limiteEmpresas: null, // Ilimitado
      limiteColaboradoresPorEmpresa: null, // Ilimitado
      limiteColaboradoresTotal: null, // Ilimitado
      recursos: JSON.stringify([
        "Colaboradores ilimitados",
        "Customizações exclusivas",
        "API completa integrada",
        "Suporte dedicado 24/7",
        "Treinamento completo da equipe",
        "Consultoria especializada mensal",
        "SLA garantido 99.9%",
        "Onboarding personalizado",
      ]),
      ativo: true,
      ordem: 4,
    },
  ];

  try {
    // Verificar se os planos já existem
    const planosExistentes = await db.select().from(planos);

    if (planosExistentes.length > 0) {
      console.log("⚠️  Planos já existem no banco. Pulando criação...");
      console.log(`   Encontrados ${planosExistentes.length} plano(s)`);
      return;
    }

    // Inserir planos
    for (const plano of planosIniciais) {
      await db.insert(planos).values(plano);
      console.log(`✅ Plano "${plano.nomeExibicao}" criado`);
    }

    console.log("\n✅ Todos os planos foram criados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular planos:", error);
    throw error;
  }
}

// Executar se chamado diretamente
popularPlanos()
  .then(() => {
    console.log("\n🎉 Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });

export { popularPlanos };

