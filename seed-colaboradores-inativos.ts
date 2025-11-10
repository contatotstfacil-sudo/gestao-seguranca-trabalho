import { getDb } from "./server/db";
import { colaboradores } from "./drizzle/schema";

const nomes = [
  { nome: "Roberto Santos", funcao: "Pedreiro", sexo: "masculino" as const },
  { nome: "Fernanda Costa", funcao: "Engenheiro Civil", sexo: "feminino" as const },
  { nome: "João Silva", funcao: "Técnico de Segurança do Trabalho", sexo: "masculino" as const },
  { nome: "Mariana Oliveira", funcao: "Assistente Administrativo", sexo: "feminino" as const },
  { nome: "Carlos Mendes", funcao: "Operador de Máquina", sexo: "masculino" as const },
];

const setores = ["Logística", "Administrativo", "Segurança", "Produção", "Manutenção"];
const empresas = [1]; // Trapisa

function gerarCPF(): string {
  const parte1 = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  const parte2 = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  const parte3 = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  const parte4 = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${parte1}.${parte2}.${parte3}-${parte4}`;
}

function gerarRG(): string {
  return Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
}

function gerarPIS(): string {
  return Math.floor(Math.random() * 10000000000).toString().padStart(11, "0");
}

function gerarTelefone(): string {
  const ddd = Math.floor(Math.random() * 90 + 10);
  const numero = Math.floor(Math.random() * 900000000 + 100000000);
  return `(${ddd}) ${Math.floor(numero / 100000)}-${(numero % 100000).toString().padStart(5, "0")}`;
}

function gerarDataNascimento(): Date {
  // Gera data de nascimento entre 40 e 65 anos atrás
  const hoje = new Date();
  const anos = Math.floor(Math.random() * 25 + 40);
  const meses = Math.floor(Math.random() * 12);
  const dias = Math.floor(Math.random() * 28 + 1);
  
  const data = new Date(hoje.getFullYear() - anos, hoje.getMonth() - meses, hoje.getDate() - dias);
  return data;
}

function gerarDataAdmissao(): Date {
  // Gera data de admissão entre 2 e 5 anos atrás
  const hoje = new Date();
  const anos = Math.floor(Math.random() * 3 + 2);
  const meses = Math.floor(Math.random() * 12);
  const dias = Math.floor(Math.random() * 28 + 1);
  
  const data = new Date(hoje.getFullYear() - anos, hoje.getMonth() - meses, hoje.getDate() - dias);
  return data;
}

function gerarDataRescisao(): Date {
  // Gera data de rescisão entre 6 meses e 1 ano atrás
  const hoje = new Date();
  const meses = Math.floor(Math.random() * 6 + 6);
  const dias = Math.floor(Math.random() * 28 + 1);
  
  const data = new Date(hoje.getFullYear(), hoje.getMonth() - meses, hoje.getDate() - dias);
  return data;
}

async function seedColaboradoresInativos() {
  const db = await getDb();
  if (!db) {
    console.error("Banco de dados não disponível");
    process.exit(1);
  }

  console.log("🌱 Iniciando seed de colaboradores inativos...");

  for (let i = 0; i < nomes.length; i++) {
    const { nome, funcao, sexo } = nomes[i];
    const setor = setores[i % setores.length];
    const empresaId = empresas[0];

    const dataNascimento = gerarDataNascimento();
    const dataAdmissao = gerarDataAdmissao();
    const dataRescisao = gerarDataRescisao();

    const colaborador = {
      nomeCompleto: nome,
      funcao,
      sexo,
      setor,
      empresaId,
      dataNascimento,
      dataAdmissao,
      dataPrimeiroAso: new Date(dataAdmissao.getTime() + 30 * 24 * 60 * 60 * 1000),
      validadeAso: new Date(dataAdmissao.getTime() + 365 * 24 * 60 * 60 * 1000),
      cpf: gerarCPF(),
      rg: gerarRG(),
      pis: gerarPIS(),
      tipoLogradouro: "Rua",
      nomeLogradouro: `${nome.split(" ")[0]} ${Math.floor(Math.random() * 1000)}`,
      numeroEndereco: Math.floor(Math.random() * 1000).toString(),
      cidadeEndereco: "São Paulo",
      estadoEndereco: "SP",
      cep: `${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 900 + 100)}`,
      telefonePrincipal: gerarTelefone(),
      telefoneRecado: gerarTelefone(),
      nomePessoaRecado: "Contato de Emergência",
      grauParentesco: "Cônjuge",
      status: "inativo" as const,
      dataRescisao,
    };

    try {
      await db.insert(colaboradores).values(colaborador);
      console.log(`✅ Colaborador criado: ${nome} (Status: Inativo)`);
    } catch (error) {
      console.error(`❌ Erro ao criar colaborador ${nome}:`, error);
    }
  }

  console.log("✨ Seed de colaboradores inativos concluído!");
  process.exit(0);
}

seedColaboradoresInativos().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
