import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { cargosCbo } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath, override: true });

/**
 * Gera descrição profissional baseada no nome do cargo CBO
 */
function gerarDescricaoCargo(nomeCargo: string, codigoCbo: string): string {
  const nome = nomeCargo.toLowerCase();
  
  // Padrões de descrição baseados no tipo de cargo
  const descricoes: { [key: string]: string } = {
    // Cargos de Saúde e Segurança
    "médico": "Profissional da medicina que atua na área de saúde ocupacional, realizando exames médicos, avaliações de capacidade laboral e prevenção de doenças profissionais.",
    "enfermeiro": "Profissional de enfermagem que desenvolve ações de promoção, proteção e recuperação da saúde dos trabalhadores no ambiente ocupacional.",
    "psicólogo": "Profissional que avalia o comportamento humano no trabalho, desenvolve programas de seleção, treinamento e desenvolvimento de pessoal.",
    "técnico de segurança": "Profissional que elabora e implementa programas de prevenção de acidentes do trabalho, inspecionando locais de trabalho e identificando riscos.",
    "engenheiro de segurança": "Engenheiro especializado em segurança do trabalho que elabora e implementa programas de prevenção de acidentes, inspecionando instalações e equipamentos.",
    
    // Cargos de Construção Civil - Ajudantes e Serventes
    "ajudante": "Trabalhador que auxilia profissionais especializados em suas atividades, preparando materiais, transportando ferramentas e executando tarefas auxiliares.",
    "servente": "Trabalhador que executa serviços auxiliares em obras e atividades diversas, como limpeza, transporte de materiais e apoio aos trabalhadores especializados.",
    
    // Cargos de Construção Civil - Especializados
    "pedreiro": "Profissional que executa serviços de alvenaria, como construção de paredes, muros e estruturas, aplicando revestimentos e assentando pisos e azulejos.",
    "carpinteiro": "Profissional que executa serviços de carpintaria, como construção de estruturas de madeira, confecção de portas, janelas e móveis.",
    "eletricista": "Profissional que executa instalações e manutenção de sistemas elétricos, como fiação, quadros de distribuição e equipamentos elétricos.",
    "encanador": "Profissional que executa instalações e manutenção de sistemas hidráulicos e sanitários, como tubulações, conexões e aparelhos sanitários.",
    "pintor": "Profissional que executa serviços de pintura, aplicando tintas, vernizes e outros revestimentos em superfícies diversas.",
    "soldador": "Profissional que executa serviços de solda em estruturas metálicas, utilizando diferentes processos de soldagem.",
    "gesseiro": "Profissional que executa serviços de aplicação de gesso em obras de construção civil, preparando e aplicando gesso em paredes e tetos.",
    "azulejista": "Profissional que executa serviços de assentamento de azulejos e revestimentos cerâmicos em obras de construção civil.",
    "armador": "Profissional que executa serviços de armação de estruturas de concreto armado, cortando, dobrando e posicionando barras de aço.",
    "cimenteiro": "Profissional que executa serviços de preparação e aplicação de concreto e argamassa em obras de construção civil.",
    
    // Operadores de Máquinas
    "operador": "Profissional que opera máquinas e equipamentos específicos, controlando processos de trabalho e garantindo a segurança das operações.",
    "operador de betoneira": "Profissional que opera betoneiras para preparação de concreto e argamassa em obras de construção civil.",
    "operador de guindaste": "Profissional que opera guindastes para movimentação de cargas e materiais em obras de construção civil.",
    "operador de escavadeira": "Profissional que opera escavadeiras para movimentação de terra e escavação em obras de construção civil.",
    "operador de trator": "Profissional que opera tratores para movimentação de terra e materiais em obras de construção civil.",
    "operador de empilhadeira": "Profissional que opera empilhadeiras para movimentação e armazenagem de materiais em obras e depósitos.",
    
    // Cargos Administrativos
    "auxiliar administrativo": "Profissional que executa atividades administrativas de rotina, como atendimento ao público, organização de documentos e apoio geral.",
    "secretário": "Profissional que presta apoio administrativo, organizando documentos, agendando compromissos e auxiliando na gestão de rotinas.",
    "assistente": "Profissional que presta apoio em atividades administrativas ou operacionais, auxiliando na execução de tarefas diversas.",
    
    // Cargos de Supervisão
    "supervisor": "Profissional que supervisiona equipes de trabalho, coordenando atividades, orientando colaboradores e garantindo o cumprimento de normas e procedimentos.",
    "encarregado": "Profissional que coordena equipes de trabalho, organizando atividades, distribuindo tarefas e garantindo a qualidade e segurança das operações.",
    "coordenador": "Profissional que coordena atividades e equipes, planejando, organizando e controlando processos de trabalho.",
    
    // Cargos de Direção
    "diretor": "Profissional de nível estratégico que dirige e administra organizações ou áreas específicas, definindo políticas e estratégias.",
    "gerente": "Profissional que gerencia áreas ou departamentos, planejando, organizando e controlando atividades e equipes.",
    
    // Cargos Técnicos
    "técnico": "Profissional técnico que executa atividades especializadas, aplicando conhecimentos técnicos específicos em sua área de atuação.",
    
    // Cargos de Ensino
    "professor": "Profissional que ministra aulas e desenvolve atividades educacionais, transmitindo conhecimentos e desenvolvendo competências.",
    "instrutor": "Profissional que ministra treinamentos e capacitações, desenvolvendo habilidades e competências específicas.",
    
    // Cargos de Manutenção
    "mecânico": "Profissional que executa serviços de manutenção e reparo em máquinas, equipamentos e veículos.",
    "eletromecânico": "Profissional que executa serviços de manutenção e reparo em sistemas eletromecânicos, combinando conhecimentos elétricos e mecânicos.",
  };
  
  // Buscar descrição específica por palavras-chave
  for (const [palavra, descricao] of Object.entries(descricoes)) {
    if (nome.includes(palavra)) {
      return descricao;
    }
  }
  
  // Descrições genéricas baseadas em padrões
  if (nome.includes("auxiliar") || nome.includes("ajudante")) {
    return `Profissional que auxilia em atividades relacionadas a ${nomeCargo.toLowerCase().replace(/^(auxiliar|ajudante)\s+(de|do|da|dos|das)?\s*/i, '')}, executando tarefas auxiliares e de apoio.`;
  }
  
  if (nome.includes("operador")) {
    const equipamento = nome.replace(/operador\s+(de|do|da|dos|das)?\s*/i, '');
    return `Profissional que opera ${equipamento}, controlando equipamentos e garantindo a segurança e eficiência das operações.`;
  }
  
  if (nome.includes("técnico")) {
    const area = nome.replace(/técnico\s+(de|do|da|em|dos|das)?\s*/i, '');
    return `Profissional técnico especializado em ${area}, executando atividades técnicas especializadas e aplicando conhecimentos específicos da área.`;
  }
  
  if (nome.includes("supervisor") || nome.includes("encarregado")) {
    const area = nome.replace(/(supervisor|encarregado)\s+(de|do|da|dos|das)?\s*/i, '');
    return `Profissional que supervisiona e coordena atividades relacionadas a ${area}, orientando equipes e garantindo o cumprimento de normas e procedimentos.`;
  }
  
  if (nome.includes("gerente") || nome.includes("diretor")) {
    const area = nome.replace(/(gerente|diretor)\s+(de|do|da|dos|das)?\s*/i, '');
    return `Profissional de nível gerencial que gerencia e administra atividades relacionadas a ${area}, planejando estratégias e coordenando equipes.`;
  }
  
  // Descrição padrão baseada no nome do cargo
  return `Profissional que atua na área de ${nomeCargo}, executando atividades específicas relacionadas à ocupação, aplicando conhecimentos e habilidades necessárias para o desempenho das funções.`;
}

