import { drizzle } from "drizzle-orm/mysql2";
import { colaboradores } from "./drizzle/schema";
import mysql from "mysql2/promise";

// Reutilizar todas as funções e dados do seed principal
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
  "Administrativo", "Produção", "Qualidade", "Manutenção",
  "Recursos Humanos", "Financeiro", "Logística", "Segurança"
];

const funcoes = [
  "Técnico de Segurança do Trabalho", "Engenheiro Civil", "Pintor Interno",
  "Eletricista", "Encanador", "Carpinteiro", "Pedreiro", "Soldador",
  "Operador de Máquina", "Assistente Administrativo", "Gerente de Projeto", "Supervisor"
];

const cidadesPorEstado: Record<string, string[]> = {
  "AC": ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  "AL": ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo", "Penedo"],
  "AP": ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  "AM": ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé"],
  "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro", "Ilhéus", "Itabuna", "Barreiras"],
  "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca"],
  "DF": ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Planaltina"],
  "ES": ["Vitória", "Vila Velha", "Cariacica", "Serra", "Cachoeiro de Itapemirim"],
  "GO": ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas"],
  "MA": ["São Luís", "Imperatriz", "Caxias", "Timon", "Codó", "Paço do Lumiar"],
  "MT": ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres"],
  "MS": ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares"],
  "PA": ["Belém", "Ananindeua", "Marituba", "Paragominas", "Castanhal", "Abaetetuba"],
  "PB": ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "Foz do Iguaçu", "São José dos Pinhais"],
  "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho"],
  "PI": ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano"],
  "RJ": ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda"],
  "RN": ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Novo Hamburgo"],
  "RO": ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal"],
  "RR": ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "São José", "Criciúma", "Chapecó", "Itajaí"],
  "SP": ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba", "Santos", "Mauá", "Diadema", "Jundiaí"],
  "SE": ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão"],
  "TO": ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"]
};

const estados = Object.keys(cidadesPorEstado);

function obterCidadeAleatoria(estado: string): string {
  const cidades = cidadesPorEstado[estado] || ["Cidade Desconhecida"];
  return cidades[Math.floor(Math.random() * cidades.length)];
}

const tiposLogradouro = [
  "Rua", "Avenida", "Travessa", "Alameda", "Praça", "Estrada", "Caminho"
];

