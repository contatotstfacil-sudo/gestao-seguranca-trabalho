/**
 * Utilitários para gerenciar planos e assinaturas
 */

import { getDb } from "../db";
import { empresas, colaboradores, users, tenants } from "../../drizzle/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export interface LimitesPlano {
  limiteEmpresas: number | null;
  limiteColaboradoresPorEmpresa: number | null;
  limiteColaboradoresTotal: number | null;
  tenantId: number | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  planoNome: string | null;
}

// Limites hardcoded por plano (conforme oferta atual)
const PLAN_LIMITS: Record<
  string,
  { limiteEmpresas: number | null; limiteColaboradoresPorEmpresa: number | null; limiteColaboradoresTotal: number | null }
> = {
  bronze: { limiteEmpresas: 5, limiteColaboradoresPorEmpresa: 20, limiteColaboradoresTotal: null },
  prata: { limiteEmpresas: 20, limiteColaboradoresPorEmpresa: 20, limiteColaboradoresTotal: null },
  ouro: { limiteEmpresas: 50, limiteColaboradoresPorEmpresa: 100, limiteColaboradoresTotal: null },
  diamante: { limiteEmpresas: null, limiteColaboradoresPorEmpresa: null, limiteColaboradoresTotal: null }, // ilimitado
};

/**
 * Obtém os limites do plano do usuário
 */
