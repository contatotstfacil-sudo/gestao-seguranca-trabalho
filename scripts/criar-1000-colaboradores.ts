import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Nomes brasileiros fictícios
const nomesMasculinos = [
  "João", "José", "Antônio", "Francisco", "Carlos", "Paulo", "Pedro", "Lucas", "Luiz", "Marcos",
  "Fernando", "Rafael", "Rodrigo", "Bruno", "Eduardo", "Felipe", "Gabriel", "Gustavo", "Henrique", "Igor",
  "Leonardo", "Marcelo", "Maurício", "Nicolas", "Otávio", "Ricardo", "Roberto", "Sérgio", "Thiago", "Vinicius",
  "André", "Daniel", "Diego", "Fábio", "Guilherme", "Hugo", "Jorge", "Juliano", "Leandro", "Matheus",
  "Miguel", "Renato", "Rodolfo", "Samuel", "Tiago", "Vagner", "Wagner", "Alexandre", "Alberto", "Armando"
];

const nomesFemininos = [
  "Maria", "Ana", "Fernanda", "Juliana", "Patrícia", "Mariana", "Camila", "Amanda", "Bruna", "Carolina",
  "Cristina", "Daniela", "Elaine", "Fabiana", "Gabriela", "Helena", "Isabela", "Jéssica", "Karina", "Larissa",
  "Letícia", "Luciana", "Marcia", "Natália", "Priscila", "Renata", "Sandra", "Tatiana", "Vanessa", "Viviane",
  "Adriana", "Aline", "Andréia", "Beatriz", "Bianca", "Claudia", "Débora", "Eliane", "Flávia", "Gisele",
  "Ingrid", "Jaqueline", "Kelly", "Lilian", "Márcia", "Nádia", "Olívia", "Paula", "Raquel", "Simone"
];

const sobrenomes = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Ribeiro", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias",
  "Monteiro", "Mendes", "Moreira", "Freitas", "Martins", "Araújo", "Melo", "Cardoso", "Teixeira", "Costa",
  "Ramos", "Reis", "Nascimento", "Machado", "Araújo", "Cavalcanti", "Nunes", "Moraes", "Barros", "Campos"
];

const estados = ["SP", "RJ", "MG", "RS", "PR", "SC", "BA", "GO", "PE", "CE", "DF", "ES", "MT", "MS", "PA", "PB", "RN", "AL", "SE", "TO", "AC", "AM", "AP", "RO", "RR"];

const cidades = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Brasília", "Salvador", "Fortaleza",
  "Recife", "Manaus", "Belém", "Goiânia", "Vitória", "Florianópolis", "Campinas", "São Luís", "Maceió", "Natal",
  "João Pessoa", "Aracaju", "Teresina", "Cuiabá", "Campo Grande", "Macapá", "Rio Branco", "Porto Velho", "Boa Vista"
];

const tiposLogradouro = ["Rua", "Avenida", "Travessa", "Praça", "Alameda", "Estrada", "Rodovia", "Viela"];

const grausParentesco = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(ã)", "Avô(ó)", "Tio(a)", "Primo(a)"];

// Função para gerar CPF único
const cpfsGerados = new Set<string>();

