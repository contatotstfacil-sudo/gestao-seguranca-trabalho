/**
 * Utilitários para gerenciar planos e assinaturas
 */

import { getDb } from "../db";
import { planos, assinaturas, empresas, colaboradores } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export interface LimitesPlano {
  limiteEmpresas: number | null;
  limiteColaboradoresPorEmpresa: number | null;
  limiteColaboradoresTotal: number | null;
}

/**
 * Obtém os limites do plano do usuário
 */
export async function getLimitesPlano(userId: number): Promise<LimitesPlano | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Buscar assinatura ativa do usuário
    const assinaturaAtiva = await db
      .select({
        planoId: assinaturas.planoId,
        status: assinaturas.status,
        dataFim: assinaturas.dataFim,
      })
      .from(assinaturas)
      .where(
        and(
          eq(assinaturas.userId, userId),
          eq(assinaturas.status, "ativa")
        )
      )
      .limit(1);

    if (!assinaturaAtiva || assinaturaAtiva.length === 0) {
      return null; // Usuário sem assinatura ativa
    }

    const assinatura = assinaturaAtiva[0];

    // Verificar se a assinatura não está vencida
    if (new Date(assinatura.dataFim) < new Date()) {
      return null; // Assinatura vencida
    }

    // Buscar o plano
    const plano = await db
      .select({
        limiteEmpresas: planos.limiteEmpresas,
        limiteColaboradoresPorEmpresa: planos.limiteColaboradoresPorEmpresa,
        limiteColaboradoresTotal: planos.limiteColaboradoresTotal,
      })
      .from(planos)
      .where(eq(planos.id, assinatura.planoId))
      .limit(1);

    if (!plano || plano.length === 0) {
      return null;
    }

    return {
      limiteEmpresas: plano[0].limiteEmpresas,
      limiteColaboradoresPorEmpresa: plano[0].limiteColaboradoresPorEmpresa,
      limiteColaboradoresTotal: plano[0].limiteColaboradoresTotal,
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

  const db = await getDb();
  if (!db) return { pode: false, motivo: "Erro ao conectar ao banco de dados" };

  // Contar empresas ativas do usuário
  const empresasCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(empresas)
    .where(eq(empresas.status, "ativa"));

  const totalEmpresas = empresasCount[0]?.count || 0;

  if (totalEmpresas >= limites.limiteEmpresas) {
    return {
      pode: false,
      motivo: `Limite de ${limites.limiteEmpresas} empresa(s) atingido. Faça upgrade do plano para adicionar mais empresas.`,
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
    const colaboradoresTotalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(colaboradores)
      .where(eq(colaboradores.status, "ativo"));

    const totalColaboradores = colaboradoresTotalCount[0]?.count || 0;

    if (totalColaboradores >= limites.limiteColaboradoresTotal) {
      return {
        pode: false,
        motivo: `Limite total de ${limites.limiteColaboradoresTotal} colaborador(es) atingido. Faça upgrade do plano.`,
      };
    }
  }

  // Verificar limite por empresa
  if (limites.limiteColaboradoresPorEmpresa !== null) {
    const colaboradoresEmpresaCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(colaboradores)
      .where(
        and(
          eq(colaboradores.empresaId, empresaId),
          eq(colaboradores.status, "ativo")
        )
      );

    const colaboradoresNaEmpresa = colaboradoresEmpresaCount[0]?.count || 0;

    if (colaboradoresNaEmpresa >= limites.limiteColaboradoresPorEmpresa) {
      return {
        pode: false,
        motivo: `Limite de ${limites.limiteColaboradoresPorEmpresa} colaborador(es) por empresa atingido para esta empresa. Faça upgrade do plano.`,
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

