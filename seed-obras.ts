import { drizzle } from "drizzle-orm/mysql2";
import { obras, empresas } from "./drizzle/schema";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";

// Tipos de obras
const tiposObras = [
  "Condomínio Residencial",
  "Edifício Residencial",
  "Shopping Center",
  "Prédio Comercial",
  "Obra de Infraestrutura",
  "Ponte e Viaduto",
  "Rodovia",
  "Hospital",
  "Escola",
  "Centro de Distribuição",
  "Indústria",
  "Residencial Popular",
  "Torre Empresarial",
  "Complexo Residencial",
  "Obra de Saneamento",
  "Pavimentação",
  "Construção de Túnel",
  "Aeroporto",
  "Porto",
  "Usina",
  "Estação de Tratamento",
  "Reforma e Ampliação"
];

// Prefixos de nomes de obras
const prefixosNomes = [
  "Residencial", "Condomínio", "Edifício", "Torre", "Complexo", "Centro",
  "Parque", "Vila", "Jardim", "Solar", "Green", "Premium", "Business",
  "Plaza", "Mall", "Avenue", "Square", "Tower", "Village", "City"
];

// Sufixos de nomes de obras
const sufixosNomes = [
  "Verde", "Azul", "Sol", "Lua", "Estrela", "Nova", "Alta", "Vista",
  "Bela", "Nova Esperança", "Brasil", "São Paulo", "Rio", "Atlântica",
  "Serra", "Vale", "Mar", "Praia", "Campo", "Floresta", "Parque", "Centro"
];

// Descrições de atividades
const descricoesAtividades = [
  "Construção de edifício residencial de alto padrão com 20 andares, 120 unidades, 4 elevadores, área de lazer completa com piscina, academia, salão de festas, playground e espaço gourmet. Obra prevista para 24 meses.",
  "Construção de condomínio horizontal fechado com 80 casas, infraestrutura completa, sistema de segurança, rede de esgoto, drenagem pluvial, pavimentação asfáltica e iluminação pública interna.",
  "Construção de shopping center com 3 pavimentos, 200 lojas, praça de alimentação, cinema, estacionamento para 500 veículos, área total de 50.000 m². Inclui obras de infraestrutura e acabamento.",
  "Construção de prédio comercial classe A com 25 andares, escritórios corporativos, 4 elevadores de alta velocidade, sistema de ar condicionado central, fachada envidraçada, estacionamento coberto.",
  "Obra de infraestrutura urbana: construção de rede de esgoto sanitário, drenagem pluvial, pavimentação asfáltica, calçamento, iluminação pública e sinalização viária em bairro residencial.",
  "Construção de ponte sobre rio com 200 metros de extensão, 4 faixas de rolamento, estrutura em concreto protendido, obras de arte especiais, terraplanagem e drenagem.",
  "Construção de rodovia pavimentada com 15 km de extensão, 2 pistas duplas, 4 faixas, acostamento, drenagem, sinalização horizontal e vertical, obras de arte correntes e especiais.",
  "Construção de hospital geral com 200 leitos, 8 salas cirúrgicas, pronto-socorro, UTI, laboratórios, centro de diagnóstico por imagem, heliponto e estacionamento para 300 veículos.",
  "Construção de escola pública com 12 salas de aula, laboratórios, biblioteca, quadra poliesportiva coberta, refeitório, área administrativa e estacionamento para professores e visitantes.",
  "Construção de centro de distribuição logístico com 10.000 m² de área coberta, docas de carga e descarga, sistema de armazenagem automatizado, escritórios e estacionamento para caminhões.",
  "Construção de galpão industrial com 8.000 m², estrutura metálica, sistema de combate a incêndio, escritórios administrativos, área de estacionamento e logística.",
  "Construção de conjunto habitacional popular com 200 unidades, infraestrutura completa, rede de água, esgoto, energia elétrica, pavimentação e área de lazer.",
  "Construção de torre empresarial com 30 andares, escritórios corporativos, salas de reunião, restaurante, estacionamento automatizado, fachada inteligente e sistema de automação.",
  "Construção de complexo residencial misto com edifícios residenciais, área comercial, praça central, área de lazer compartilhada, estacionamento e infraestrutura completa.",
  "Obra de saneamento básico: construção de estação de tratamento de esgoto, rede coletora, elevatórias, lagoas de tratamento e sistema de disposição final do efluente tratado.",
  "Pavimentação asfáltica de ruas e avenidas urbanas com 8 km de extensão, drenagem pluvial, sinalização horizontal e vertical, calçadas e ciclovia integrada.",
  "Construção de túnel rodoviário com 500 metros de extensão, 2 pistas duplas, sistema de ventilação, iluminação, drenagem, segurança e monitoramento eletrônico.",
  "Ampliação e modernização de aeroporto: construção de nova pista, terminal de passageiros, estacionamento, sistema de bagagens e infraestrutura aeroportuária complementar.",
  "Construção de terminal portuário com cais de atracação, armazéns, pátio de containers, sistema de guindastes, escritórios administrativos e infraestrutura portuária.",
  "Construção de usina hidrelétrica com barragem, casa de força, subestação, linhas de transmissão, obras civis auxiliares e sistema de controle e monitoramento.",
  "Construção de estação de tratamento de água (ETA) com capacidade de 500 litros/segundo, sistema de captação, floculação, decantação, filtração, desinfecção e reservatórios.",
  "Reforma e ampliação de edifício existente: modernização de fachada, atualização de sistemas elétricos e hidráulicos, ampliação de área útil, reforma de elevadores e áreas comuns."
];

