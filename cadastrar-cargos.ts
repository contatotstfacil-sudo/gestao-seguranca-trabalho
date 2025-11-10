import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { cargos } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const CARGOS_OFICIAIS = [
  {
    nomeCargo: "Diretor Geral",
    descricao: "Planeja, coordena e controla as atividades estratégicas e operacionais da empresa, definindo políticas e diretrizes organizacionais. Responsável pela tomada de decisões de alto nível, gestão de recursos e relacionamento com stakeholders."
  },
  {
    nomeCargo: "Assistente de Diretoria",
    descricao: "Presta suporte administrativo e executivo à diretoria, organizando agendas, preparando documentos, realizando pesquisas e facilitando a comunicação entre a diretoria e demais departamentos."
  },
  {
    nomeCargo: "Gerente Financeiro",
    descricao: "Coordena e controla as atividades financeiras da empresa, incluindo planejamento orçamentário, análise de custos, gestão de fluxo de caixa, controle de receitas e despesas, e elaboração de relatórios financeiros."
  },
  {
    nomeCargo: "Analista Financeiro",
    descricao: "Analisa dados financeiros, elabora relatórios, realiza projeções e estudos de viabilidade, acompanha indicadores financeiros e auxilia na tomada de decisões estratégicas relacionadas às finanças."
  },
  {
    nomeCargo: "Auxiliar Financeiro",
    descricao: "Auxilia nas rotinas financeiras, como lançamentos contábeis, conciliações bancárias, controle de contas a pagar e receber, e organização de documentos financeiros."
  },
  {
    nomeCargo: "Coordenador de RH",
    descricao: "Coordena as atividades de gestão de pessoas, incluindo recrutamento, seleção, treinamento, desenvolvimento, avaliação de desempenho, políticas de cargos e salários, e relações trabalhistas."
  },
  {
    nomeCargo: "Analista de RH",
    descricao: "Analisa e executa processos de recursos humanos, como recrutamento, seleção, treinamento, folha de pagamento, benefícios, e elabora relatórios e indicadores de RH."
  },
  {
    nomeCargo: "Assistente de RH",
    descricao: "Auxilia nas rotinas de recursos humanos, mantendo cadastros atualizados, organizando documentos, auxiliando em processos de admissão e demissão, e prestando apoio aos analistas de RH."
  },
  {
    nomeCargo: "Advogado",
    descricao: "Presta assessoria jurídica, elabora contratos, analisa questões legais, acompanha processos judiciais e administrativos, e fornece orientações sobre questões trabalhistas, contratuais e regulatórias."
  },
  {
    nomeCargo: "Auxiliar Jurídico",
    descricao: "Auxilia nas atividades jurídicas, organizando documentos, protocolando processos, mantendo arquivos atualizados, e prestando suporte aos advogados nas rotinas do departamento jurídico."
  },
  {
    nomeCargo: "Gerente Comercial",
    descricao: "Coordena e gerencia as atividades comerciais, estabelecendo estratégias de vendas, definindo metas, acompanhando o desempenho da equipe comercial, e desenvolvendo relacionamento com clientes estratégicos."
  },
  {
    nomeCargo: "Representante de Vendas",
    descricao: "Identifica oportunidades de negócios, realiza prospecção de clientes, apresenta produtos e serviços, negocia propostas comerciais, e mantém relacionamento com clientes para fidelização."
  },
  {
    nomeCargo: "Assistente Comercial",
    descricao: "Auxilia nas atividades comerciais, prestando suporte aos vendedores, organizando propostas, atendendo clientes, atualizando cadastros, e auxiliando na prospecção de novos negócios."
  },
  {
    nomeCargo: "Analista de Marketing",
    descricao: "Analisa mercado e comportamento do consumidor, desenvolve estratégias de marketing, planeja campanhas, monitora resultados, e utiliza ferramentas de marketing digital para promover a marca."
  },
  {
    nomeCargo: "Designer / Social Media",
    descricao: "Cria peças gráficas e conteúdo visual, gerencia redes sociais, desenvolve materiais de comunicação, cria identidade visual, e produz conteúdo para campanhas publicitárias e marketing digital."
  },
  {
    nomeCargo: "Coordenador de Compras",
    descricao: "Coordena as atividades de compras, estabelece estratégias de aquisição, negocia com fornecedores, gerencia contratos, controla estoques, e garante a qualidade e o melhor custo-benefício nas aquisições."
  },
  {
    nomeCargo: "Comprador",
    descricao: "Realiza pesquisas de fornecedores, solicita cotações, analisa propostas, efetua compras de materiais e serviços, acompanha entregas, e mantém relacionamento com fornecedores."
  },
  {
    nomeCargo: "Auxiliar de Suprimentos",
    descricao: "Auxilia nas atividades de compras e suprimentos, organizando documentos, atualizando cadastros de fornecedores, controlando pedidos, e prestando apoio ao setor de compras."
  },
  {
    nomeCargo: "Encarregado de Almoxarifado",
    descricao: "Coordena as atividades de almoxarifado, controla entrada e saída de materiais, organiza estoques, gerencia equipe, e garante a disponibilidade de materiais necessários às operações."
  },
  {
    nomeCargo: "Almoxarife",
    descricao: "Controla estoques, recebe e armazena materiais, realiza inventários, efetua entregas internas, controla movimentações, e mantém registros atualizados de entradas e saídas."
  },
  {
    nomeCargo: "Motorista / Entregador",
    descricao: "Conduz veículos para transporte de pessoas ou cargas, realiza entregas, mantém o veículo em condições adequadas, cumpre rotas estabelecidas, e segue normas de segurança no trânsito."
  },
  {
    nomeCargo: "Analista de Suporte",
    descricao: "Presta suporte técnico aos usuários, resolve problemas de sistemas e equipamentos, instala e configura software, realiza manutenção preventiva, e documenta soluções técnicas."
  },
  {
    nomeCargo: "Técnico de Informática",
    descricao: "Realiza manutenção de equipamentos de informática, instala e configura sistemas, resolve problemas técnicos, realiza backup de dados, e presta suporte técnico aos usuários."
  },
  {
    nomeCargo: "Assistente Administrativo",
    descricao: "Auxilia nas rotinas administrativas, organiza documentos, atende telefone, agenda compromissos, controla arquivos, e presta suporte geral às atividades administrativas da empresa."
  },
  {
    nomeCargo: "Recepcionista",
    descricao: "Atende visitantes e clientes, recebe e encaminha ligações, agenda compromissos, controla entrada e saída de pessoas, e é responsável pelo primeiro atendimento da empresa."
  },
  {
    nomeCargo: "Engenheiro Civil",
    descricao: "Projeta, coordena e supervisiona obras de construção civil, analisa projetos estruturais, calcula materiais e custos, gerencia equipes técnicas, e garante o cumprimento de normas técnicas e de segurança."
  },
  {
    nomeCargo: "Engenheiro de Produção",
    descricao: "Otimiza processos produtivos, planeja e controla produção, gerencia recursos, implementa melhorias, analisa custos, e desenvolve sistemas de gestão da qualidade e produtividade."
  },
  {
    nomeCargo: "Mestre de Obras",
    descricao: "Coordena e supervisiona equipes de construção, orienta operários, controla execução de serviços, verifica qualidade das obras, gerencia materiais e equipamentos, e garante cumprimento de prazos e especificações técnicas."
  },
  {
    nomeCargo: "Encarregado de Obra",
    descricao: "Coordena atividades na obra, supervisiona equipes, controla execução de serviços, gerencia materiais e equipamentos, verifica qualidade, e garante segurança e cumprimento de normas."
  },
  {
    nomeCargo: "Estagiário de Engenharia",
    descricao: "Auxilia engenheiros em atividades técnicas, realiza levantamentos, participa de projetos, colabora em cálculos e análises, e adquire experiência prática na área de engenharia."
  },
  {
    nomeCargo: "Arquiteto",
    descricao: "Projeta espaços arquitetônicos, elabora plantas e projetos, desenvolve soluções estéticas e funcionais, coordena projetos de construção, e acompanha a execução das obras."
  },
  {
    nomeCargo: "Desenhista Técnico",
    descricao: "Elabora desenhos técnicos, plantas e projetos, utiliza software CAD, detalha projetos de engenharia e arquitetura, e atualiza documentação técnica conforme especificações."
  },
  {
    nomeCargo: "Estagiário de Projetos",
    descricao: "Auxilia em atividades de projetos, realiza levantamentos, colabora na elaboração de desenhos técnicos, participa de estudos, e adquire experiência na área de projetos e planejamento."
  },
  {
    nomeCargo: "Engenheiro de Planejamento",
    descricao: "Planeja e controla obras e projetos, elabora cronogramas, analisa recursos necessários, gerencia prazos, monitora indicadores de desempenho, e otimiza processos construtivos."
  },
  {
    nomeCargo: "Analista de Controle de Obras",
    descricao: "Controla andamento de obras, elabora relatórios de acompanhamento, verifica cumprimento de prazos e metas, analisa indicadores, e auxilia no planejamento e gestão de obras."
  },
  {
    nomeCargo: "Técnico de Segurança do Trabalho",
    descricao: "Elabora e implementa programas de segurança do trabalho, realiza inspeções de segurança, investiga acidentes, ministra treinamentos, controla uso de EPIs, e garante cumprimento das NRs."
  },
  {
    nomeCargo: "Auxiliar de Segurança",
    descricao: "Auxilia nas atividades de segurança do trabalho, apoia inspeções, organiza documentos, controla EPIs, auxilia em treinamentos, e presta suporte ao técnico de segurança."
  },
  {
    nomeCargo: "Estagiário de SST",
    descricao: "Auxilia nas atividades de segurança do trabalho, participa de inspeções, colabora em campanhas de prevenção, atualiza documentos, e adquire experiência prática na área de SST."
  },
  {
    nomeCargo: "Coordenador de Qualidade",
    descricao: "Coordena o sistema de gestão da qualidade, estabelece padrões e procedimentos, realiza auditorias, gerencia certificações, implementa melhorias contínuas, e garante conformidade com normas."
  },
  {
    nomeCargo: "Inspetor de Qualidade",
    descricao: "Inspeciona produtos e serviços, verifica conformidade com especificações, realiza testes e ensaios, documenta não conformidades, e garante padrões de qualidade estabelecidos."
  },
  {
    nomeCargo: "Técnico Ambiental",
    descricao: "Desenvolve e executa programas ambientais, realiza monitoramento ambiental, elabora relatórios, acompanha licenças ambientais, implementa medidas de controle, e garante cumprimento da legislação ambiental."
  },
  {
    nomeCargo: "Auxiliar de Meio Ambiente",
    descricao: "Auxilia nas atividades ambientais, coleta dados, organiza documentos, apoia monitoramentos, controla resíduos, e presta suporte ao técnico ambiental nas rotinas do departamento."
  },
  {
    nomeCargo: "Topógrafo",
    descricao: "Realiza levantamentos topográficos, georreferenciamento e demarcação de terrenos, utiliza equipamentos de medição, elabora plantas e mapas, e fornece dados para projetos de engenharia."
  },
  {
    nomeCargo: "Auxiliar de Topografia",
    descricao: "Auxilia nas atividades topográficas, opera equipamentos de medição, marca pontos no terreno, organiza instrumentos, e presta suporte ao topógrafo em levantamentos de campo."
  },
  {
    nomeCargo: "Mecânico de Equipamentos",
    descricao: "Realiza manutenção e reparo de equipamentos e máquinas, diagnostica falhas, substitui peças, realiza ajustes, e garante funcionamento adequado dos equipamentos de construção."
  },
  {
    nomeCargo: "Eletricista de Manutenção",
    descricao: "Realiza manutenção elétrica, instala e repara sistemas elétricos, identifica e corrige falhas, realiza testes, e garante segurança e funcionamento adequado das instalações elétricas."
  },
  {
    nomeCargo: "Operador de Máquinas",
    descricao: "Opera máquinas e equipamentos de construção, como escavadeiras, retroescavadeiras, guindastes, realiza manutenção básica, e segue normas de segurança na operação."
  },
  {
    nomeCargo: "Auxiliar de Manutenção",
    descricao: "Auxilia nas atividades de manutenção, realiza limpeza de equipamentos, organiza ferramentas, apoia reparos, controla estoque de peças, e presta suporte aos técnicos de manutenção."
  },
  {
    nomeCargo: "Engenheiro Orçamentista",
    descricao: "Elabora orçamentos de obras e serviços, analisa custos, compõe preços, realiza levantamentos de quantitativos, analisa propostas, e fornece subsídios para licitações e negociações."
  },
  {
    nomeCargo: "Auxiliar de Custos",
    descricao: "Auxilia na elaboração de orçamentos e controle de custos, realiza levantamentos, organiza dados, atualiza planilhas, controla preços de materiais, e presta suporte ao orçamentista."
  },
  {
    nomeCargo: "Encarregado de Assistência Técnica",
    descricao: "Coordena serviços de assistência técnica pós-obra, gerencia equipes de manutenção, planeja atendimentos, controla garantias, e garante qualidade dos serviços de assistência ao cliente."
  },
  {
    nomeCargo: "Técnico de Manutenção",
    descricao: "Realiza manutenção corretiva e preventiva em instalações e equipamentos, identifica problemas, executa reparos, realiza testes, e garante funcionamento adequado dos sistemas."
  },
  {
    nomeCargo: "Ajudante de Obras",
    descricao: "Auxilia nas atividades de construção, realiza serviços gerais, prepara materiais, transporta cargas, executa limpeza, e presta suporte aos profissionais especializados nas obras."
  }
];