export async function getLimitesPlano(userId: number): Promise<LimitesPlano | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Obter tenant do usuário
    const userRow = await db
      .select({
        tenantId: users.tenantId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const tenantId = userRow?.[0]?.tenantId ?? null;

    if (!tenantId) {
      return null;
    }

    // Buscar tenant e validar período de pagamento
    const tenantRow = await db
      .select({
        id: tenants.id,
        plano: tenants.plano,
        status: tenants.status,
        statusPagamento: tenants.statusPagamento,
        dataInicio: tenants.dataInicio,
        dataFim: tenants.dataFim,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantRow || tenantRow.length === 0) return null;
    const tenant = tenantRow[0];

    if (tenant.status !== "ativo" || tenant.statusPagamento !== "pago") {
      return null; // assinatura/tenant não ativo/pago
    }

    const agora = new Date();
    const inicio = tenant.dataInicio ? new Date(tenant.dataInicio) : null;
    const fim = tenant.dataFim ? new Date(tenant.dataFim) : null;

    if (fim && fim < agora) {
      return null; // ciclo vencido
    }

    // Mapear limites com base no plano do tenant
    // Como os planos estão na tabela planos, buscamos pelo nome
    const planoDb = await db
      .select({
        plano: tenants.plano,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!planoDb || planoDb.length === 0) return null;

    const planoNome = String(planoDb[0].plano);
    const limits = PLAN_LIMITS[planoNome] || { limiteEmpresas: null, limiteColaboradoresPorEmpresa: null, limiteColaboradoresTotal: null };

    return {
      limiteEmpresas: limits.limiteEmpresas,
      limiteColaboradoresPorEmpresa: limits.limiteColaboradoresPorEmpresa,
      limiteColaboradoresTotal: limits.limiteColaboradoresTotal,
      tenantId,
      dataInicio: inicio,
      dataFim: fim,
      planoNome,
    };
  } catch (error) {
    console.error("[getLimitesPlano] Erro:", error);
    return null;
  }
}

/**
 * Verifica se o usuário pode criar uma nova empresa
 */
export async function podeCriarEmpresa(userId: number, userRole?: string): Promise<{ pode: boolean; motivo?: string }> {
  // Admin não precisa de plano
  if (userRole === "admin") {
    return { pode: true };
  }

  const limites = await getLimitesPlano(userId);
  
  if (!limites) {
    return { pode: false, motivo: "Usuário sem assinatura ativa" };
  }

  // Se limiteEmpresas é null, significa ilimitado
  if (limites.limiteEmpresas === null) {
    return { pode: true };
  }

   const { tenantId, dataInicio, dataFim } = limites;

  const db = await getDb();
  if (!db) return { pode: false, motivo: "Erro ao conectar ao banco de dados" };

  // Contar empresas criadas no ciclo da assinatura (independente de status)
  const whereEmpresa = tenantId
    ? [eq(empresas.tenantId, tenantId)]
    : [];

  if (dataInicio) {
    whereEmpresa.push(gte(empresas.createdAt, dataInicio));
  }
  if (dataFim) {
    whereEmpresa.push(lte(empresas.createdAt, dataFim));
  }

  const empresasCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(empresas)
    .where(whereEmpresa.length ? and(...whereEmpresa) : undefined);

  const totalEmpresas = empresasCount[0]?.count || 0;

  if (totalEmpresas >= limites.limiteEmpresas) {
    return {
      pode: false,
      motivo: `Limite de ${limites.limiteEmpresas} empresa(s) do plano ${limites.planoNome || ""} neste ciclo atingido. Excluir não libera vaga até a virada do ciclo. Faça upgrade ou aguarde o próximo ciclo.`,
    };
  }

  return { pode: true };
}

/**
 * Verifica se o usuário pode criar um novo colaborador em uma empresa
 */
export async function podeCriarColaborador(
  userId: number,
  empresaId: number,
  userRole?: string
): Promise<{ pode: boolean; motivo?: string }> {
  // Admin não precisa de plano
  if (userRole === "admin") {
    return { pode: true };
  }

  const limites = await getLimitesPlano(userId);
  
  if (!limites) {
    return { pode: false, motivo: "Usuário sem assinatura ativa" };
  }

  const db = await getDb();
  if (!db) return { pode: false, motivo: "Erro ao conectar ao banco de dados" };

  // Verificar limite total de colaboradores
  if (limites.limiteColaboradoresTotal !== null) {
    const filtrosTotal = [];
    if (limites.tenantId) {
      filtrosTotal.push(eq(colaboradores.tenantId, limites.tenantId));
    }
    if (limites.dataInicio) {
      filtrosTotal.push(gte(colaboradores.createdAt, limites.dataInicio));
    }
    if (limites.dataFim) {
      filtrosTotal.push(lte(colaboradores.createdAt, limites.dataFim));
    }

    const colaboradoresTotalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(colaboradores)
      .where(filtrosTotal.length ? and(...filtrosTotal) : undefined);

    const totalColaboradores = colaboradoresTotalCount[0]?.count || 0;

    if (totalColaboradores >= limites.limiteColaboradoresTotal) {
      return {
        pode: false,
        motivo: `Limite total de ${limites.limiteColaboradoresTotal} colaborador(es) do plano ${limites.planoNome || ""} neste ciclo atingido. Excluir/demitir não libera vaga até a virada do ciclo. Faça upgrade ou aguarde o próximo ciclo.`,
      };
    }
  }

  // Verificar limite por empresa
  if (limites.limiteColaboradoresPorEmpresa !== null) {
    const filtrosEmpresa = [eq(colaboradores.empresaId, empresaId)];
    if (limites.tenantId) {
      filtrosEmpresa.push(eq(colaboradores.tenantId, limites.tenantId));
    }
    if (limites.dataInicio) {
      filtrosEmpresa.push(gte(colaboradores.createdAt, limites.dataInicio));
    }
    if (limites.dataFim) {
      filtrosEmpresa.push(lte(colaboradores.createdAt, limites.dataFim));
    }

    const colaboradoresEmpresaCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(colaboradores)
      .where(and(...filtrosEmpresa));

    const colaboradoresNaEmpresa = colaboradoresEmpresaCount[0]?.count || 0;

    if (colaboradoresNaEmpresa >= limites.limiteColaboradoresPorEmpresa) {
      return {
        pode: false,
        motivo: `Limite de ${limites.limiteColaboradoresPorEmpresa} colaborador(es) por empresa no plano ${limites.planoNome || ""} neste ciclo atingido. Excluir/demitir não libera vaga até a virada do ciclo. Faça upgrade ou aguarde o próximo ciclo.`,
      };
    }
  }

  return { pode: true };
}

/**
 * Obtém informações do plano do usuário
 */
export async function getPlanoUsuario(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const assinatura = await db
      .select({
        id: assinaturas.id,
        status: assinaturas.status,
        periodo: assinaturas.periodo,
        dataInicio: assinaturas.dataInicio,
        dataFim: assinaturas.dataFim,
        valorPago: assinaturas.valorPago,
        plano: {
          id: planos.id,
          nome: planos.nome,
          nomeExibicao: planos.nomeExibicao,
          descricao: planos.descricao,
          precoMensal: planos.precoMensal,
          precoTrimestral: planos.precoTrimestral,
          limiteEmpresas: planos.limiteEmpresas,
          limiteColaboradoresPorEmpresa: planos.limiteColaboradoresPorEmpresa,
          limiteColaboradoresTotal: planos.limiteColaboradoresTotal,
        },
      })
      .from(assinaturas)
      .innerJoin(planos, eq(assinaturas.planoId, planos.id))
      .where(
        and(
          eq(assinaturas.userId, userId),
          eq(assinaturas.status, "ativa")
        )
      )
      .limit(1);

    return assinatura[0] || null;
  } catch (error) {
    console.error("[getPlanoUsuario] Erro:", error);
    return null;
  }
}

