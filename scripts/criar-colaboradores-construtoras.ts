import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import { empresas, colaboradores, cargos } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { normalizeCPF } from "../server/utils/validation";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath, override: true });

// Nomes masculinos brasileiros
const nomesMasculinos = [
  "João", "José", "Carlos", "Antônio", "Francisco", "Paulo", "Pedro", "Luiz", "Marcos", "Lucas",
  "Rafael", "Felipe", "Bruno", "Ricardo", "Rodrigo", "André", "Eduardo", "Fernando", "Gustavo", "Diego",
  "Thiago", "Vinicius", "Gabriel", "Daniel", "Leonardo", "Matheus", "Henrique", "Renato", "Fabio", "Alexandre",
  "Roberto", "Maurício", "Sergio", "Wagner", "Adriano", "Cristiano", "Juliano", "Leandro", "Marcelo", "Márcio",
  "Rogério", "Sandro", "Valmir", "Wesley", "Alessandro", "Anderson", "César", "Claudio", "Douglas", "Elias",
  "Fábio", "Gilberto", "Hélio", "Igor", "Jeferson", "Kleber", "Luciano", "Milton", "Nelson", "Oswaldo",
  "Patrício", "Quirino", "Raimundo", "Silvio", "Tadeu", "Ubirajara", "Vitor", "Washington", "Xavier", "Yuri",
  "Zeca", "Ademir", "Benedito", "Ciro", "Davi", "Emanuel", "Fábio", "Geraldo", "Humberto", "Ivan",
  "Jair", "Kleiton", "Lauro", "Manoel", "Nilo", "Orlando", "Pablo", "Quirino", "Ronaldo", "Sebastião"
];

// Nomes femininos brasileiros
const nomesFemininos = [
  "Maria", "Ana", "Juliana", "Fernanda", "Patrícia", "Mariana", "Camila", "Amanda", "Bruna", "Letícia",
  "Jéssica", "Larissa", "Vanessa", "Tatiana", "Priscila", "Daniela", "Gabriela", "Carolina", "Beatriz", "Luciana",
  "Renata", "Adriana", "Cristina", "Simone", "Monique", "Thais", "Raquel", "Claudia", "Sandra", "Eliane",
  "Elisângela", "Fabiana", "Gisele", "Helena", "Isabela", "Jaqueline", "Karina", "Lilian", "Márcia", "Natália",
  "Olívia", "Paula", "Quésia", "Rafaela", "Sabrina", "Tainá", "Úrsula", "Viviane", "Wanessa", "Yasmin",
  "Zuleide", "Aline", "Bianca", "Carla", "Débora", "Elaine", "Franciele", "Graziela", "Heloísa", "Ingrid",
  "Janaina", "Kelly", "Lorena", "Michele", "Nádia", "Otávia", "Pâmela", "Queli", "Rosana", "Sueli",
  "Tamires", "Ursula", "Vera", "Waleska", "Ximena", "Yara", "Zélia", "Andréia", "Bárbara", "Cíntia"
];

// Sobrenomes brasileiros comuns
const sobrenomes = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Ribeiro", "Carvalho", "Almeida", "Costa", "Martins", "Rocha", "Araújo", "Mendes", "Nascimento", "Moreira",
  "Freitas", "Barbosa", "Ramos", "Reis", "Dias", "Monteiro", "Cardoso", "Teixeira", "Cavalcanti", "Correia",
  "Melo", "Campos", "Machado", "Fernandes", "Azevedo", "Cunha", "Lopes", "Pinto", "Vieira", "Barros",
  "Castro", "Nunes", "Moura", "Sampaio", "Brito", "Farias", "Bezerra", "Xavier", "Borges", "Tavares"
];

// Cargos a serem criados
const cargosParaCriar = [
  { nome: "Servente de Obras", quantidade: 8 },
  { nome: "Carpinteiro", quantidade: 5 },
  { nome: "Pedreiro", quantidade: 6 },
  { nome: "Gesseiro", quantidade: 4 },
  { nome: "Tintor Interno", quantidade: 3 },
  { nome: "Pintor Externo", quantidade: 4 },
  { nome: "Engenheiro Civil", quantidade: 3 },
  { nome: "Coordenador de Obras", quantidade: 2 },
  { nome: "Gerente de Obras", quantidade: 1 },
  { nome: "Técnico de Segurança do Trabalho", quantidade: 2 },
  { nome: "Analista de RH", quantidade: 2 },
  { nome: "Estagiário de Engenharia Civil", quantidade: 3 },
  { nome: "Estagiário de RH", quantidade: 3 },
  { nome: "Estagiário de Segurança do Trabalho", quantidade: 2 },
];