async function cadastrarCargos() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);

    console.log("🔄 Iniciando cadastro de cargos com descrições baseadas em CBO...");
    console.log(`📋 Total de cargos: ${CARGOS_OFICIAIS.length}`);

    // Buscar todos os cargos existentes
    const cargosExistentes = await db.select().from(cargos);
    console.log(`📊 Cargos existentes: ${cargosExistentes.length}`);

    let criados = 0;
    let atualizados = 0;

    // Processar cada cargo
    for (const cargo of CARGOS_OFICIAIS) {
      const existe = cargosExistentes.find(c => c.nomeCargo === cargo.nomeCargo);
      
      if (existe) {
        // Atualizar descrição se necessário
        if (existe.descricao !== cargo.descricao) {
          await db.update(cargos)
            .set({ descricao: cargo.descricao })
            .where(eq(cargos.id, existe.id));
          atualizados++;
          console.log(`   ✏️  Atualizado: ${cargo.nomeCargo}`);
        }
      } else {
        // Criar novo cargo
        await db.insert(cargos).values({
          nomeCargo: cargo.nomeCargo,
          descricao: cargo.descricao
        });
        criados++;
        console.log(`   ✅ Criado: ${cargo.nomeCargo}`);
      }
    }

    // Listar todos os cargos finais ordenados alfabeticamente
    const cargosFinais = await db.select().from(cargos).orderBy(cargos.nomeCargo);
    console.log(`\n✅ Processo concluído!`);
    console.log(`📊 Resumo:`);
    console.log(`   - Cargos criados: ${criados}`);
    console.log(`   - Cargos atualizados: ${atualizados}`);
    console.log(`   - Total de cargos cadastrados: ${cargosFinais.length}`);
    console.log(`\n📝 Lista de cargos (em ordem alfabética):`);
    cargosFinais.forEach((cargo, index) => {
      console.log(`   ${index + 1}. ${cargo.nomeCargo}`);
    });

    await connection.end();
  } catch (error) {
    console.error("❌ Erro ao cadastrar cargos:", error);
    process.exit(1);
  }
}

cadastrarCargos();