function gerarCPF(): string {
  let cpf: string;
  do {
    const n1 = Math.floor(Math.random() * 9);
    const n2 = Math.floor(Math.random() * 9);
    const n3 = Math.floor(Math.random() * 9);
    const n4 = Math.floor(Math.random() * 9);
    const n5 = Math.floor(Math.random() * 9);
    const n6 = Math.floor(Math.random() * 9);
    const n7 = Math.floor(Math.random() * 9);
    const n8 = Math.floor(Math.random() * 9);
    const n9 = Math.floor(Math.random() * 9);
    
    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    
    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    
    cpf = `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
  } while (cpfsGerados.has(cpf));
  
  cpfsGerados.add(cpf);
  return cpf;
}

// Função para gerar RG único
const rgsGerados = new Set<string>();

function gerarRG(): string {
  let rg: string;
  do {
    rg = `${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`;
  } while (rgsGerados.has(rg));
  rgsGerados.add(rg);
  return rg;
}

// Função para gerar PIS único
const pisGerados = new Set<string>();

function gerarPIS(): string {
  let pis: string;
  do {
    pis = `${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9000) + 1000}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`;
  } while (pisGerados.has(pis));
  pisGerados.add(pis);
  return pis;
}

// Função para gerar telefone
function gerarTelefone(): string {
  const ddd = Math.floor(Math.random() * 90) + 10;
  const numero = Math.floor(Math.random() * 90000000) + 10000000;
  return `(${ddd}) ${numero.toString().substring(0, 4)}-${numero.toString().substring(4)}`;
}

// Função para gerar CEP
function gerarCEP(): string {
  return `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`;
}

// Função para gerar data aleatória entre 1 mês e 10 anos atrás
function gerarDataAdmissao(): Date {
  const hoje = new Date();
  const umMesAtras = new Date(hoje);
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);
  
  const dezAnosAtras = new Date(hoje);
  dezAnosAtras.setFullYear(dezAnosAtras.getFullYear() - 10);
  
  const diffTime = umMesAtras.getTime() - dezAnosAtras.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const randomDays = Math.floor(Math.random() * diffDays);
  
  const data = new Date(dezAnosAtras);
  data.setDate(data.getDate() + randomDays);
  
  return data;
}

// Função para gerar data de nascimento (entre 18 e 65 anos)
function gerarDataNascimento(): Date {
  const hoje = new Date();
  const idadeMin = 18;
  const idadeMax = 65;
  
  const anoMin = hoje.getFullYear() - idadeMax;
  const anoMax = hoje.getFullYear() - idadeMin;
  
  const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.floor(Math.random() * 28) + 1;
  
  return new Date(ano, mes, dia);
}

// Função para formatar data para MySQL
function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

async function criarColaboradores() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Buscando empresas...");
    const [empresas] = await connection.execute("SELECT id, tenantId FROM empresas ORDER BY id");
    const empresasList = empresas as any[];
    
    if (empresasList.length === 0) {
      throw new Error("Nenhuma empresa encontrada. Cadastre empresas primeiro.");
    }

    console.log(`✅ ${empresasList.length} empresas encontradas`);

    console.log("🔄 Buscando cargos...");
    const [cargos] = await connection.execute("SELECT id FROM cargos ORDER BY id");
    const cargosList = cargos as any[];
    
    if (cargosList.length === 0) {
      throw new Error("Nenhum cargo encontrado. Cadastre cargos primeiro.");
    }

    console.log(`✅ ${cargosList.length} cargos encontrados`);

    console.log("🔄 Buscando setores...");
    const [setores] = await connection.execute("SELECT id FROM setores ORDER BY id");
    const setoresList = setores as any[];
    
    console.log(`✅ ${setoresList.length} setores encontrados`);

    // Distribuição não proporcional entre empresas (pesos diferentes)
    const pesos = empresasList.map((_, i) => {
      // Primeira empresa recebe mais, depois vai diminuindo
      return empresasList.length - i;
    });
    const totalPesos = pesos.reduce((a, b) => a + b, 0);

    // Gerar 1000 colaboradores
    const totalColaboradores = 1000;
    const colaboradores: any[] = [];
    const distribuicao: { [key: number]: number } = {};

    console.log("🔄 Gerando colaboradores...");

    for (let i = 0; i < totalColaboradores; i++) {
      // Escolher empresa baseado nos pesos
      let random = Math.random() * totalPesos;
      let empresaIndex = 0;
      for (let j = 0; j < pesos.length; j++) {
        random -= pesos[j];
        if (random <= 0) {
          empresaIndex = j;
          break;
        }
      }
      
      const empresa = empresasList[empresaIndex];
      if (!distribuicao[empresa.id]) {
        distribuicao[empresa.id] = 0;
      }
      distribuicao[empresa.id]++;

      // Escolher sexo (70% masculino, 30% feminino)
      const sexoRandom = Math.random();
      const sexo = sexoRandom < 0.7 ? "masculino" : sexoRandom < 0.97 ? "feminino" : "outro";
      
      // Gerar nome
      const nomes = sexo === "masculino" ? nomesMasculinos : nomesFemininos;
      const primeiroNome = nomes[Math.floor(Math.random() * nomes.length)];
      const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
      const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
      const nomeCompleto = `${primeiroNome} ${sobrenome1} ${sobrenome2}`;

      // Escolher cargo e setor aleatórios
      const cargoId = cargosList[Math.floor(Math.random() * cargosList.length)].id;
      const setorId = setoresList.length > 0 ? setoresList[Math.floor(Math.random() * setoresList.length)].id : null;

      // Gerar datas
      const dataAdmissao = gerarDataAdmissao();
      const dataNascimento = gerarDataNascimento();
      
      // Data primeiro ASO (poucos dias após admissão)
      const dataPrimeiroAso = new Date(dataAdmissao);
      dataPrimeiroAso.setDate(dataPrimeiroAso.getDate() + Math.floor(Math.random() * 30) + 1);
      
      // Validade ASO (1 ano após primeiro ASO)
      const validadeAso = new Date(dataPrimeiroAso);
      validadeAso.setFullYear(validadeAso.getFullYear() + 1);

      // Status (150 inativos, 850 ativos)
      const status = i < 150 ? "inativo" : "ativo";

      // Estado e cidade
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const cidade = cidades[Math.floor(Math.random() * cidades.length)];

      colaboradores.push({
        tenantId: empresa.tenantId,
        nomeCompleto,
        cargoId,
        setorId,
        empresaId: empresa.id,
        obraId: null,
        dataAdmissao: formatarData(dataAdmissao),
        dataPrimeiroAso: formatarData(dataPrimeiroAso),
        validadeAso: formatarData(validadeAso),
        rg: gerarRG(),
        cpf: gerarCPF(),
        pis: gerarPIS(),
        dataNascimento: formatarData(dataNascimento),
        cidadeNascimento: cidade,
        estadoNascimento: estado,
        sexo,
        tipoLogradouro: tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)],
        nomeLogradouro: `${nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`,
        numeroEndereco: String(Math.floor(Math.random() * 9999) + 1),
        complementoEndereco: Math.random() > 0.5 ? `Apto ${Math.floor(Math.random() * 200) + 1}` : null,
        cidadeEndereco: cidade,
        estadoEndereco: estado,
        cep: gerarCEP(),
        telefonePrincipal: gerarTelefone(),
        telefoneRecado: gerarTelefone(),
        nomePessoaRecado: `${nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`,
        grauParentesco: grausParentesco[Math.floor(Math.random() * grausParentesco.length)],
        observacoes: Math.random() > 0.8 ? "Colaborador dedicado e comprometido com a segurança do trabalho." : null,
        status,
      });

      if ((i + 1) % 100 === 0) {
        console.log(`✅ ${i + 1}/${totalColaboradores} colaboradores gerados...`);
      }
    }

    console.log("\n📊 Distribuição por empresa:");
    for (const [empresaId, quantidade] of Object.entries(distribuicao)) {
      const empresa = empresasList.find(e => e.id === parseInt(empresaId));
      console.log(`  Empresa ID ${empresaId}: ${quantidade} colaboradores`);
    }

    console.log("\n🔄 Inserindo colaboradores no banco de dados...");
    
    // Inserir em lotes de 50 para evitar queries muito grandes
    const batchSize = 50;
    for (let i = 0; i < colaboradores.length; i += batchSize) {
      const batch = colaboradores.slice(i, i + batchSize);
      
      const campos = [
        "tenantId", "nomeCompleto", "cargoId", "setorId", "empresaId", "obraId",
        "dataAdmissao", "dataPrimeiroAso", "validadeAso", "rg", "cpf", "pis",
        "dataNascimento", "cidadeNascimento", "estadoNascimento", "sexo",
        "tipoLogradouro", "nomeLogradouro", "numeroEndereco", "complementoEndereco",
        "cidadeEndereco", "estadoEndereco", "cep", "telefonePrincipal", "telefoneRecado",
        "nomePessoaRecado", "grauParentesco", "observacoes", "status"
      ].join(", ");
      
      const valores = batch.map(colab => {
        const valoresArray = [
          colab.tenantId,
          `'${colab.nomeCompleto.replace(/'/g, "''")}'`,
          colab.cargoId,
          colab.setorId || "NULL",
          colab.empresaId,
          "NULL",
          `'${colab.dataAdmissao}'`,
          `'${colab.dataPrimeiroAso}'`,
          `'${colab.validadeAso}'`,
          `'${colab.rg}'`,
          `'${colab.cpf}'`,
          `'${colab.pis}'`,
          `'${colab.dataNascimento}'`,
          `'${colab.cidadeNascimento.replace(/'/g, "''")}'`,
          `'${colab.estadoNascimento}'`,
          `'${colab.sexo}'`,
          `'${colab.tipoLogradouro}'`,
          `'${colab.nomeLogradouro.replace(/'/g, "''")}'`,
          `'${colab.numeroEndereco}'`,
          colab.complementoEndereco ? `'${colab.complementoEndereco.replace(/'/g, "''")}'` : "NULL",
          `'${colab.cidadeEndereco.replace(/'/g, "''")}'`,
          `'${colab.estadoEndereco}'`,
          `'${colab.cep}'`,
          `'${colab.telefonePrincipal}'`,
          `'${colab.telefoneRecado}'`,
          `'${colab.nomePessoaRecado.replace(/'/g, "''")}'`,
          `'${colab.grauParentesco}'`,
          colab.observacoes ? `'${colab.observacoes.replace(/'/g, "''")}'` : "NULL",
          `'${colab.status}'`
        ];
        return `(${valoresArray.join(", ")})`;
      }).join(", ");
      
      const sql = `INSERT INTO colaboradores (${campos}) VALUES ${valores}`;
      await connection.execute(sql);
      
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(colaboradores.length / batchSize)} inserido (${i + batch.length}/${totalColaboradores})`);
    }

    console.log(`\n✅ ${totalColaboradores} colaboradores criados com sucesso!`);
    console.log(`   - ${850} ativos`);
    console.log(`   - ${150} inativos`);

  } catch (error) {
    console.error("❌ Erro ao criar colaboradores:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
criarColaboradores()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