/**
 * Analisa o código CBO para determinar família ocupacional
 */
function determinarFamiliaOcupacional(nomeCargo: string, codigoCbo: string): string {
  const nome = nomeCargo.toLowerCase();
  const codigo = codigoCbo.replace(/-/g, '');
  
  // Famílias baseadas em prefixos do código CBO
  const familiasPorCodigo: { [key: string]: string } = {
    "01": "Forças Armadas",
    "02": "Polícia Militar",
    "03": "Corpo de Bombeiros",
    "11": "Dirigentes e Gerentes",
    "21": "Profissionais das Ciências e das Artes",
    "22": "Profissionais de Nível Superior",
    "25": "Profissionais de Nível Superior - Psicologia",
    "31": "Técnicos de Nível Médio",
    "41": "Trabalhadores dos Serviços Administrativos",
    "51": "Trabalhadores dos Serviços",
    "61": "Produtores Agropecuários",
    "62": "Supervisores da Produção",
    "63": "Trabalhadores da Construção Civil",
    "71": "Trabalhadores da Extração de Minérios",
    "72": "Trabalhadores da Metalurgia",
    "73": "Trabalhadores da Indústria Têxtil",
    "74": "Trabalhadores da Indústria do Vestuário",
    "75": "Trabalhadores da Indústria Química",
    "76": "Trabalhadores da Indústria de Alimentos",
    "77": "Trabalhadores da Indústria Gráfica",
    "78": "Trabalhadores da Indústria de Madeira",
    "79": "Trabalhadores da Indústria de Papel e Celulose",
    "81": "Operadores de Instalações e Máquinas",
    "82": "Montadores",
    "91": "Trabalhadores de Manutenção e Reparo",
    "95": "Supervisores de Manutenção",
  };
  
  const prefixo = codigo.substring(0, 2);
  if (familiasPorCodigo[prefixo]) {
    return familiasPorCodigo[prefixo];
  }
  
  // Famílias baseadas no nome do cargo
  if (nome.includes("médico") || nome.includes("enfermeiro") || nome.includes("psicólogo")) {
    return "Profissionais de Saúde";
  }
  
  if (nome.includes("técnico de segurança") || nome.includes("engenheiro de segurança")) {
    return "Profissionais de Segurança do Trabalho";
  }
  
  if (nome.includes("pedreiro") || nome.includes("carpinteiro") || nome.includes("eletricista") || 
      nome.includes("ajudante") || nome.includes("servente") || nome.includes("operador")) {
    return "Trabalhadores da Construção Civil";
  }
  
  if (nome.includes("administrativo") || nome.includes("secretário") || nome.includes("assistente")) {
    return "Trabalhadores Administrativos";
  }
  
  if (nome.includes("supervisor") || nome.includes("encarregado") || nome.includes("coordenador")) {
    return "Supervisores e Coordenadores";
  }
  
  if (nome.includes("gerente") || nome.includes("diretor")) {
    return "Dirigentes e Gerentes";
  }
  
  return "Outras Ocupações";
}

