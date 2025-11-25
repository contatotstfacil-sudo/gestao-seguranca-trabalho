import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { colaboradores, asos } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

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

// Mapeamento de estados para cidades realistas
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

// Função para gerar CPF válido (simplificado)
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

// Função para gerar PIS válido (simplificado)
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

// Função para gerar data de nascimento
function gerarDataNascimento(idadeMin: number, idadeMax: number) {
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

// Função para completar dados do colaborador
function completarDadosColaborador(colaborador: any) {
  const nomeCompleto = colaborador.nomeCompleto || "";
  const partesNome = nomeCompleto.split(" ");
  const primeiroNome = partesNome[0] || "";
  const isMasculino = primeiroNome && nomesMasculinos.some(n => primeiroNome.includes(n));

  // Dados de nascimento
  const dataNascimento = colaborador.dataNascimento || gerarDataNascimento(18, 55);
  const estadoNascimento = colaborador.estadoNascimento || estados[Math.floor(Math.random() * estados.length)];
  const cidadeNascimento = colaborador.cidadeNascimento || obterCidadeAleatoria(estadoNascimento);
  const sexo = colaborador.sexo || (isMasculino ? "masculino" : "feminino");

  // Documentos - SEMPRE preencher, mesmo se já existir (garantir que não está vazio)
  const rg = (colaborador.rg && colaborador.rg.trim()) ? colaborador.rg : gerarRG();
  const cpf = (colaborador.cpf && colaborador.cpf.trim()) ? colaborador.cpf : gerarCPF();
  const pis = (colaborador.pis && colaborador.pis.trim()) ? colaborador.pis : gerarPIS();

  // Endereço
  const estadoEndereco = colaborador.estadoEndereco || estados[Math.floor(Math.random() * estados.length)];
  const cidadeEndereco = colaborador.cidadeEndereco || obterCidadeAleatoria(estadoEndereco);
  const tipoLogradouro = colaborador.tipoLogradouro || tiposLogradouro[Math.floor(Math.random() * tiposLogradouro.length)];
  const nomeLogradouro = colaborador.nomeLogradouro || `${tipoLogradouro} ${Math.floor(Math.random() * 1000) + 1}`;
  const numeroEndereco = colaborador.numeroEndereco || String(Math.floor(Math.random() * 9999) + 1);
  const complementoEndereco = colaborador.complementoEndereco || (Math.random() > 0.7 ? `Apto ${Math.floor(Math.random() * 999) + 1}` : null);
  const cep = colaborador.cep || gerarCEP();

  // Telefones
  const telefonePrincipal = colaborador.telefonePrincipal || gerarTelefone();
  const telefoneRecado = colaborador.telefoneRecado || (Math.random() > 0.5 ? gerarTelefone() : null);

  // Contato de emergência
  const nomePessoaRecado = colaborador.nomePessoaRecado || `${nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
  const grauParentesco = colaborador.grauParentesco || ["Cônjuge", "Filho", "Filha", "Pai", "Mãe", "Irmão", "Irmã"][Math.floor(Math.random() * 7)];

  // Setor (se não tiver) - função removida, usar apenas cargoId
  const setor = colaborador.setor || "Administrativo";

  // Data de admissão (se não tiver, gerar uma data aleatória)
  const dataAdmissao = colaborador.dataAdmissao || (() => {
    const data = new Date();
    data.setDate(data.getDate() - Math.floor(Math.random() * 365 * 2));
    return data;
  })();

  return {
    ...colaborador,
    dataNascimento,
    cidadeNascimento,
    estadoNascimento,
    sexo,
    rg,
    cpf,
    pis,
    tipoLogradouro,
    nomeLogradouro,
    numeroEndereco,
    complementoEndereco,
    cidadeEndereco,
    estadoEndereco,
    cep,
    telefonePrincipal,
    telefoneRecado,
    nomePessoaRecado,
    grauParentesco,
    setor,
    dataAdmissao,
  };
}

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("postgresql://usuario:senha@host:porta/nomedobanco")) {
    console.error("❌ Erro: DATABASE_URL não configurada ou é um placeholder.");
    console.error("   Configure o arquivo .env com a URL real do MySQL.");
    process.exit(1);
  }

  console.log("🔗 Conectando ao banco de dados...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("🚀 Iniciando completar cadastro de colaboradores...\n");

    // Buscar todos os colaboradores
    const todosColaboradores = await db.select().from(colaboradores);
    console.log(`📋 Total de colaboradores encontrados: ${todosColaboradores.length}\n`);

    if (todosColaboradores.length === 0) {
      console.log("⚠️  Nenhum colaborador encontrado. Nada a fazer.");
      await connection.end();
      return;
    }

    let colaboradoresAtualizados = 0;
    let asosCriados = 0;
    let asosAtualizados = 0;
    let erros = 0;

    for (const colaborador of todosColaboradores) {
      try {
        // Completar dados do colaborador
        const dadosCompletos = completarDadosColaborador(colaborador);

        // Calcular data de emissão do ASO (2 dias antes da admissão) - fazer antes de atualizar
        const dataAdmissao = dadosCompletos.dataAdmissao ? new Date(dadosCompletos.dataAdmissao) : null;
        let dataPrimeiroAso = null;
        let validadeAso = null;

        if (dataAdmissao) {
          const dataEmissao = new Date(dataAdmissao);
          dataEmissao.setDate(dataEmissao.getDate() - 2);
          dataEmissao.setHours(0, 0, 0, 0);
          
          const dataValidade = new Date(dataEmissao);
          dataValidade.setFullYear(dataValidade.getFullYear() + 1);
          dataValidade.setHours(23, 59, 59, 999);
          
          dataPrimeiroAso = dataEmissao;
          validadeAso = dataValidade;
        }

        // Atualizar colaborador com TODOS os campos explicitamente - PRESERVAR cargoId, setorId, empresaId, obraId
        await db
          .update(colaboradores)
          .set({
            nomeCompleto: dadosCompletos.nomeCompleto,
            setor: dadosCompletos.setor,
            dataNascimento: dadosCompletos.dataNascimento,
            cidadeNascimento: dadosCompletos.cidadeNascimento,
            estadoNascimento: dadosCompletos.estadoNascimento,
            sexo: dadosCompletos.sexo,
            rg: dadosCompletos.rg,
            cpf: dadosCompletos.cpf,
            pis: dadosCompletos.pis,
            tipoLogradouro: dadosCompletos.tipoLogradouro,
            nomeLogradouro: dadosCompletos.nomeLogradouro,
            numeroEndereco: dadosCompletos.numeroEndereco,
            complementoEndereco: dadosCompletos.complementoEndereco,
            cidadeEndereco: dadosCompletos.cidadeEndereco,
            estadoEndereco: dadosCompletos.estadoEndereco,
            cep: dadosCompletos.cep,
            telefonePrincipal: dadosCompletos.telefonePrincipal,
            telefoneRecado: dadosCompletos.telefoneRecado,
            nomePessoaRecado: dadosCompletos.nomePessoaRecado,
            grauParentesco: dadosCompletos.grauParentesco,
            dataAdmissao: dadosCompletos.dataAdmissao,
            dataPrimeiroAso: dataPrimeiroAso || dadosCompletos.dataPrimeiroAso || colaborador.dataPrimeiroAso,
            validadeAso: validadeAso || dadosCompletos.validadeAso || colaborador.validadeAso,
            observacoes: dadosCompletos.observacoes || colaborador.observacoes,
            // PRESERVAR campos importantes que não devem ser sobrescritos
            cargoId: colaborador.cargoId,
            setorId: colaborador.setorId,
            empresaId: colaborador.empresaId,
            obraId: colaborador.obraId,
            tenantId: colaborador.tenantId,
            status: colaborador.status || "ativo",
            updatedAt: new Date(),
          })
          .where(eq(colaboradores.id, colaborador.id));

        console.log(`✅ Colaborador ${colaborador.id} (${colaborador.nomeCompleto}) - Cadastro completo atualizado`);
        if (dataPrimeiroAso) {
          console.log(`   📅 Data Primeiro ASO: ${dataPrimeiroAso.toLocaleDateString("pt-BR")}, Validade: ${validadeAso?.toLocaleDateString("pt-BR")}`);
        }

        // Verificar se tem data de admissão
        if (!dataAdmissao) {
          console.log(`⚠️  Colaborador ${colaborador.id} não tem data de admissão. Pulando criação de ASO...`);
          colaboradoresAtualizados++;
          continue;
        }

        // Usar as datas já calculadas acima
        const dataEmissao = dataPrimeiroAso!;
        const dataValidade = validadeAso!;

        // Verificar se já existe ASO admissional
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
          // Atualizar ASO existente
          const asoExistente = asosExistentes[0];
          await db
            .update(asos)
            .set({
              dataEmissao: dataEmissao,
              dataValidade: dataValidade,
              status: dataValidade < new Date() ? "vencido" : "ativo",
              updatedAt: new Date(),
            })
            .where(eq(asos.id, asoExistente.id));

          console.log(
            `   📝 ASO admissional atualizado - Emissão: ${dataEmissao.toLocaleDateString("pt-BR")}, ` +
            `Validade: ${dataValidade.toLocaleDateString("pt-BR")}`
          );
          asosAtualizados++;
        } else {
          // Criar novo ASO admissional
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
            observacoes: "ASO admissional criado automaticamente durante completar cadastro.",
            anexoUrl: null,
            status: status as "ativo" | "vencido",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result: any = await db.insert(asos).values(asoData);
          const insertId = result?.insertId ?? (Array.isArray(result) ? result[0]?.insertId : undefined);

          if (insertId) {
            console.log(
              `   ✅ ASO admissional criado - Emissão: ${dataEmissao.toLocaleDateString("pt-BR")}, ` +
              `Validade: ${dataValidade.toLocaleDateString("pt-BR")}, Status: ${status}`
            );
            asosCriados++;
          } else {
            console.error(`   ❌ Erro ao criar ASO para colaborador ${colaborador.id}: insertId não encontrado`);
            erros++;
          }
        }

        colaboradoresAtualizados++;
      } catch (error: any) {
        console.error(`❌ Erro ao processar colaborador ${colaborador.id} (${colaborador.nomeCompleto}):`, error.message);
        erros++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Resumo da execução:");
    console.log(`   ✅ Colaboradores atualizados: ${colaboradoresAtualizados}`);
    console.log(`   ✅ ASOs criados: ${asosCriados}`);
    console.log(`   📝 ASOs atualizados: ${asosAtualizados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log("=".repeat(60));
    console.log("\n🎉 Processo concluído!");

  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

