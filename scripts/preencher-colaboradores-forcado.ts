import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";

// Carregar .env e .env.local
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });
import { colaboradores, asos } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Dados para geração de colaboradores realistas
const nomesMasculinos = [
  "Carlos", "João", "Paulo", "Fernando", "Ricardo", "Roberto", "André", "Marcelo",
  "Felipe", "Lucas", "Diego", "Rodrigo", "Gustavo", "Bruno", "Thiago", "Matheus",
  "Daniel", "Fabio", "Julio", "Sergio", "Marcos", "Cesar", "Claudio", "Edson",
  "Gilson", "Heitor", "Igor", "Jair", "Kleber", "Leandro", "Mauricio", "Nelson",
  "Otavio", "Pedro", "Rafael", "Sergio", "Tiago", "Vinicius", "Wagner", "Xavier"
];

const nomesFemininos = [
  "Maria", "Ana", "Carla", "Paula", "Fernanda", "Roberta", "Andrea", "Marcia",
  "Felicia", "Lucia", "Diana", "Rodriga", "Gustava", "Bruna", "Thaisa", "Marta",
  "Daniela", "Fabiana", "Julia", "Sergio", "Marcia", "Cesaria", "Claudia", "Edna",
  "Gilsa", "Helena", "Iris", "Jaqueline", "Karina", "Leandra", "Mariana", "Natalia",
  "Olivia", "Patricia", "Renata", "Sandra", "Tatiana", "Vanessa", "Wanessa", "Yasmin"
];

