/**
 * Script para criar 20 clientes de exemplo com dados realistas
 * 
 * Uso:
 * npx tsx scripts/criar-clientes-exemplo.ts
 */

// Carregar variáveis de ambiente
import { config } from "dotenv";
import { resolve } from "path";

const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

config({ path: envPath });
config({ path: envLocalPath, override: true });

import { getDb } from "../server/db";
import { tenants } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const clientesExemplo = [
  // 15 Clientes Ativos
  {
    nome: "Construtora ABC Ltda",
    email: "contato@construtoraabc.com.br",
    telefone: "(11) 98765-4321",
    cnpj: "12345678000190",
    plano: "ouro",
    valorPlano: "137,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2024-01-15"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: "Cliente fiel, sempre paga em dia"
  },
  {
    nome: "Indústria Metalúrgica XYZ",
    email: "financeiro@metalurgicaxyz.com.br",
    telefone: "(21) 99876-5432",
    cnpj: "23456789000101",
    plano: "diamante",
    valorPlano: "199,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "trimestral",
    dataInicio: new Date("2023-06-10"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-03-01"),
    observacoes: "Plano trimestral, desconto aplicado"
  },
  {
    nome: "João Silva - Engenharia",
    email: "joao.silva@engenharia.com.br",
    telefone: "(11) 91234-5678",
    cpf: "12345678900",
    plano: "bronze",
    valorPlano: "67,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2024-03-20"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: "Profissional autônomo"
  },
  {
    nome: "Segurança do Trabalho SP",
    email: "contato@sstsp.com.br",
    telefone: "(11) 98888-7777",
    cnpj: "34567890000112",
    plano: "prata",
    valorPlano: "97,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2024-02-05"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: ""
  },
  {
    nome: "Consultoria SST Premium",
    email: "admin@consultoriasst.com.br",
    telefone: "(21) 97777-6666",
    cnpj: "45678901000123",
    plano: "ouro",
    valorPlano: "137,90",
    status: "ativo",
    statusPagamento: "atrasado",
    periodicidade: "mensal",
    dataInicio: new Date("2023-11-15"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-11-01"),
    dataProximoPagamento: new Date("2024-12-01"),
    observacoes: "Pagamento atrasado, entrar em contato"
  },
  {
    nome: "Maria Santos - Técnica em SST",
    email: "maria.santos@sst.com.br",
    telefone: "(11) 95555-4444",
    cpf: "98765432100",
    plano: "bronze",
    valorPlano: "67,90",
    status: "ativo",
    statusPagamento: "pendente",
    periodicidade: "mensal",
    dataInicio: new Date("2024-05-10"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-11-01"),
    dataProximoPagamento: new Date("2024-12-15"),
    observacoes: "Aguardando pagamento"
  },
  {
    nome: "Obras e Construções LTDA",
    email: "financeiro@obrasconstrucoes.com.br",
    telefone: "(11) 93333-2222",
    cnpj: "56789012000134",
    plano: "diamante",
    valorPlano: "199,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "semestral",
    dataInicio: new Date("2023-01-20"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-06-01"),
    observacoes: "Cliente premium, plano semestral"
  },
  {
    nome: "Carlos Oliveira - Engenheiro",
    email: "carlos@engenhariaoliveira.com.br",
    telefone: "(21) 94444-3333",
    cpf: "11122233344",
    plano: "prata",
    valorPlano: "97,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2024-04-12"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: ""
  },
  {
    nome: "Gestão de Segurança Industrial",
    email: "contato@gestaoseguranca.com.br",
    telefone: "(11) 92222-1111",
    cnpj: "67890123000145",
    plano: "ouro",
    valorPlano: "137,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "trimestral",
    dataInicio: new Date("2023-09-01"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-03-01"),
    observacoes: ""
  },
  {
    nome: "Ana Paula - Consultora SST",
    email: "ana.paula@consultoriasst.com.br",
    telefone: "(11) 91111-0000",
    cpf: "55566677788",
    plano: "bronze",
    valorPlano: "67,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2024-06-18"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: ""
  },
  {
    nome: "Empresa de Mineração Sul",
    email: "sst@mineracaosul.com.br",
    telefone: "(51) 99999-8888",
    cnpj: "78901234000156",
    plano: "diamante",
    valorPlano: "199,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2023-03-25"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: "Grande empresa, múltiplas unidades"
  },
  {
    nome: "Roberto Mendes - TST",
    email: "roberto.mendes@tst.com.br",
    telefone: "(11) 98888-9999",
    cpf: "99988877766",
    plano: "prata",
    valorPlano: "97,90",
    status: "ativo",
    statusPagamento: "atrasado",
    periodicidade: "mensal",
    dataInicio: new Date("2024-07-05"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-11-01"),
    dataProximoPagamento: new Date("2024-12-01"),
    observacoes: "Pagamento em atraso há 30 dias"
  },
  {
    nome: "Construções e Reformas RJ",
    email: "financeiro@construcoesrj.com.br",
    telefone: "(21) 97777-8888",
    cnpj: "89012345000167",
    plano: "ouro",
    valorPlano: "137,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "mensal",
    dataInicio: new Date("2024-01-30"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-01-01"),
    observacoes: ""
  },
  {
    nome: "Fernanda Costa - Engenharia",
    email: "fernanda@engenhariacosta.com.br",
    telefone: "(11) 96666-7777",
    cpf: "44455566677",
    plano: "bronze",
    valorPlano: "67,90",
    status: "ativo",
    statusPagamento: "pendente",
    periodicidade: "mensal",
    dataInicio: new Date("2024-08-15"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-11-01"),
    dataProximoPagamento: new Date("2024-12-20"),
    observacoes: "Aguardando confirmação de pagamento"
  },
  {
    nome: "Grupo Industrial ABC",
    email: "sst@grupindustrial.com.br",
    telefone: "(11) 95555-6666",
    cnpj: "90123456000178",
    plano: "diamante",
    valorPlano: "199,90",
    status: "ativo",
    statusPagamento: "pago",
    periodicidade: "trimestral",
    dataInicio: new Date("2022-12-10"),
    dataFim: null,
    dataUltimoPagamento: new Date("2024-12-01"),
    dataProximoPagamento: new Date("2025-03-01"),
    observacoes: "Cliente desde 2022, muito satisfeito"
  },
  
  // 5 Clientes Inativos/Suspensos
  {
    nome: "Construções Antigas SA",
    email: "contato@construcoesantigas.com.br",
    telefone: "(11) 94444-5555",
    cnpj: "01234567000189",
    plano: "prata",
    valorPlano: "97,90",
    status: "suspenso",
    statusPagamento: "atrasado",
    periodicidade: "mensal",
    dataInicio: new Date("2023-05-20"),
    dataFim: new Date("2024-11-30"),
    dataUltimoPagamento: new Date("2024-09-01"),
    dataProximoPagamento: new Date("2024-10-01"),
    observacoes: "Suspenso por falta de pagamento"
  },
  {
    nome: "Pedro Alves - Consultor",
    email: "pedro.alves@consultor.com.br",
    telefone: "(21) 93333-4444",
    cpf: "33344455566",
    plano: "bronze",
    valorPlano: "67,90",
    status: "cancelado",
    statusPagamento: "cancelado",
    periodicidade: "mensal",
    dataInicio: new Date("2024-02-10"),
    dataFim: new Date("2024-10-15"),
    dataUltimoPagamento: new Date("2024-09-01"),
    dataProximoPagamento: null,
    observacoes: "Cancelado a pedido do cliente"
  },
  {
    nome: "Indústria Química XYZ",
    email: "sst@industriaquimica.com.br",
    telefone: "(11) 92222-3333",
    cnpj: "12345067000190",
    plano: "ouro",
    valorPlano: "137,90",
    status: "suspenso",
    statusPagamento: "atrasado",
    periodicidade: "mensal",
    dataInicio: new Date("2023-08-05"),
    dataFim: new Date("2024-11-01"),
    dataUltimoPagamento: new Date("2024-10-01"),
    dataProximoPagamento: new Date("2024-11-01"),
    observacoes: "Suspenso temporariamente"
  },
  {
    nome: "Lucia Ferreira - TST",
    email: "lucia.ferreira@tst.com.br",
    telefone: "(11) 91111-2222",
    cpf: "22233344455",
    plano: "prata",
    valorPlano: "97,90",
    status: "cancelado",
    statusPagamento: "cancelado",
    periodicidade: "mensal",
    dataInicio: new Date("2024-03-12"),
    dataFim: new Date("2024-09-30"),
    dataUltimoPagamento: new Date("2024-08-01"),
    dataProximoPagamento: null,
    observacoes: "Cancelado - migrou para outro sistema"
  },
  {
    nome: "Construções Fechadas LTDA",
    email: "contato@construcoesfechadas.com.br",
    telefone: "(21) 90000-1111",
    cnpj: "23456078000101",
    plano: "bronze",
    valorPlano: "67,90",
    status: "suspenso",
    statusPagamento: "atrasado",
    periodicidade: "mensal",
    dataInicio: new Date("2024-04-20"),
    dataFim: new Date("2024-11-15"),
    dataUltimoPagamento: new Date("2024-10-01"),
    dataProximoPagamento: new Date("2024-11-01"),
    observacoes: "Empresa fechou, suspenso"
  }
];

async function criarClientesExemplo() {
  console.log("🔌 Verificando conexão com banco de dados...");
  console.log("📝 DATABASE_URL:", process.env.DATABASE_URL ? "Configurado" : "NÃO CONFIGURADO");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Erro: Não foi possível conectar ao banco de dados");
    console.error("💡 Verifique se a variável DATABASE_URL está configurada no arquivo .env");
    process.exit(1);
  }
  
  console.log("✅ Conectado ao banco de dados com sucesso!\n");

  try {
    console.log("🔄 Criando 20 clientes de exemplo...\n");

    let criados = 0;
    let atualizados = 0;

    for (const cliente of clientesExemplo) {
      // Verificar se já existe (por CNPJ ou CPF)
      let tenantExistente = null;
      
      if (cliente.cnpj) {
        const [existing] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.cnpj as any, cliente.cnpj))
          .limit(1);
        tenantExistente = existing;
      } else if (cliente.cpf) {
        const [existing] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.cpf as any, cliente.cpf))
          .limit(1);
        tenantExistente = existing;
      }

      if (tenantExistente) {
        // Atualizar existente
        await db
          .update(tenants)
          .set({
            nome: cliente.nome,
            email: cliente.email || null,
            telefone: cliente.telefone || null,
            cpf: cliente.cpf || null,
            cnpj: cliente.cnpj || null,
            plano: cliente.plano as any,
            valorPlano: cliente.valorPlano || null,
            status: cliente.status as any,
            statusPagamento: cliente.statusPagamento as any,
            periodicidade: cliente.periodicidade as any,
            dataInicio: cliente.dataInicio,
            dataFim: cliente.dataFim || null,
            dataUltimoPagamento: cliente.dataUltimoPagamento || null,
            dataProximoPagamento: cliente.dataProximoPagamento || null,
            observacoes: cliente.observacoes || null,
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenantExistente.id));
        
        atualizados++;
        console.log(`✅ Atualizado: ${cliente.nome}`);
      } else {
        // Criar novo
        await db.insert(tenants).values({
          nome: cliente.nome,
          email: cliente.email || null,
          telefone: cliente.telefone || null,
          cpf: cliente.cpf || null,
          cnpj: cliente.cnpj || null,
          plano: cliente.plano as any,
          valorPlano: cliente.valorPlano || null,
          status: cliente.status as any,
          statusPagamento: cliente.statusPagamento as any,
          periodicidade: cliente.periodicidade as any,
          dataInicio: cliente.dataInicio,
          dataFim: cliente.dataFim || null,
          dataUltimoPagamento: cliente.dataUltimoPagamento || null,
          dataProximoPagamento: cliente.dataProximoPagamento || null,
          observacoes: cliente.observacoes || null,
        });
        
        criados++;
        console.log(`✨ Criado: ${cliente.nome}`);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✨ Criados: ${criados}`);
    console.log(`   ✅ Atualizados: ${atualizados}`);
    console.log(`   📦 Total processados: ${clientesExemplo.length}`);
    console.log(`\n🎉 Clientes de exemplo criados com sucesso!`);
  } catch (error) {
    console.error("❌ Erro ao criar clientes:", error);
    process.exit(1);
  }
}

criarClientesExemplo()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });

