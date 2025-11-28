/**
 * Script para testar se o backend está recebendo empresaId corretamente
 * Execute: npx tsx scripts/test-dashboard-stats.ts
 */

import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

async function testDashboardStats() {
  console.log("🧪 TESTE: Verificando se backend recebe empresaId corretamente\n");

  // Simular contexto de admin
  const adminContext = await createContext({
    req: {} as any,
    res: {} as any,
  });

  // Simular usuário admin
  const mockAdminContext = {
    ...adminContext,
    user: {
      id: 1,
      email: "admin@test.com",
      role: "admin" as const,
      empresaId: null,
    },
  };

  const caller = appRouter.createCaller(mockAdminContext);

  console.log("═══════════════════════════════════════");
  console.log("TESTE 1: Sem empresaId (todas as empresas)");
  console.log("═══════════════════════════════════════");
  
  try {
    const result1 = await caller.colaboradores.stats({});
    console.log("✅ Resultado:", {
      total: result1?.total,
      ativos: result1?.ativos,
      inativos: result1?.inativos,
      totalHomens: result1?.totalHomens,
      totalMulheres: result1?.totalMulheres,
    });
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("TESTE 2: Com empresaId = 1");
  console.log("═══════════════════════════════════════");
  
  try {
    const result2 = await caller.colaboradores.stats({ empresaId: 1 });
    console.log("✅ Resultado:", {
      total: result2?.total,
      ativos: result2?.ativos,
      inativos: result2?.inativos,
      totalHomens: result2?.totalHomens,
      totalMulheres: result2?.totalMulheres,
    });
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("TESTE 3: Com empresaId = 2");
  console.log("═══════════════════════════════════════");
  
  try {
    const result3 = await caller.colaboradores.stats({ empresaId: 2 });
    console.log("✅ Resultado:", {
      total: result3?.total,
      ativos: result3?.ativos,
      inativos: result3?.inativos,
      totalHomens: result3?.totalHomens,
      totalMulheres: result3?.totalMulheres,
    });
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }

  console.log("\n✅ Testes concluídos!");
  console.log("\n💡 Verifique os logs acima para ver:");
  console.log("   - Se o input está sendo recebido corretamente");
  console.log("   - Se o empresaId está sendo passado para getColaboradorStats");
  console.log("   - Se os resultados são diferentes para cada empresa");
}

testDashboardStats().catch(console.error);