// Total: 8+5+6+4+3+4+3+2+1+2+2+3+3+2 = 48 (vou ajustar para 50)

// Gerar CPF aleatório válido (apenas formato, não validação real)
function gerarCPF(): string {
  const n1 = Math.floor(Math.random() * 9);
  const n2 = Math.floor(Math.random() * 9);
  const n3 = Math.floor(Math.random() * 9);
  const n4 = Math.floor(Math.random() * 9);
  const n5 = Math.floor(Math.random() * 9);
  const n6 = Math.floor(Math.random() * 9);
  const n7 = Math.floor(Math.random() * 9);
  const n8 = Math.floor(Math.random() * 9);
  const n9 = Math.floor(Math.random() * 9);
  
  // Calcular dígitos verificadores (simplificado)
  let d1 = (n1*10 + n2*9 + n3*8 + n4*7 + n5*6 + n6*5 + n7*4 + n8*3 + n9*2) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  
  let d2 = (n1*11 + n2*10 + n3*9 + n4*8 + n5*7 + n6*6 + n7*5 + n8*4 + n9*3 + d1*2) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

// Gerar nome completo único
function gerarNomeCompleto(sexo: 'masculino' | 'feminino', nomesUsados: Set<string>): string {
  let nomeCompleto: string;
  let tentativas = 0;
  
  do {
    const primeiroNome = sexo === 'masculino' 
      ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
      : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
    
    const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    
    nomeCompleto = `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
    tentativas++;
    
    if (tentativas > 100) {
      // Adicionar número se ainda estiver duplicado
      nomeCompleto = `${nomeCompleto} ${Math.floor(Math.random() * 1000)}`;
      break;
    }
  } while (nomesUsados.has(nomeCompleto));
  
  nomesUsados.add(nomeCompleto);
  return nomeCompleto;
}

// Gerar data de admissão (mais antiga há 20 anos)
function gerarDataAdmissao(): Date {
  const hoje = new Date();
  const vinteAnosAtras = new Date(hoje);
  vinteAnosAtras.setFullYear(hoje.getFullYear() - 20);
  
  // Data aleatória entre 20 anos atrás e hoje
  const diffTime = hoje.getTime() - vinteAnosAtras.getTime();
  const randomTime = vinteAnosAtras.getTime() + Math.random() * diffTime;
  
  return new Date(randomTime);
}

// Gerar data de nascimento (entre 18 e 65 anos)
function gerarDataNascimento(idadeMin: number = 18, idadeMax: number = 65): Date {
  const hoje = new Date();
  const idade = Math.floor(Math.random() * (idadeMax - idadeMin + 1)) + idadeMin;
  const anoNascimento = hoje.getFullYear() - idade;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.floor(Math.random() * 28) + 1;
  
  return new Date(anoNascimento, mes, dia);
}

async function criarColaboradores() {
  try {
    console.log("🔄 Iniciando criação de colaboradores para construtoras...\n");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    // Buscar construtoras (empresas que contenham "construtora" no nome ou tipo)
    const todasEmpresas = await db.select().from(empresas);
    let construtoras = todasEmpresas.filter(emp => 
      emp.razaoSocial.toLowerCase().includes("construtora") ||
      emp.razaoSocial.toLowerCase().includes("construção") ||
      emp.razaoSocial.toLowerCase().includes("engenharia")
    );
    
    // Se não tiver 6 construtoras, usar outras empresas para completar
    if (construtoras.length < 6) {
      const outrasEmpresas = todasEmpresas.filter(emp => 
        !construtoras.some(c => c.id === emp.id)
      );
      
      const faltam = 6 - construtoras.length;
      construtoras.push(...outrasEmpresas.slice(0, faltam));
      
      if (construtoras.length < 6) {
        console.log(`⚠️  Apenas ${construtoras.length} empresas encontradas. Criando colaboradores para todas.\n`);
      } else {
        console.log(`✅ Usando ${construtoras.length} empresas (construtoras + outras para completar)\n`);
      }
    }
    
    // Limitar a 6 empresas
    construtoras = construtoras.slice(0, 6);
    
    console.log(`📊 Empresas que receberão colaboradores: ${construtoras.length}\n`);
    
    // Conjunto global para evitar CPFs duplicados
    const cpfsUsados = new Set<string>();
    const nomesUsados = new Set<string>();
    
    // Ajustar cargos para totalizar exatamente 50
    const cargosAjustados = [...cargosParaCriar];
    const totalAtual = cargosAjustados.reduce((sum, c) => sum + c.quantidade, 0);
    if (totalAtual < 50) {
      // Adicionar mais serventes se necessário
      const serventeIndex = cargosAjustados.findIndex(c => c.nome === "Servente de Obras");
      if (serventeIndex >= 0) {
        cargosAjustados[serventeIndex].quantidade += (50 - totalAtual);
      }
    }
    
    let totalCriados = 0;
    
    for (const empresa of construtoras) {
      console.log(`\n🏢 Processando: ${empresa.razaoSocial}`);
      console.log(`   ID: ${empresa.id}\n`);
      
      let colaboradoresEmpresa = 0;
      
      for (const cargoInfo of cargosAjustados) {
        // Buscar ou criar cargo
        let cargo = await db
          .select()
          .from(cargos)
          .where(and(
            eq(cargos.nomeCargo, cargoInfo.nome),
            eq(cargos.empresaId, empresa.id)
          ))
          .limit(1);
        
        let cargoId: number;
        
        if (cargo.length === 0) {
          // Criar cargo
          const novoCargo = await db.insert(cargos).values({
            nomeCargo: cargoInfo.nome,
            empresaId: empresa.id,
            descricao: `Cargo de ${cargoInfo.nome} na empresa ${empresa.razaoSocial}`,
          });
          cargoId = (novoCargo as any).insertId || (await db.select().from(cargos).where(eq(cargos.nomeCargo, cargoInfo.nome)).limit(1))[0]?.id;
          
          // Se ainda não tiver ID, buscar novamente
          if (!cargoId) {
            const cargoCriado = await db
              .select()
              .from(cargos)
              .where(and(
                eq(cargos.nomeCargo, cargoInfo.nome),
                eq(cargos.empresaId, empresa.id)
              ))
              .limit(1);
            cargoId = cargoCriado[0]?.id;
          }
        } else {
          cargoId = cargo[0].id;
        }
        
        // Criar colaboradores para este cargo
        for (let i = 0; i < cargoInfo.quantidade; i++) {
          // Determinar sexo (70% homens, 30% mulheres)
          const sexo = Math.random() < 0.7 ? 'masculino' : 'feminino';
          
          // Gerar dados únicos
          let cpf: string;
          do {
            cpf = gerarCPF();
          } while (cpfsUsados.has(cpf));
          cpfsUsados.add(cpf);
          
          const nomeCompleto = gerarNomeCompleto(sexo, nomesUsados);
          const dataNascimento = gerarDataNascimento();
          const dataAdmissao = gerarDataAdmissao();
          
          // Calcular idade
          const hoje = new Date();
          const idade = hoje.getFullYear() - dataNascimento.getFullYear();
          
          try {
            await db.insert(colaboradores).values({
              tenantId: 1, // Tenant padrão
              nomeCompleto: nomeCompleto,
              cpf: normalizeCPF(cpf),
              dataNascimento: dataNascimento,
              sexo: sexo,
              dataAdmissao: dataAdmissao,
              cargoId: cargoId,
              empresaId: empresa.id,
              status: "ativo",
            });
            
            colaboradoresEmpresa++;
            totalCriados++;
          } catch (error: any) {
            if (error.message?.includes("Duplicate entry") || error.message?.includes("UNIQUE")) {
              console.log(`   ⚠️  CPF duplicado, gerando novo...`);
              i--; // Tentar novamente
              continue;
            }
            throw error;
          }
        }
        
        console.log(`   ✅ ${cargoInfo.quantidade} ${cargoInfo.nome} criados`);
      }
      
      console.log(`\n   📊 Total de colaboradores criados para ${empresa.razaoSocial}: ${colaboradoresEmpresa}`);
    }
    
    console.log("\n\n✨ Criação de colaboradores concluída!\n");
    console.log("📊 Resumo Final:");
    console.log(`   🏢 Empresas processadas: ${construtoras.length}`);
    console.log(`   👥 Total de colaboradores criados: ${totalCriados}`);
    console.log(`   📋 CPFs únicos gerados: ${cpfsUsados.size}`);
    console.log(`   📝 Nomes únicos gerados: ${nomesUsados.size}`);
    
    // Estatísticas de gênero
    const todosColaboradores = await db.select().from(colaboradores);
    const homens = todosColaboradores.filter(c => c.sexo === 'masculino').length;
    const mulheres = todosColaboradores.filter(c => c.sexo === 'feminino').length;
    
    console.log(`\n📈 Distribuição de gênero (total no sistema):`);
    console.log(`   👨 Homens: ${homens} (${((homens / todosColaboradores.length) * 100).toFixed(1)}%)`);
    console.log(`   👩 Mulheres: ${mulheres} (${((mulheres / todosColaboradores.length) * 100).toFixed(1)}%)`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erro na criação:", error.message);
    console.error(error);
    process.exit(1);
  }
}

criarColaboradores();