// CNAEs de obras
const cnaes = [
  "4120400", // Construção de edifícios
  "4120400", // Construção de edifícios
  "4711301", // Comércio varejista de produtos alimentícios em geral
  "4110700", // Incorporação de empreendimentos imobiliários
  "4220100", // Construção de obras de infraestrutura
  "4211104", // Construção de obras de arte especiais
  "4211103", // Construção de rodovias e ferrovias
  "4110700", // Incorporação de empreendimentos imobiliários
  "4110700", // Incorporação de empreendimentos imobiliários
  "4211103", // Construção de rodovias e ferrovias
  "4120400", // Construção de edifícios
  "4120400", // Construção de edifícios
  "4110700", // Incorporação de empreendimentos imobiliários
  "4120400", // Construção de edifícios
  "4220100", // Construção de obras de infraestrutura
  "4212000", // Obras de urbanização
  "4211104", // Construção de obras de arte especiais
  "4220100", // Construção de obras de infraestrutura
  "4220100", // Construção de obras de infraestrutura
  "4220100", // Construção de obras de infraestrutura
  "4220100", // Construção de obras de infraestrutura
  "4120400"  // Construção de edifícios
];

// Cidades e estados
const cidadesPorEstado: Record<string, string[]> = {
  "SP": ["São Paulo", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Guarulhos", "Ribeirão Preto", "Sorocaba"],
  "RJ": ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Nova Iguaçu", "Campos dos Goytacazes", "Petrópolis"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Betim", "Juiz de Fora", "Montes Claros"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "Foz do Iguaçu"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Novo Hamburgo"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Itajaí", "São José"]
};

const estados = ["SP", "RJ", "MG", "PR", "RS", "SC"];

const tiposLogradouro = ["Avenida", "Rua", "Estrada", "Rodovia", "Alameda"];

const bairros = [
  "Centro", "Jardim América", "Vila Nova", "Bela Vista", "São José", "Jardim das Flores",
  "Parque Industrial", "Alto da Boa Vista", "Vila Rica", "São Cristóvão", "Boa Esperança",
  "Nova Esperança", "Jardim Primavera", "Santa Maria", "Vila Esperança", "Centro Histórico",
  "Jardim Bela Vista", "Vila Real", "São Francisco", "Parque Verde", "Industrial", "Residencial"
];

