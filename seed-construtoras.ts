import { drizzle } from "drizzle-orm/mysql2";
import { empresas } from "./drizzle/schema";
import mysql from "mysql2/promise";

// Razões sociais realistas de construtoras
const razoesSociais = [
  "Construtora Horizonte Ltda",
  "Engenharia e Construções São Paulo S.A.",
  "Construtora Nacional do Brasil Ltda",
  "Obras e Empreendimentos Sudeste Ltda",
  "Construtora Rio Grande Engenharia S.A.",
  "Construções e Infraestrutura Brasil Ltda"
];

// CNAEs de construção civil
const cnaes = [
  "4120400", // Construção de edifícios
  "4211103", // Construção de rodovias e ferrovias
  "4211104", // Construção de obras de arte especiais
  "4220100", // Construção de obras de infraestrutura
  "4120400", // Construção de edifícios (residencial)
  "4212000"  // Obras de urbanização - ruas, praças e calçadas
];

// Descrições de atividades
const descricoesAtividades = [
  "Construção de edifícios residenciais e comerciais, incorporação imobiliária, execução de projetos arquitetônicos e de engenharia. Especializada em empreendimentos de alto padrão e médio porte.",
  "Construção de rodovias, ferrovias, pontes, viadutos e obras de arte especiais. Infraestrutura de transporte e logística. Execução de obras públicas e privadas de grande porte.",
  "Construção de edifícios residenciais, comerciais e industriais. Incorporação e construção para terceiros. Desenvolvimento de projetos de engenharia civil e arquitetura.",
  "Construção de obras de infraestrutura urbana, saneamento básico, drenagem, pavimentação e obras de terraplanagem. Especializada em infraestrutura para desenvolvimento urbano.",
  "Construção de edifícios residenciais de alto padrão, condomínios fechados, torres residenciais e comerciais. Incorporação imobiliária e gestão de empreendimentos.",
  "Construção de obras de urbanização, pavimentação asfáltica, calçamento, drenagem pluvial, iluminação pública e paisagismo. Obras de infraestrutura urbana e melhorias públicas."
];

// Responsáveis técnicos (engenheiros)
const responsaveisTecnicos = [
  "Eng. Carlos Eduardo Mendes - CREA SP 123456",
  "Eng. Fernanda Silva Santos - CREA RJ 234567",
  "Eng. Roberto Oliveira Costa - CREA MG 345678",
  "Eng. Ana Paula Rodrigues - CREA PR 456789",
  "Eng. João Pedro Alves - CREA RS 567890",
  "Eng. Mariana Campos Lima - CREA SC 678901"
];

// Cidades e estados
const cidadesPorEstado: Record<string, string[]> = {
  "SP": ["São Paulo", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Guarulhos"],
  "RJ": ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Nova Iguaçu", "Campos dos Goytacazes"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Betim", "Juiz de Fora"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Itajaí"]
};

const estados = ["SP", "RJ", "MG", "PR", "RS", "SC"];

const tiposLogradouro = ["Avenida", "Rua", "Alameda", "Estrada"];

// Função para gerar CNPJ válido
function gerarCNPJ(): string {
  // Gera os 12 primeiros dígitos
  let cnpj = "";
  for (let i = 0; i < 12; i++) {
    cnpj += Math.floor(Math.random() * 10);
  }
  
  // Calcula primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * pesos1[i];
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  cnpj += digito1;
  
  // Calcula segundo dígito verificador
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

// Função para gerar email corporativo baseado na razão social
function gerarEmail(razaoSocial: string): string {
  const nome = razaoSocial
    .toLowerCase()
    .replace(/construtora|engenharia|construções|construção|ltda|s\.a\.|brasil|nacional|do|da|dos|das|e/g, "")
    .trim()
    .replace(/\s+/g, "")
    .substring(0, 15);
  return `contato@${nome}.com.br`;
}

// Função para gerar CEP
function gerarCEP(): string {
  const cep = String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, "0");
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// Função para gerar endereço
function gerarEndereco(indice: number) {
  const estado = estados[indice];
  const cidades = cidadesPorEstado[estado];
  const cidade = cidades[Math.floor(Math.random() * cidades.length)];
  const tipoLog = tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)];
  
  // Nomes de logradouros corporativos
  const nomesLogradouros = [
    "das Flores", "dos Imigrantes", "Brigadeiro", "Paulista", "Atlântica",
    "Copacabana", "Ipanema", "Bandeirantes", "Tiradentes", "Independência",
    "República", "Liberdade", "Democracia", "Constituição", "Brasil"
  ];
  
  const nomeLogradouro = `${tipoLog} ${nomesLogradouros[Math.floor(Math.random() * nomesLogradouros.length)]}`;
  const numero = String(Math.floor(Math.random() * 9999) + 100);
  const complemento = Math.random() > 0.5 ? `Sala ${Math.floor(Math.random() * 500) + 100}` : null;
  
  return {
    tipoLogradouro: tipoLog,
    nomeLogradouro,
    numeroEndereco: numero,
    complementoEndereco: complemento,
    cidadeEndereco: cidade,
    estadoEndereco: estado,
    cep: gerarCEP()
  };
}

async function seedConstrutoras() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);
    
    console.log("🏗️  Iniciando inserção de construtoras...");
    console.log("📋 Meta: 6 construtoras com dados completos");
    
    // Verificar CNPJs existentes para evitar duplicatas
    const existentes = await db.select({ cnpj: empresas.cnpj }).from(empresas);
    const cnpjsUsados = new Set(existentes.map(e => e.cnpj).filter(Boolean));
    
    const construtoras = [];
    
    for (let i = 0; i < 6; i++) {
      // Gerar CNPJ único
      let cnpj = gerarCNPJ();
      while (cnpjsUsados.has(cnpj)) {
        cnpj = gerarCNPJ();
      }
      cnpjsUsados.add(cnpj);
      
      const razaoSocial = razoesSociais[i];
      const endereco = gerarEndereco(i);
      
      const empresa = {
        razaoSocial,
        cnpj,
        grauRisco: "4",
        cnae: cnaes[i],
        responsavelTecnico: responsaveisTecnicos[i],
        emailContato: gerarEmail(razaoSocial),
        tipoLogradouro: endereco.tipoLogradouro,
        nomeLogradouro: endereco.nomeLogradouro,
        numeroEndereco: endereco.numeroEndereco,
        complementoEndereco: endereco.complementoEndereco,
        cidadeEndereco: endereco.cidadeEndereco,
        estadoEndereco: endereco.estadoEndereco,
        cep: endereco.cep,
        descricaoAtividade: descricoesAtividades[i],
        status: "ativa" as const
      };
      
      construtoras.push(empresa);
    }
    
    // Inserir construtoras
    for (let i = 0; i < construtoras.length; i++) {
      await db.insert(empresas).values(construtoras[i]);
      console.log(`✅ Construora ${i + 1}/6 inserida: ${construtoras[i].razaoSocial}`);
    }
    
    console.log("✨ Todas as construtoras foram inseridas com sucesso!");
    console.log(`📊 Total: ${construtoras.length} construtoras cadastradas`);
    console.log("\n📋 Resumo das construtoras:");
    construtoras.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. ${emp.razaoSocial} - CNPJ: ${emp.cnpj} - ${emp.cidadeEndereco}/${emp.estadoEndereco}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error("❌ Erro ao inserir construtoras:", error);
    process.exit(1);
  }
}

seedConstrutoras();

