import { drizzle } from "drizzle-orm/mysql2";
import { colaboradores } from "./drizzle/schema.js";

// Dados para geração de colaboradores realistas
const nomesMasculinos = [
  "Carlos", "João", "Paulo", "Fernando", "Ricardo", "Roberto", "André", "Marcelo",
  "Felipe", "Lucas", "Diego", "Rodrigo", "Gustavo", "Bruno", "Thiago", "Matheus",
  "Daniel", "Fabio", "Julio", "Sergio", "Marcos", "Cesar", "Claudio", "Edson",
  "Gilson", "Heitor", "Igor", "Jair", "Kleber", "Leandro"
];

const nomesFemininos = [
  "Maria", "Ana", "Carla", "Paula", "Fernanda", "Roberta", "Andrea", "Marcia",
  "Felicia", "Lucia", "Diana", "Rodriga", "Gustava", "Bruna", "Thaisa", "Marta",
  "Daniela", "Fabiana", "Julia", "Sergio", "Marcia", "Cesaria", "Claudia", "Edna",
  "Gilsa", "Helena", "Iris", "Jaqueline", "Karina", "Leandra"
];

const sobrenomes = [
  "Silva", "Santos", "Oliveira", "Souza", "Costa", "Ferreira", "Gomes", "Martins",
  "Pereira", "Alves", "Rocha", "Carvalho", "Ribeiro", "Mendes", "Barbosa", "Monteiro",
  "Teixeira", "Machado", "Campos", "Dias", "Neves", "Pinto", "Lopes", "Moreira",
  "Vieira", "Castro", "Tavares", "Soares", "Correia", "Mota"
];

const setores = [
  "Administrativo",
  "Produção",
  "Qualidade",
  "Manutenção",
  "Recursos Humanos",
  "Financeiro",
  "Logística",
  "Segurança"
];

const funcoes = [
  "Técnico de Segurança do Trabalho",
  "Engenheiro Civil",
  "Pintor Interno",
  "Eletricista",
  "Encanador",
  "Carpinteiro",
  "Pedreiro",
  "Soldador",
  "Operador de Máquina",
  "Assistente Administrativo",
  "Gerente de Projeto",
  "Supervisor",
  "Aprendiz"
];

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const cidades = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Salvador",
  "Fortaleza", "Manaus", "Curitiba", "Recife", "Porto Alegre",
  "Belém", "Goiânia", "Guarulhos", "Campinas", "São Gonçalo"
];

const tiposLogradouro = [
  "Rua", "Avenida", "Travessa", "Alameda", "Praça", "Estrada", "Caminho"
];

// Função para gerar CPF válido (simplificado)
function gerarCPF() {
  let cpf = "";
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  
  // Calcula dígito verificador (simplificado)
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  
  cpf += digito1;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  
  cpf += digito2;
  
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Função para gerar PIS válido (simplificado)
function gerarPIS() {
  let pis = "";
  for (let i = 0; i < 10; i++) {
    pis += Math.floor(Math.random() * 10);
  }
  
  // Calcula dígito verificador
  const multiplicadores = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(pis[i]) * multiplicadores[i];
  }
  let resto = soma % 11;
  let digito = resto < 2 ? 0 : 11 - resto;
  
  pis += digito;
  
  return pis.replace(/(\d{3})(\d{5})(\d{2})(\d{2})/, "$1.$2.$3-$4");
}

// Função para gerar data de nascimento
function gerarDataNascimento(idadeMin, idadeMax) {
  const hoje = new Date();
  const anoMin = hoje.getFullYear() - idadeMax;
  const anoMax = hoje.getFullYear() - idadeMin;
  
  const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.floor(Math.random() * 28) + 1;
  
  return new Date(ano, mes, dia);
}

// Função para gerar RG
function gerarRG() {
  let rg = "";
  for (let i = 0; i < 8; i++) {
    rg += Math.floor(Math.random() * 10);
  }
  return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
}

// Função para gerar telefone
function gerarTelefone() {
  const ddd = String(Math.floor(Math.random() * 89) + 11).padStart(2, "0");
  const numero = String(Math.floor(Math.random() * 900000000) + 100000000).padStart(8, "0");
  return `(${ddd}) 9${numero.substring(0, 4)}-${numero.substring(4)}`;
}