// Função para gerar CNPJ (pode usar da empresa ou gerar)
function gerarCNPJ(): string {
  let cnpj = "";
  for (let i = 0; i < 12; i++) {
    cnpj += Math.floor(Math.random() * 10);
  }
  
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * pesos1[i];
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  cnpj += digito1;
  
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * pesos2[i];
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  cnpj += digito2;
  
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// Função para gerar CNO (Cadastro Nacional de Obras)
function gerarCNO(): string {
  const numero = String(Math.floor(Math.random() * 900000000) + 100000000).padStart(9, "0");
  return numero.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
}

// Função para gerar CEP
function gerarCEP(): string {
  const cep = String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, "0");
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// Função para gerar nome de obra
function gerarNomeObra(indice: number): string {
  const tipo = tiposObras[indice % tiposObras.length];
  const prefixo = prefixosNomes[Math.floor(Math.random() * prefixosNomes.length)];
  const sufixo = sufixosNomes[Math.floor(Math.random() * sufixosNomes.length)];
  
  // Variação: às vezes usa só o tipo, às vezes adiciona prefixo/sufixo
  if (Math.random() > 0.5) {
    return `${tipo} ${prefixo} ${sufixo}`;
  } else {
    return `${tipo} ${sufixo}`;
  }
}

// Função para gerar endereço
function gerarEndereco() {
  const estado = estados[Math.floor(Math.random() * estados.length)];
  const cidades = cidadesPorEstado[estado];
  const cidade = cidades[Math.floor(Math.random() * cidades.length)];
  const tipoLog = tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)];
  
  const nomesLogradouros = [
    "das Flores", "dos Imigrantes", "Brigadeiro", "Paulista", "Atlântica",
    "Copacabana", "Bandeirantes", "Tiradentes", "Independência", "República",
    "Liberdade", "Brasil", "Nacional", "São Pedro", "São Paulo", "Getúlio Vargas",
    "Presidente Vargas", "7 de Setembro", "15 de Novembro", "da Paz"
  ];
  
  const nomeLogradouro = `${tipoLog} ${nomesLogradouros[Math.floor(Math.random() * nomesLogradouros.length)]}`;
  const numero = String(Math.floor(Math.random() * 9999) + 100);
  const bairro = bairros[Math.floor(Math.random() * bairros.length)];
  const complemento = Math.random() > 0.6 ? `Lote ${Math.floor(Math.random() * 100) + 1}` : null;
  
  return {
    tipoLogradouro: tipoLog,
    nomeLogradouro,
    numeroEndereco: numero,
    complementoEndereco: complemento,
    bairroEndereco: bairro,
    cidadeEndereco: cidade,
    estadoEndereco: estado,
    cepEndereco: gerarCEP(),
    endereco: `${tipoLog} ${nomeLogradouro}, ${numero}${complemento ? ` - ${complemento}` : ""}, ${bairro}, ${cidade}/${estado}, CEP: ${gerarCEP()}`
  };
}

// Função para gerar datas
function gerarDatas() {
  const hoje = new Date();
  const mesesAtras = Math.floor(Math.random() * 12) + 1; // 1 a 12 meses atrás
  const duracaoMeses = Math.floor(Math.random() * 24) + 6; // 6 a 30 meses de duração
  
  const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, hoje.getDate());
  const dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + duracaoMeses, dataInicio.getDate());
  
  // Algumas obras podem estar concluídas
  const concluida = Math.random() > 0.7; // 30% concluídas
  
  if (concluida && dataFim < hoje) {
    return {
      dataInicio,
      dataFim,
      status: "concluida" as const
    };
  }
  
  return {
    dataInicio,
    dataFim: null, // Obras ativas podem não ter data fim definida ainda
    status: "ativa" as const
  };
}