async function gerarDescricoes() {
  try {
    console.log("🔄 Iniciando geração de descrições para CBOs...\n");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    // Buscar todos os CBOs sem descrição ou com descrição vazia
    const todosCargos = await db.select().from(cargosCbo);
    console.log(`📊 Total de CBOs no banco: ${todosCargos.length}\n`);
    
    let atualizados = 0;
    let comDescricao = 0;
    const batchSize = 100;
    
    for (let i = 0; i < todosCargos.length; i += batchSize) {
      const batch = todosCargos.slice(i, i + batchSize);
      
      for (const cargo of batch) {
        try {
          // Gerar descrição se não existir ou estiver vazia
          let descricao = cargo.descricao;
          let familia = cargo.familiaOcupacional;
          
          if (!descricao || descricao.trim() === "") {
            descricao = gerarDescricaoCargo(cargo.nomeCargo, cargo.codigoCbo);
            atualizados++;
          } else {
            comDescricao++;
          }
          
          // Gerar família ocupacional se não existir
          if (!familia || familia.trim() === "") {
            familia = determinarFamiliaOcupacional(cargo.nomeCargo, cargo.codigoCbo);
          }
          
          // Atualizar apenas se houver mudanças
          if (descricao !== cargo.descricao || familia !== cargo.familiaOcupacional) {
            await db
              .update(cargosCbo)
              .set({
                descricao: descricao,
                familiaOcupacional: familia,
                updatedAt: new Date(),
              })
              .where(eq(cargosCbo.id, cargo.id));
          }
        } catch (error: any) {
          console.error(`❌ Erro ao processar ${cargo.codigoCbo}: ${error.message}`);
        }
      }
      
      const progresso = Math.min(i + batchSize, todosCargos.length);
      const percentual = ((progresso / todosCargos.length) * 100).toFixed(1);
      console.log(`📊 Progresso: ${progresso}/${todosCargos.length} (${percentual}%) - Atualizados: ${atualizados}, Já tinham descrição: ${comDescricao}`);
    }
    
    console.log("\n✨ Geração de descrições concluída!\n");
    console.log("📊 Resumo:");
    console.log(`   ✅ CBOs atualizados: ${atualizados}`);
    console.log(`   📝 CBOs que já tinham descrição: ${comDescricao}`);
    console.log(`   📋 Total processado: ${todosCargos.length}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erro na geração:", error.message);
    process.exit(1);
  }
}

gerarDescricoes();


