// Função para gerar CEP
function gerarCEP() {
  const cep = String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, "0");
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// Função para gerar colaborador
function gerarColaborador(indice, ehAprendiz = false) {
  const isMasculino = Math.random() > 0.5;
  const nome = isMasculino 
    ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
    : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
  
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const nomeCompleto = `${nome} ${sobrenome}`;
  
  const dataNascimento = gerarDataNascimento(
    ehAprendiz ? 16 : 18,
    ehAprendiz ? 18 : 55
  );
  
  const estadoNascimento = estados[Math.floor(Math.random() * estados.length)];
  const cidadeNascimento = cidades[Math.floor(Math.random() * cidades.length)];
  
  const rg = gerarRG();
  const cpf = gerarCPF();
  const pis = gerarPIS();
  
  const tipoLogradouro = tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)];
  const nomeLogradouro = `${tipoLogradouro} ${Math.floor(Math.random() * 1000) + 1}`;
  const numero = String(Math.floor(Math.random() * 9999) + 1);
  const complemento = Math.random() > 0.7 ? `Apto ${Math.floor(Math.random() * 999) + 1}` : "";
  const bairro = `Bairro ${Math.floor(Math.random() * 100) + 1}`;
  const cidade = cidades[Math.floor(Math.random() * cidades.length)];
  const estado = estados[Math.floor(Math.random() * estados.length)];
  const cep = gerarCEP();
  
  const telefone1 = gerarTelefone();
  const telefone2 = Math.random() > 0.5 ? gerarTelefone() : null;
  
  const contatoEmergenciaNome = `${nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
  const contatoEmergenciaRelacao = ["Cônjuge", "Filho", "Filha", "Pai", "Mãe", "Irmão", "Irmã"][Math.floor(Math.random() * 7)];
  const contatoEmergenciaTelefone = gerarTelefone();
  
  const dataAdmissao = new Date();
  dataAdmissao.setDate(dataAdmissao.getDate() - Math.floor(Math.random() * 365 * 2)); // Até 2 anos atrás
  
  const dataPrimeiroASO = new Date(dataAdmissao);
  dataPrimeiroASO.setDate(dataPrimeiroASO.getDate() + Math.floor(Math.random() * 30));
  
  const validadeASO = new Date(dataPrimeiroASO);
  validadeASO.setFullYear(validadeASO.getFullYear() + 1);
  
  return {
    empresaId: 1, // Assumindo que existe uma empresa com ID 1
    nome: nomeCompleto,
    dataNascimento,
    cidadeNascimento,
    estadoNascimento,
    rg,
    cpf,
    pis,
    tipoLogradouro,
    nomeLogradouro,
    numero,
    complemento: complemento || null,
    bairro,
    cidade,
    estado,
    cep,
    telefone1,
    telefone2: telefone2 || null,
    contatoEmergenciaNome,
    contatoEmergenciaRelacao,
    contatoEmergenciaTelefone,
    dataAdmissao,
    dataPrimeiroASO,
    validadeASO,
    funcao: ehAprendiz ? "Aprendiz" : funcoes[Math.floor(Math.random() * (funcoes.length - 1))],
    setor: setores[Math.floor(Math.random() * setores.length)],
    sexo: isMasculino ? "masculino" : "feminino",
    status: "ativo",
    observacoes: `Colaborador ${indice + 1} - Gerado automaticamente para testes`
  };
}

// Função principal para inserir colaboradores
async function seedColaboradores() {
  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    console.log("🔄 Iniciando inserção de colaboradores...");
    
    // Gerar 30 colaboradores adultos
    const colaboradoresAdultos = [];
    for (let i = 0; i < 30; i++) {
      colaboradoresAdultos.push(gerarColaborador(i, false));
    }
    
    // Gerar 6 aprendizes
    const aprendizes = [];
    for (let i = 0; i < 6; i++) {
      aprendizes.push(gerarColaborador(30 + i, true));
    }
    
    const todosColaboradores = [...colaboradoresAdultos, ...aprendizes];
    
    // Inserir em lotes para evitar problemas
    const loteSize = 5;
    for (let i = 0; i < todosColaboradores.length; i += loteSize) {
      const lote = todosColaboradores.slice(i, i + loteSize);
      
      for (const colab of lote) {
        await db.insert(colaboradores).values(colab);
      }
      
      console.log(`✅ Inseridos ${Math.min(i + loteSize, todosColaboradores.length)} de ${todosColaboradores.length} colaboradores`);
    }
    
    console.log("✨ Todos os colaboradores foram inseridos com sucesso!");
    console.log(`📊 Total: ${todosColaboradores.length} colaboradores (30 adultos + 6 aprendizes)`);
    
  } catch (error) {
    console.error("❌ Erro ao inserir colaboradores:", error);
    process.exit(1);
  }
}

// Executar
seedColaboradores();
