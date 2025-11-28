import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { getColaboradorStats } from "../server/db";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function testarBackendDashboard() {
  try {
    console.log("🧪 TESTE INTERNO DO BACKEND - Dashboard de Colaboradores\n");
    console.log("=".repeat(60));

    // Teste 1: Sem filtro (todas as empresas)
    console.log("\n📊 TESTE 1: Sem filtro (todas as empresas)");
    console.log("-".repeat(60));
    const resultado1 = await getColaboradorStats(undefined, undefined);
    console.log("Resultado:", {
      total: resultado1.total,
      ativos: resultado1.ativos,
      inativos: resultado1.inativos,
      taxa: resultado1.taxa,
      totalHomens: resultado1.totalHomens,
      totalMulheres: resultado1.totalMulheres,
      percentualHomens: resultado1.percentualHomens,
      percentualMulheres: resultado1.percentualMulheres,
    });
    console.log(`✅ Total esperado: ~1001 colaboradores`);
    console.log(`✅ Resultado obtido: ${resultado1.total} colaboradores`);
    console.log(resultado1.total === 1001 ? "✅ CORRETO" : "❌ INCORRETO");

    // Teste 2: Empresa ID 1
    console.log("\n📊 TESTE 2: Empresa ID 1 (Construtora Horizonte Ltda)");
    console.log("-".repeat(60));
    const resultado2 = await getColaboradorStats(1, undefined);
    console.log("Resultado:", {
      total: resultado2.total,
      ativos: resultado2.ativos,
      inativos: resultado2.inativos,
      taxa: resultado2.taxa,
      totalHomens: resultado2.totalHomens,
      totalMulheres: resultado2.totalMulheres,
    });
    console.log(`✅ Total esperado: ~274 colaboradores`);
    console.log(`✅ Resultado obtido: ${resultado2.total} colaboradores`);
    console.log(resultado2.total === 274 ? "✅ CORRETO" : "❌ INCORRETO");

    // Teste 3: Empresa ID 2
    console.log("\n📊 TESTE 3: Empresa ID 2 (Engenharia e Construções São Paulo S.A.)");
    console.log("-".repeat(60));
    const resultado3 = await getColaboradorStats(2, undefined);
    console.log("Resultado:", {
      total: resultado3.total,
      ativos: resultado3.ativos,
      inativos: resultado3.inativos,
      taxa: resultado3.taxa,
      totalHomens: resultado3.totalHomens,
      totalMulheres: resultado3.totalMulheres,
    });
    console.log(`✅ Total esperado: ~216 colaboradores`);
    console.log(`✅ Resultado obtido: ${resultado3.total} colaboradores`);
    console.log(resultado3.total === 216 ? "✅ CORRETO" : "❌ INCORRETO");

    // Teste 4: Empresa ID 12 (menor)
    console.log("\n📊 TESTE 4: Empresa ID 12 (Construções e Infraestrutura Brasil Ltda)");
    console.log("-".repeat(60));
    const resultado4 = await getColaboradorStats(12, undefined);
    console.log("Resultado:", {
      total: resultado4.total,
      ativos: resultado4.ativos,
      inativos: resultado4.inativos,
      taxa: resultado4.taxa,
      totalHomens: resultado4.totalHomens,
      totalMulheres: resultado4.totalMulheres,
    });
    console.log(`✅ Total esperado: ~43 colaboradores`);
    console.log(`✅ Resultado obtido: ${resultado4.total} colaboradores`);
    console.log(resultado4.total === 43 ? "✅ CORRETO" : "❌ INCORRETO");

    // Teste 5: Verificar se os resultados são diferentes
    console.log("\n📊 TESTE 5: Verificar se os resultados são diferentes");
    console.log("-".repeat(60));
    const todosDiferentes = 
      resultado1.total !== resultado2.total &&
      resultado2.total !== resultado3.total &&
      resultado3.total !== resultado4.total;
    
    console.log("Resultados diferentes:", todosDiferentes ? "✅ SIM" : "❌ NÃO");
    console.log("\nComparação:");
    console.log(`  Todas empresas: ${resultado1.total}`);
    console.log(`  Empresa 1: ${resultado2.total}`);
    console.log(`  Empresa 2: ${resultado3.total}`);
    console.log(`  Empresa 12: ${resultado4.total}`);

    // Teste 6: Verificar top funções
    console.log("\n📊 TESTE 6: Verificar Top Funções");
    console.log("-".repeat(60));
    console.log("Top 10 Funções (Empresa 1):");
    resultado2.topFuncoes?.slice(0, 5).forEach((f: any, i: number) => {
      console.log(`  ${i + 1}. ${f.funcao}: ${f.count}`);
    });

    // Teste 7: Verificar top setores
    console.log("\n📊 TESTE 7: Verificar Top Setores");
    console.log("-".repeat(60));
    console.log("Top 10 Setores (Empresa 1):");
    resultado2.topSetores?.slice(0, 5).forEach((s: any, i: number) => {
      console.log(`  ${i + 1}. ${s.setor}: ${s.count}`);
    });

    // Teste 8: Verificar mais antigos e mais novos
    console.log("\n📊 TESTE 8: Verificar Mais Antigos e Mais Novos");
    console.log("-".repeat(60));
    console.log("Mais Antigos (Empresa 1):");
    resultado2.maisAntigos?.slice(0, 3).forEach((m: any, i: number) => {
      console.log(`  ${i + 1}. ${m.nome} - ${m.funcao} - ${m.dataAdmissao}`);
    });
    console.log("Mais Novos (Empresa 1):");
    resultado2.maisNovos?.slice(0, 3).forEach((m: any, i: number) => {
      console.log(`  ${i + 1}. ${m.nome} - ${m.funcao} - ${m.dataAdmissao}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ TESTE INTERNO CONCLUÍDO");
    console.log("=".repeat(60));
    console.log("\n💡 CONCLUSÃO:");
    if (todosDiferentes && resultado1.total === 1001) {
      console.log("✅ Backend está funcionando CORRETAMENTE!");
      console.log("❌ O problema está no FRONTEND (React Query/tRPC não está atualizando)");
    } else {
      console.log("❌ Backend pode ter problemas!");
    }

  } catch (error) {
    console.error("❌ Erro no teste:", error);
    throw error;
  }
}

// Executar
testarBackendDashboard()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