async function seedObras() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);
    
    console.log("🏗️  Iniciando inserção de obras...");
    console.log("📋 Meta: 22 obras vinculadas às empresas");
    
    // Buscar todas as empresas
    const empresasExistentes = await db.select().from(empresas);
    
    if (empresasExistentes.length === 0) {
      console.error("❌ Nenhuma empresa encontrada! Cadastre empresas primeiro.");
      await connection.end();
      process.exit(1);
    }
    
    console.log(`✅ Encontradas ${empresasExistentes.length} empresas`);
    
    // Distribuir 22 obras entre as empresas
    // Algumas empresas terão mais obras que outras
    const totalObras = 22;
    const obrasParaInserir = [];
    
    for (let i = 0; i < totalObras; i++) {
      // Selecionar empresa aleatória (com distribuição balanceada)
      const empresaIndex = i % empresasExistentes.length;
      const empresa = empresasExistentes[empresaIndex];
      
      const nomeObra = gerarNomeObra(i);
      const endereco = gerarEndereco();
      const datas = gerarDatas();
      
      const obra = {
        nomeObra,
        cnpj: empresa.cnpj || gerarCNPJ(), // Usar CNPJ da empresa ou gerar
        cno: gerarCNO(),
        cnae: cnaes[i % cnaes.length],
        descricaoAtividade: descricoesAtividades[i % descricoesAtividades.length],
        grauRisco: "4",
        quantidadePrevistoColaboradores: Math.floor(Math.random() * 100) + 10, // 10 a 110 colaboradores
        tipoLogradouro: endereco.tipoLogradouro,
        nomeLogradouro: endereco.nomeLogradouro,
        numeroEndereco: endereco.numeroEndereco,
        complementoEndereco: endereco.complementoEndereco,
        bairroEndereco: endereco.bairroEndereco,
        cidadeEndereco: endereco.cidadeEndereco,
        estadoEndereco: endereco.estadoEndereco,
        cepEndereco: endereco.cepEndereco,
        endereco: endereco.endereco,
        empresaId: empresa.id,
        dataInicio: datas.dataInicio,
        dataFim: datas.dataFim,
        status: datas.status
      };
      
      obrasParaInserir.push(obra);
    }
    
    // Inserir obras uma por uma
    for (let i = 0; i < obrasParaInserir.length; i++) {
      const obra = obrasParaInserir[i];
      try {
        await db.insert(obras).values(obra);
        const empresa = empresasExistentes.find(e => e.id === obra.empresaId);
        console.log(`✅ Obra ${i + 1}/22 inserida: ${obra.nomeObra} - Empresa: ${empresa?.razaoSocial || 'N/A'}`);
      } catch (err) {
        console.error(`❌ Erro ao inserir obra ${i + 1}:`, err);
        console.error("Obra:", obra);
      }
    }
    
    console.log("\n✨ Todas as obras foram inseridas com sucesso!");
    console.log(`📊 Total: ${obrasParaInserir.length} obras cadastradas`);
    
    // Estatísticas
    const obrasAtivas = obrasParaInserir.filter(o => o.status === "ativa").length;
    const obrasConcluidas = obrasParaInserir.filter(o => o.status === "concluida").length;
    console.log(`\n📈 Estatísticas:`);
    console.log(`   - Obras ativas: ${obrasAtivas}`);
    console.log(`   - Obras concluídas: ${obrasConcluidas}`);
    
    // Distribuição por empresa
    console.log(`\n📋 Distribuição por empresa:`);
    const obrasPorEmpresa = new Map<number, number>();
    obrasParaInserir.forEach(o => {
      obrasPorEmpresa.set(o.empresaId, (obrasPorEmpresa.get(o.empresaId) || 0) + 1);
    });
    
    obrasPorEmpresa.forEach((qtd, empresaId) => {
      const empresa = empresasExistentes.find(e => e.id === empresaId);
      console.log(`   - ${empresa?.razaoSocial || 'N/A'}: ${qtd} obra(s)`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error("❌ Erro ao inserir obras:", error);
    process.exit(1);
  }
}

seedObras();

