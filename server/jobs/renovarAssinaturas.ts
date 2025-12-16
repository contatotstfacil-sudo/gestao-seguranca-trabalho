import { getDb } from "../db";
import { tenants } from "../../drizzle/schema";
import { and, eq, lte } from "drizzle-orm";

function addPeriod(periodicidade: string | null, start: Date): { inicio: Date; fim: Date } {
  const inicio = new Date(start);
  const fim = new Date(start);

  switch (periodicidade) {
    case "trimestral":
      fim.setMonth(fim.getMonth() + 3);
      break;
    case "semestral":
      fim.setMonth(fim.getMonth() + 6);
      break;
    case "anual":
      fim.setFullYear(fim.getFullYear() + 1);
      break;
    case "mensal":
    default:
      fim.setMonth(fim.getMonth() + 1);
      break;
  }

  return { inicio, fim };
}

/**
 * Renova automaticamente os tenants com pagamento em dia cujo ciclo venceu.
 * - Se statusPagamento = "pago" e dataFim <= hoje: cria novo ciclo (dataInicio = hoje, dataFim += período)
 * - Se statusPagamento != "pago" e dataFim <= hoje: marca status = "suspenso" e statusPagamento = "atrasado"
 *
 * Observação: cobrança/integração com gateway deve atualizar statusPagamento para "pago".
 */
export async function renovarAssinaturas() {
  const db = await getDb();
  if (!db) {
    console.error("[renovarAssinaturas] Banco indisponível");
    return;
  }

  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);

  // Tenants com pagamento em dia
  const ativos = await db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.status, "ativo"),
        eq(tenants.statusPagamento, "pago"),
        lte(tenants.dataFim, hojeStr)
      )
    );

  for (const t of ativos) {
    const { inicio, fim } = addPeriod(t.periodicidade, hoje);
    try {
      await db
        .update(tenants)
        .set({
          dataInicio: inicio,
          dataFim: fim,
          dataUltimoPagamento: hoje,
          dataProximoPagamento: fim,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, t.id));

      console.log(`[renovarAssinaturas] Tenant ${t.id} renovado até ${fim.toISOString().slice(0, 10)}`);
    } catch (error) {
      console.error("[renovarAssinaturas] Erro ao renovar tenant", t.id, error);
    }
  }

  // Tenants vencidos sem pagamento
  const atrasados = await db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.status, "ativo"),
        lte(tenants.dataFim, hojeStr),
        eq(tenants.statusPagamento, "pendente")
      )
    );

  for (const t of atrasados) {
    try {
      await db
        .update(tenants)
        .set({
          status: "suspenso",
          statusPagamento: "atrasado",
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, t.id));

      console.log(`[renovarAssinaturas] Tenant ${t.id} suspenso por falta de pagamento.`);
    } catch (error) {
      console.error("[renovarAssinaturas] Erro ao suspender tenant", t.id, error);
    }
  }
}

// Execução direta (ex.: `ts-node server/jobs/renovarAssinaturas.ts`)
if (require.main === module) {
  renovarAssinaturas()
    .then(() => {
      console.log("[renovarAssinaturas] Job concluído");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[renovarAssinaturas] Falha", err);
      process.exit(1);
    });
}