function gerarCPF() {
  let cpf = "";
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  
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

function gerarPIS() {
  let pis = "";
  for (let i = 0; i < 10; i++) {
    pis += Math.floor(Math.random() * 10);
  }
  
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

function gerarDataNascimento(idadeMin: number, idadeMax: number) {
  const hoje = new Date();
  const anoMin = hoje.getFullYear() - idadeMax;
  const anoMax = hoje.getFullYear() - idadeMin;
  
  const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.floor(Math.random() * 28) + 1;
  
  return new Date(ano, mes, dia);
}

function gerarRG() {
  let rg = "";
  for (let i = 0; i < 8; i++) {
    rg += Math.floor(Math.random() * 10);
  }
  return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
}

function gerarTelefone() {
  const ddd = String(Math.floor(Math.random() * 89) + 11).padStart(2, "0");
  const numero = String(Math.floor(Math.random() * 900000000) + 100000000).padStart(8, "0");
  return `(${ddd}) 9${numero.substring(0, 4)}-${numero.substring(4)}`;
}

function gerarCEP() {
  const cep = String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, "0");
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function gerarColaborador(indice: number, status: "ativo" | "inativo", ehAprendiz: boolean = false) {
  const isMasculino = Math.random() > 0.5;
  const nome = isMasculino 
    ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
    : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
  
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const nomeCompleto = `${nome} ${sobrenome}`;
  
  // Para inativos: idades mais variadas (25-60 anos)
  // Para aprendizes: 16-18 anos
  const dataNascimento = gerarDataNascimento(
    ehAprendiz ? 16 : (status === "inativo" ? 25 : 18),
    ehAprendiz ? 18 : (status === "inativo" ? 60 : 55)
  );
  
  const estadoNascimento = estados[Math.floor(Math.random() * estados.length)];
  const cidadeNascimento = obterCidadeAleatoria(estadoNascimento);
  
  const rg = gerarRG();
  const cpf = gerarCPF();
  const pis = gerarPIS();
  
  const estadoEndereco = estados[Math.floor(Math.random() * estados.length)];
  const cidadeEndereco = obterCidadeAleatoria(estadoEndereco);
  
  const tipoLogradouro = tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)];
  const nomeLogradouro = `${tipoLogradouro} ${Math.floor(Math.random() * 1000) + 1}`;
  const numero = String(Math.floor(Math.random() * 9999) + 1);
  const complemento = Math.random() > 0.7 ? `Apto ${Math.floor(Math.random() * 999) + 1}` : "";
  
  const bairros = [
    "Centro", "Jardim América", "Vila Nova", "Bela Vista", "São José", "Jardim das Flores",
    "Parque Industrial", "Alto da Boa Vista", "Vila Rica", "São Cristóvão", "Boa Esperança",
    "Nova Esperança", "Jardim Primavera", "Santa Maria", "Vila Esperança", "Centro Histórico",
    "Jardim Bela Vista", "Vila Real", "São Francisco", "Parque Verde"
  ];
  const bairro = bairros[Math.floor(Math.random() * bairros.length)];
  
  const cep = gerarCEP();
  
  const telefone1 = gerarTelefone();
  const telefone2 = Math.random() > 0.5 ? gerarTelefone() : null;
  
  const contatoEmergenciaNome = `${nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
  const contatoEmergenciaRelacao = ["Cônjuge", "Filho", "Filha", "Pai", "Mãe", "Irmão", "Irmã"][Math.floor(Math.random() * 7)];
  const contatoEmergenciaTelefone = gerarTelefone();
  
  // Para inativos: data de admissão mais antiga (3-10 anos atrás) e ASO vencido
  // Para aprendizes: data recente (últimos 6 meses a 2 anos)
  const hoje = new Date();
  let dataAdmissao: Date;
  let dataPrimeiroASO: Date;
  let validadeASO: Date;
  
  if (status === "inativo") {
    // Admitido há 3-10 anos, demitido há 3-12 meses
    const anosAtras = Math.floor(Math.random() * 7) + 3;
    dataAdmissao = new Date(hoje.getFullYear() - anosAtras, hoje.getMonth(), hoje.getDate());
    dataPrimeiroASO = new Date(dataAdmissao);
    dataPrimeiroASO.setDate(dataPrimeiroASO.getDate() + Math.floor(Math.random() * 30));
    // ASO vencido (há mais de 1 ano)
    validadeASO = new Date(dataPrimeiroASO);
    validadeASO.setFullYear(validadeASO.getFullYear() + 1);
    validadeASO.setMonth(validadeASO.getMonth() - Math.floor(Math.random() * 12) - 6); // Vencido há 6-18 meses
  } else {
    // Ativo: admissão recente
    const mesesAtras = ehAprendiz 
      ? Math.floor(Math.random() * 18) + 1  // 1-18 meses para aprendizes
      : Math.floor(Math.random() * 24) + 1; // 1-24 meses para outros
    dataAdmissao = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, hoje.getDate());
    dataPrimeiroASO = new Date(dataAdmissao);
    dataPrimeiroASO.setDate(dataPrimeiroASO.getDate() + Math.floor(Math.random() * 30));
    validadeASO = new Date(dataPrimeiroASO);
    validadeASO.setFullYear(validadeASO.getFullYear() + 1);
  }
  
  return {
    nomeCompleto,
    empresaId: 1,
    dataNascimento,
    cidadeNascimento,
    estadoNascimento,
    rg,
    cpf,
    pis,
    tipoLogradouro,
    nomeLogradouro,
    numeroEndereco: numero,
    complementoEndereco: complemento || null,
    cidadeEndereco: cidadeEndereco,
    estadoEndereco: estadoEndereco,
    cep,
    telefonePrincipal: telefone1,
    telefoneRecado: telefone2 || null,
    nomePessoaRecado: contatoEmergenciaNome,
    grauParentesco: contatoEmergenciaRelacao,
    dataAdmissao,
    dataPrimeiroAso: dataPrimeiroASO,
    validadeAso: validadeASO,
    funcao: ehAprendiz ? "Aprendiz" : funcoes[Math.floor(Math.random() * (funcoes.length - 1))],
    setor: setores[Math.floor(Math.random() * setores.length)],
    sexo: isMasculino ? "masculino" : "feminino",
    status,
    observacoes: status === "inativo" 
      ? `Colaborador inativo ${indice + 1} - Gerado automaticamente`
      : `Aprendiz ${indice + 1} - Gerado automaticamente`
  };
}

async function seedAdicionais() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);
    
    console.log("🔄 Iniciando inserção de colaboradores adicionais...");
    console.log("📋 Meta: 12 inativos + 4 aprendizes");
    
    // Obter documentos já usados para evitar duplicatas
    const existentes = await db.select({ cpf: colaboradores.cpf, rg: colaboradores.rg, pis: colaboradores.pis }).from(colaboradores);
    const usadosCPF = new Set(existentes.map(e => e.cpf).filter(Boolean));
    const usadosRG = new Set(existentes.map(e => e.rg).filter(Boolean));
    const usadosPIS = new Set(existentes.map(e => e.pis).filter(Boolean));
    
    const gerarUnico = (gerador: () => string, usados: Set<string | null>) => {
      let valor = gerador();
      while (usados.has(valor)) {
        valor = gerador();
      }
      usados.add(valor);
      return valor;
    };
    
    // Gerar 12 inativos
    console.log("👥 Gerando 12 colaboradores inativos...");
    const inativos = [];
    for (let i = 0; i < 12; i++) {
      const c = gerarColaborador(i, "inativo", false);
      inativos.push({
        ...c,
        cpf: gerarUnico(gerarCPF, usadosCPF),
        rg: gerarUnico(gerarRG, usadosRG),
        pis: gerarUnico(gerarPIS, usadosPIS),
      });
    }
    
    // Gerar 4 aprendizes
    console.log("🎓 Gerando 4 aprendizes...");
    const aprendizes = [];
    for (let i = 0; i < 4; i++) {
      const c = gerarColaborador(12 + i, "ativo", true);
      aprendizes.push({
        ...c,
        cpf: gerarUnico(gerarCPF, usadosCPF),
        rg: gerarUnico(gerarRG, usadosRG),
        pis: gerarUnico(gerarPIS, usadosPIS),
      });
    }
    
    const todosColaboradores = [...inativos, ...aprendizes];
    
    // Inserir em lotes
    const loteSize = 5;
    for (let i = 0; i < todosColaboradores.length; i += loteSize) {
      const lote = todosColaboradores.slice(i, i + loteSize);
      
      for (const colab of lote) {
        await db.insert(colaboradores).values(colab);
      }
      
      console.log(`✅ Inseridos ${Math.min(i + loteSize, todosColaboradores.length)} de ${todosColaboradores.length} colaboradores`);
    }
    
    console.log("✨ Todos os colaboradores adicionais foram inseridos com sucesso!");
    console.log(`📊 Total: ${todosColaboradores.length} colaboradores (12 inativos + 4 aprendizes)`);
    
    await connection.end();
    
  } catch (error) {
    console.error("❌ Erro ao inserir colaboradores:", error);
    process.exit(1);
  }
}

seedAdicionais();

