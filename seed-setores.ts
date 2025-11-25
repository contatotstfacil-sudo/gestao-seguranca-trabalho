import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { setores } from "./drizzle/schema";
import mysql from "mysql2/promise";

// Lista completa de setores com descrições
const setoresParaInserir = [
  {
    nomeSetor: "Diretoria / Presidência",
    descricao: "Diretoria executiva e presidência da empresa, responsável pelas decisões estratégicas e governança corporativa."
  },
  {
    nomeSetor: "Departamento Financeiro",
    descricao: "Gestão financeira, contabilidade, controle orçamentário, fluxo de caixa e análises financeiras da empresa."
  },
  {
    nomeSetor: "Recursos Humanos (RH)",
    descricao: "Gestão de pessoas, recrutamento, seleção, treinamentos, folha de pagamento, benefícios e desenvolvimento organizacional."
  },
  {
    nomeSetor: "Departamento Jurídico",
    descricao: "Assessoria jurídica, contratos, processos, compliance, questões regulatórias e questões legais da empresa."
  },
  {
    nomeSetor: "Departamento Comercial",
    descricao: "Vendas, negociações comerciais, relacionamento com clientes, prospecção de novos negócios e gestão de carteira de clientes."
  },
  {
    nomeSetor: "Marketing e Comunicação",
    descricao: "Estratégias de marketing, comunicação corporativa, publicidade, branding, eventos e relacionamento com a mídia."
  },
  {
    nomeSetor: "Compras e Suprimentos",
    descricao: "Gestão de compras, negociação com fornecedores, controle de materiais, licitações e gestão de contratos de fornecimento."
  },
  {
    nomeSetor: "Almoxarifado / Logística",
    descricao: "Controle de estoque, armazenamento de materiais, movimentação de cargas, distribuição e gestão logística."
  },
  {
    nomeSetor: "Tecnologia da Informação (TI)",
    descricao: "Gestão de sistemas, infraestrutura de TI, suporte técnico, desenvolvimento, segurança da informação e tecnologia."
  },
  {
    nomeSetor: "Departamento Administrativo",
    descricao: "Gestão administrativa, documentação, protocolo, arquivo, atendimento e serviços administrativos gerais."
  },
  {
    nomeSetor: "Engenharia de Obras",
    descricao: "Projetos de engenharia, planejamento técnico, execução de obras, supervisão técnica e engenharia de campo."
  },
  {
    nomeSetor: "Departamento de Projetos",
    descricao: "Gestão de projetos, planejamento, acompanhamento de prazos, escopo, recursos e entrega de projetos."
  },
  {
    nomeSetor: "Planejamento e Controle de Obras (PCO)",
    descricao: "Planejamento de obras, cronogramas, controle de produção, acompanhamento físico-financeiro e gestão de obras."
  },
  {
    nomeSetor: "Segurança do Trabalho (SST)",
    descricao: "Gestão de segurança do trabalho, prevenção de acidentes, saúde ocupacional, NRs, EPIs e treinamentos de segurança."
  },
  {
    nomeSetor: "Qualidade (SGQ)",
    descricao: "Gestão da qualidade, controle de qualidade, auditorias, certificações, normas técnicas e garantia de qualidade."
  },
  {
    nomeSetor: "Meio Ambiente (SMA)",
    descricao: "Gestão ambiental, licenciamento ambiental, sustentabilidade, monitoramento ambiental e compliance ambiental."
  },
  {
    nomeSetor: "Topografia",
    descricao: "Levantamentos topográficos, georreferenciamento, locação de obras, cálculos de terraplanagem e serviços topográficos."
  },
  {
    nomeSetor: "Manutenção e Equipamentos",
    descricao: "Manutenção de equipamentos, máquinas e veículos, gestão de frota, manutenção preventiva e corretiva."
  },
  {
    nomeSetor: "Custos e Orçamentos",
    descricao: "Orçamentação de obras, composição de custos, análise de viabilidade, controle de custos e engenharia de custos."
  },
  {
    nomeSetor: "Pós-Obra / Assistência Técnica",
    descricao: "Assistência técnica pós-obra, garantia de obras, manutenção pós-entrega, atendimento ao cliente e suporte técnico."
  }
];

async function seedSetores() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);
    
    console.log("🏢 Iniciando inserção de setores...");
    console.log(`📋 Total: ${setoresParaInserir.length} setores para cadastrar`);
    
    // Verificar setores existentes para evitar duplicatas
    const setoresExistentes = await db.select({ nomeSetor: setores.nomeSetor }).from(setores);
    const nomesExistentes = new Set(setoresExistentes.map(s => s.nomeSetor));
    
    let inseridos = 0;
    let ignorados = 0;
    
    for (const setor of setoresParaInserir) {
      if (nomesExistentes.has(setor.nomeSetor)) {
        console.log(`⏭️  Setor já existe: ${setor.nomeSetor}`);
        ignorados++;
        continue;
      }
      
      try {
        await db.insert(setores).values({
          nomeSetor: setor.nomeSetor,
          descricao: setor.descricao,
          empresaId: null, // Setores globais, podem ser associados a empresas depois
        });
        inseridos++;
        console.log(`✅ Setor ${inseridos}/${setoresParaInserir.length} inserido: ${setor.nomeSetor}`);
      } catch (error) {
        console.error(`❌ Erro ao inserir setor ${setor.nomeSetor}:`, error);
      }
    }
    
    console.log("\n✨ Processo concluído!");
    console.log(`📊 Resumo:`);
    console.log(`   - Setores inseridos: ${inseridos}`);
    console.log(`   - Setores já existentes (ignorados): ${ignorados}`);
    console.log(`   - Total processado: ${setoresParaInserir.length}`);
    
    await connection.end();
    
  } catch (error) {
    console.error("❌ Erro ao inserir setores:", error);
    process.exit(1);
  }
}

seedSetores();