const sobrenomes = [
  "Silva", "Santos", "Oliveira", "Souza", "Costa", "Ferreira", "Gomes", "Martins",
  "Pereira", "Alves", "Rocha", "Carvalho", "Ribeiro", "Mendes", "Barbosa", "Monteiro",
  "Teixeira", "Machado", "Campos", "Dias", "Neves", "Pinto", "Lopes", "Moreira",
  "Vieira", "Castro", "Tavares", "Soares", "Correia", "Mota", "Araujo", "Cardoso",
  "Freitas", "Lima", "Nascimento", "Ramos", "Siqueira", "Torres", "Viana", "Xavier"
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

const setores = [
  "Administrativo", "Produção", "Qualidade", "Manutenção", "Recursos Humanos",
  "Financeiro", "Logística", "Segurança", "Engenharia", "Comercial"
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

function estaVazio(valor: any): boolean {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === "string" && valor.trim() === "") return true;
  return false;
}

function completarTodosCampos(colaborador: any) {
  const nomeCompleto = colaborador.nomeCompleto || "";
  const partesNome = nomeCompleto.split(" ");
  const primeiroNome = partesNome[0] || "";
  const isMasculino = primeiroNome && nomesMasculinos.some(n => primeiroNome.toLowerCase().includes(n.toLowerCase()));

  const atualizacoes: any = {};

  if (estaVazio(colaborador.nomeCompleto)) {
    const nome = isMasculino 
      ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
      : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    atualizacoes.nomeCompleto = `${nome} ${sobrenome}`;
  }

  if (estaVazio(colaborador.dataNascimento)) {
    atualizacoes.dataNascimento = gerarDataNascimento(18, 55);
  }

  if (estaVazio(colaborador.estadoNascimento)) {
    atualizacoes.estadoNascimento = estados[Math.floor(Math.random() * estados.length)];
  }

  if (estaVazio(colaborador.cidadeNascimento)) {
    const estadoNasc = atualizacoes.estadoNascimento || colaborador.estadoNascimento || estados[Math.floor(Math.random() * estados.length)];
    atualizacoes.cidadeNascimento = obterCidadeAleatoria(estadoNasc);
  }

  if (estaVazio(colaborador.sexo)) {
    atualizacoes.sexo = isMasculino ? "masculino" : "feminino";
  }

  atualizacoes.rg = colaborador.rg && !estaVazio(colaborador.rg) ? colaborador.rg : gerarRG();
  atualizacoes.cpf = colaborador.cpf && !estaVazio(colaborador.cpf) ? colaborador.cpf : gerarCPF();
  atualizacoes.pis = colaborador.pis && !estaVazio(colaborador.pis) ? colaborador.pis : gerarPIS();

  if (estaVazio(colaborador.estadoEndereco)) {
    atualizacoes.estadoEndereco = estados[Math.floor(Math.random() * estados.length)];
  }

  if (estaVazio(colaborador.cidadeEndereco)) {
    const estadoEnd = atualizacoes.estadoEndereco || colaborador.estadoEndereco || estados[Math.floor(Math.random() * estados.length)];
    atualizacoes.cidadeEndereco = obterCidadeAleatoria(estadoEnd);
  }

  if (estaVazio(colaborador.tipoLogradouro)) {
    atualizacoes.tipoLogradouro = tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)];
  }

  if (estaVazio(colaborador.nomeLogradouro)) {
    const tipoLog = atualizacoes.tipoLogradouro || colaborador.tipoLogradouro || tiposLogradouro[0];
    atualizacoes.nomeLogradouro = `${tipoLog} ${Math.floor(Math.random() * 1000) + 1}`;
  }

  if (estaVazio(colaborador.numeroEndereco)) {
    atualizacoes.numeroEndereco = String(Math.floor(Math.random() * 9999) + 1);
  }

  if (estaVazio(colaborador.complementoEndereco)) {
    atualizacoes.complementoEndereco = Math.random() > 0.7 ? `Apto ${Math.floor(Math.random() * 999) + 1}` : null;
  }

  if (estaVazio(colaborador.cep)) {
    atualizacoes.cep = gerarCEP();
  }

  if (estaVazio(colaborador.telefonePrincipal)) {
    atualizacoes.telefonePrincipal = gerarTelefone();
  }

  if (estaVazio(colaborador.telefoneRecado)) {
    atualizacoes.telefoneRecado = Math.random() > 0.5 ? gerarTelefone() : null;
  }

  if (estaVazio(colaborador.nomePessoaRecado)) {
    atualizacoes.nomePessoaRecado = `${nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
  }

  if (estaVazio(colaborador.grauParentesco)) {
    atualizacoes.grauParentesco = ["Cônjuge", "Filho", "Filha", "Pai", "Mãe", "Irmão", "Irmã"][Math.floor(Math.random() * 7)];
  }

  if (estaVazio(colaborador.setor)) {
    atualizacoes.setor = setores[Math.floor(Math.random() * setores.length)];
  }

  if (estaVazio(colaborador.dataAdmissao)) {
    const data = new Date();
    data.setDate(data.getDate() - Math.floor(Math.random() * 365 * 2));
    atualizacoes.dataAdmissao = data;
  }

  const dataAdmissao = atualizacoes.dataAdmissao || colaborador.dataAdmissao;
  if (dataAdmissao) {
    const dataAdm = new Date(dataAdmissao);
    const dataEmissao = new Date(dataAdm);
    dataEmissao.setDate(dataEmissao.getDate() - 2);
    dataEmissao.setHours(0, 0, 0, 0);
    const dataValidade = new Date(dataEmissao);
    dataValidade.setFullYear(dataValidade.getFullYear() + 1);
    dataValidade.setHours(23, 59, 59, 999);
    atualizacoes.dataPrimeiroAso = dataEmissao;
    atualizacoes.validadeAso = dataValidade;
  } else {
    const data = new Date();
    data.setDate(data.getDate() - Math.floor(Math.random() * 365 * 2));
    atualizacoes.dataAdmissao = data;
    const dataEmissao = new Date(data);
    dataEmissao.setDate(dataEmissao.getDate() - 2);
    dataEmissao.setHours(0, 0, 0, 0);
    const dataValidade = new Date(dataEmissao);
    dataValidade.setFullYear(dataValidade.getFullYear() + 1);
    dataValidade.setHours(23, 59, 59, 999);
    atualizacoes.dataPrimeiroAso = dataEmissao;
    atualizacoes.validadeAso = dataValidade;
  }

  return atualizacoes;
}

async function main() {
  console.log("🔗 Conectando ao banco de dados...");
  const db = await getDb();
  
  if (!db) {
    console.error("❌ Erro: Não foi possível conectar ao banco de dados.");
    console.error("   Verifique se o servidor está rodando e a DATABASE_URL está configurada.");
    process.exit(1);
  }

  try {
    console.log("🚀 Iniciando preenchimento FORÇADO de TODOS os campos de colaboradores...\n");

    const todosColaboradores = await db.select().from(colaboradores);
    console.log(`📋 Total de colaboradores encontrados: ${todosColaboradores.length}\n`);

    if (todosColaboradores.length === 0) {
      console.log("⚠️  Nenhum colaborador encontrado. Nada a fazer.");
      return;
    }

    let colaboradoresAtualizados = 0;
    let camposPreenchidos = 0;
    let asosCriados = 0;
    let asosAtualizados = 0;
    let erros = 0;

    for (const colaborador of todosColaboradores) {
      try {
        const atualizacoes = completarTodosCampos(colaborador);
        const quantidadeCampos = Object.keys(atualizacoes).length;

        if (quantidadeCampos === 0) {
          console.log(`✓ Colaborador ${colaborador.id} (${colaborador.nomeCompleto}) - Todos os campos já estão preenchidos`);
          continue;
        }

        await db
          .update(colaboradores)
          .set({
            ...atualizacoes,
            cargoId: colaborador.cargoId || null,
            setorId: colaborador.setorId || null,
            empresaId: colaborador.empresaId,
            obraId: colaborador.obraId || null,
            tenantId: colaborador.tenantId,
            status: colaborador.status || "ativo",
            updatedAt: new Date(),
          })
          .where(eq(colaboradores.id, colaborador.id));

        console.log(`✅ Colaborador ${colaborador.id} (${colaborador.nomeCompleto || "Sem nome"}) - ${quantidadeCampos} campo(s) preenchido(s)`);
        if (atualizacoes.rg) console.log(`   📄 RG: ${atualizacoes.rg}`);
        if (atualizacoes.pis) console.log(`   📄 PIS: ${atualizacoes.pis}`);
        if (atualizacoes.cpf) console.log(`   📄 CPF: ${atualizacoes.cpf}`);
        if (atualizacoes.dataPrimeiroAso) console.log(`   📅 Data Primeiro ASO: ${new Date(atualizacoes.dataPrimeiroAso).toLocaleDateString("pt-BR")}`);
        if (atualizacoes.validadeAso) console.log(`   📅 Validade ASO: ${new Date(atualizacoes.validadeAso).toLocaleDateString("pt-BR")}`);

        colaboradoresAtualizados++;
        camposPreenchidos += quantidadeCampos;

        const dataAdmissao = atualizacoes.dataAdmissao || colaborador.dataAdmissao;
        if (dataAdmissao) {
          const dataAdm = new Date(dataAdmissao);
          const dataEmissao = new Date(dataAdm);
          dataEmissao.setDate(dataEmissao.getDate() - 2);
          dataEmissao.setHours(0, 0, 0, 0);
          const dataValidade = new Date(dataEmissao);
          dataValidade.setFullYear(dataValidade.getFullYear() + 1);
          dataValidade.setHours(23, 59, 59, 999);

          const asosExistentes = await db
            .select()
            .from(asos)
            .where(
              and(
                eq(asos.tenantId, colaborador.tenantId),
                eq(asos.colaboradorId, colaborador.id),
                eq(asos.tipoAso, "admissional")
              )
            );

          if (asosExistentes.length > 0) {
            await db
              .update(asos)
              .set({
                dataEmissao: dataEmissao,
                dataValidade: dataValidade,
                status: dataValidade < new Date() ? "vencido" : "ativo",
                updatedAt: new Date(),
              })
              .where(eq(asos.id, asosExistentes[0].id));
            asosAtualizados++;
          } else {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const status = dataValidade < hoje ? "vencido" : "ativo";

            const asoData = {
              tenantId: colaborador.tenantId,
              colaboradorId: colaborador.id,
              empresaId: colaborador.empresaId,
              numeroAso: null,
              tipoAso: "admissional" as const,
              dataEmissao: dataEmissao,
              dataValidade: dataValidade,
              medicoResponsavel: null,
              clinicaMedica: null,
              crmMedico: null,
              apto: "sim" as const,
              restricoes: null,
              observacoes: "ASO admissional criado automaticamente durante preenchimento de cadastro.",
              anexoUrl: null,
              status: status as "ativo" | "vencido",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result: any = await db.insert(asos).values(asoData);
            const insertId = result?.insertId ?? (Array.isArray(result) ? result[0]?.insertId : undefined);
            if (insertId) {
              asosCriados++;
            }
          }
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar colaborador ${colaborador.id} (${colaborador.nomeCompleto || "Sem nome"}):`, error.message);
        erros++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Resumo da execução:");
    console.log(`   ✅ Colaboradores atualizados: ${colaboradoresAtualizados}`);
    console.log(`   📝 Total de campos preenchidos: ${camposPreenchidos}`);
    console.log(`   ✅ ASOs criados: ${asosCriados}`);
    console.log(`   📝 ASOs atualizados: ${asosAtualizados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log("=".repeat(60));
    console.log("\n🎉 Processo concluído! Todos os campos foram verificados e preenchidos.");

  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

