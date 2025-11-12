/**
 * Script para testar o sistema de planos e assinaturas
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

async function testarPlanos() {
  console.log("🧪 Testando sistema de planos e assinaturas...\n");

  try {
    // Importar funções de teste
    const { getDb } = await import("../server/db");
    const { planos, assinaturas, users } = await import("../drizzle/schema");
    const { eq, asc } = await import("drizzle-orm");
    const { podeCriarEmpresa, podeCriarColaborador, getPlanoUsuario, getLimitesPlano } = await import("../server/utils/planos");

    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }

    console.log("✅ Conexão com banco estabelecida\n");

    // Teste 1: Listar planos
    console.log("📋 Teste 1: Listando planos disponíveis...");
    const planosList = await db.select().from(planos).where(eq(planos.ativo, true)).orderBy(asc(planos.ordem));
    console.log(`   ✅ Encontrados ${planosList.length} planos:`);
    planosList.forEach((plano) => {
      console.log(`      - ${plano.nomeExibicao} (${plano.nome}): R$ ${(plano.precoMensal / 100).toFixed(2)}/mês`);
      console.log(`        Limite empresas: ${plano.limiteEmpresas ?? "Ilimitado"}`);
      console.log(`        Limite colaboradores/empresa: ${plano.limiteColaboradoresPorEmpresa ?? "Ilimitado"}`);
      console.log(`        Limite colaboradores total: ${plano.limiteColaboradoresTotal ?? "Ilimitado"}`);
    });
    console.log("");

    // Teste 2: Buscar primeiro usuário para testar
    console.log("👤 Teste 2: Buscando usuários...");
    const usuarios = await db.select().from(users).limit(5);
    console.log(`   ✅ Encontrados ${usuarios.length} usuário(s)`);
    
    if (usuarios.length === 0) {
      console.log("   ⚠️  Nenhum usuário encontrado. Criando usuário de teste...");
      // Criar usuário de teste se não existir
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash("teste123", 10);
      
      const [novoUsuario] = await db.insert(users).values({
        name: "Usuário Teste",
        email: "teste@exemplo.com",
        passwordHash,
        role: "user",
      });
      
      console.log(`   ✅ Usuário de teste criado: ID ${novoUsuario.insertId}`);
      usuarios.push({ id: novoUsuario.insertId as number, ...novoUsuario } as any);
    }

    const usuarioTeste = usuarios[0];
    console.log(`   ✅ Usando usuário ID ${usuarioTeste.id} (${usuarioTeste.email || usuarioTeste.name})\n`);

    // Teste 3: Verificar limites sem assinatura
    console.log("🔍 Teste 3: Verificando limites sem assinatura...");
    const limitesSemAssinatura = await getLimitesPlano(usuarioTeste.id);
    if (limitesSemAssinatura === null) {
      console.log("   ✅ Limites retornam null (sem assinatura) - correto!");
    } else {
      console.log("   ⚠️  Limites retornados mesmo sem assinatura");
    }
    console.log("");

    // Teste 4: Criar assinatura de teste
    console.log("💳 Teste 4: Criando assinatura de teste...");
    const planoBasico = planosList.find(p => p.nome === "basico");
    
    if (!planoBasico) {
      throw new Error("Plano básico não encontrado");
    }

    // Verificar se já existe assinatura ativa
    const assinaturasExistentes = await db.select().from(assinaturas).where(
      eq(assinaturas.userId, usuarioTeste.id)
    );

    let assinaturaTeste;
    if (assinaturasExistentes.length === 0) {
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 30); // 30 dias

      const [novaAssinatura] = await db.insert(assinaturas).values({
        userId: usuarioTeste.id,
        planoId: planoBasico.id,
        periodo: "mensal",
        dataInicio,
        dataFim,
        valorPago: planoBasico.precoMensal,
        status: "ativa",
      });

      // Atualizar plano do usuário
      await db.update(users)
        .set({ planoId: planoBasico.id })
        .where(eq(users.id, usuarioTeste.id));

      console.log(`   ✅ Assinatura criada: ID ${novaAssinatura.insertId}`);
      console.log(`      Plano: ${planoBasico.nomeExibicao}`);
      console.log(`      Válida até: ${dataFim.toLocaleDateString("pt-BR")}`);
      assinaturaTeste = { id: novaAssinatura.insertId as number, ...novaAssinatura } as any;
    } else {
      assinaturaTeste = assinaturasExistentes[0];
      console.log(`   ℹ️  Assinatura já existe: ID ${assinaturaTeste.id}`);
    }
    console.log("");

    // Teste 5: Verificar limites com assinatura
    console.log("🔍 Teste 5: Verificando limites com assinatura...");
    const limitesComAssinatura = await getLimitesPlano(usuarioTeste.id);
    if (limitesComAssinatura) {
      console.log("   ✅ Limites obtidos:");
      console.log(`      - Empresas: ${limitesComAssinatura.limiteEmpresas ?? "Ilimitado"}`);
      console.log(`      - Colaboradores por empresa: ${limitesComAssinatura.limiteColaboradoresPorEmpresa ?? "Ilimitado"}`);
      console.log(`      - Colaboradores total: ${limitesComAssinatura.limiteColaboradoresTotal ?? "Ilimitado"}`);
    } else {
      console.log("   ❌ Limites não obtidos");
    }
    console.log("");

    // Teste 6: Validar criação de empresa
    console.log("🏢 Teste 6: Validando criação de empresa...");
    const validacaoEmpresa = await podeCriarEmpresa(usuarioTeste.id);
    console.log(`   ${validacaoEmpresa.pode ? "✅" : "❌"} Pode criar empresa: ${validacaoEmpresa.pode}`);
    if (!validacaoEmpresa.pode && validacaoEmpresa.motivo) {
      console.log(`      Motivo: ${validacaoEmpresa.motivo}`);
    }
    console.log("");

    // Teste 7: Validar criação de colaborador
    console.log("👷 Teste 7: Validando criação de colaborador...");
    // Buscar primeira empresa ou usar ID 1
    const { empresas: empresasTable } = await import("../drizzle/schema");
    const empresasList = await db.select().from(empresasTable).limit(1);
    const empresaTeste = empresasList.length > 0 ? empresasList[0].id : 1;
    
    const validacaoColaborador = await podeCriarColaborador(usuarioTeste.id, empresaTeste);
    console.log(`   ${validacaoColaborador.pode ? "✅" : "❌"} Pode criar colaborador: ${validacaoColaborador.pode}`);
    if (!validacaoColaborador.pode && validacaoColaborador.motivo) {
      console.log(`      Motivo: ${validacaoColaborador.motivo}`);
    }
    console.log("");

    // Teste 8: Obter plano completo do usuário
    console.log("📊 Teste 8: Obtendo plano completo do usuário...");
    const planoUsuario = await getPlanoUsuario(usuarioTeste.id);
    if (planoUsuario) {
      console.log("   ✅ Plano obtido:");
      console.log(`      - Plano: ${planoUsuario.plano.nomeExibicao}`);
      console.log(`      - Status: ${planoUsuario.status}`);
      console.log(`      - Período: ${planoUsuario.periodo}`);
      console.log(`      - Valor pago: R$ ${(planoUsuario.valorPago / 100).toFixed(2)}`);
      console.log(`      - Válida até: ${new Date(planoUsuario.dataFim).toLocaleDateString("pt-BR")}`);
    } else {
      console.log("   ❌ Plano não obtido");
    }
    console.log("");

    console.log("✅ Todos os testes concluídos com sucesso!\n");

  } catch (error: any) {
    console.error("\n❌ Erro durante os testes:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar testes
testarPlanos()
  .then(() => {
    console.log("🎉 Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });

