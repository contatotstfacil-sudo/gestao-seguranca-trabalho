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
      nome: "bronze",
      nomeExibicao: "Bronze",
      descricao: "Ideal para começar",
      precoMensal: 6790, // R$ 67,90 em centavos
      precoTrimestral: null,
      limiteEmpresas: null,
      limiteColaboradoresPorEmpresa: null,
      limiteColaboradoresTotal: null,
      recursos: JSON.stringify([
        "Ordens de serviço ilimitadas",
        "Fichas de EPI ilimitadas",
        "Certificados de treinamentos ilimitados",
        "Cadastro de cargos e setores ilimitado",
        "Gestão de ASOs ilimitada",
      ]),
      ativo: true,
      ordem: 1,
    },
    {
      nome: "prata",
      nomeExibicao: "Prata",
      descricao: "Para profissionais em crescimento",
      precoMensal: 9790, // R$ 97,90 em centavos
      precoTrimestral: null,
      limiteEmpresas: null,
      limiteColaboradoresPorEmpresa: null,
      limiteColaboradoresTotal: null,
      recursos: JSON.stringify([
        "Tudo do Bronze",
        "Ordens de serviço ilimitadas",
        "Fichas de EPI ilimitadas",
        "Certificados de treinamentos ilimitados",
        "Cadastro de cargos e setores ilimitado",
        "Gestão de ASOs ilimitada",
      ]),
      ativo: true,
      ordem: 2,
    },
    {
      nome: "ouro",
      nomeExibicao: "Ouro",
      descricao: "Para profissionais estabelecidos (mais popular)",
      precoMensal: 13790, // R$ 137,90 em centavos
      precoTrimestral: null,
      limiteEmpresas: null,
      limiteColaboradoresPorEmpresa: null,
      limiteColaboradoresTotal: null,
      recursos: JSON.stringify([
        "Tudo do Bronze + Prata",
        "Ordens de serviço ilimitadas",
        "Fichas de EPI ilimitadas",
        "Certificados de treinamentos ilimitados",
        "Cadastro de cargos e setores ilimitado",
        "Gestão de ASOs ilimitada",
      ]),
      ativo: true,
      ordem: 3,
    },
    {
      nome: "diamante",
      nomeExibicao: "Diamante",
      descricao: "Solução completa e inteligente (premium)",
      precoMensal: 19990, // R$ 199,90 em centavos
      precoTrimestral: null,
      limiteEmpresas: null,
      limiteColaboradoresPorEmpresa: null,
      limiteColaboradoresTotal: null,
      recursos: JSON.stringify([
        "Tudo do Ouro + Prata + Bronze",
        "Ordens de serviço ilimitadas",
        "Fichas de EPI ilimitadas",
        "Certificados de treinamentos ilimitados",
        "Cadastro de cargos e setores ilimitado",
        "Gestão de ASOs ilimitada",
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

