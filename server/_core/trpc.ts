import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
// Removido superjson completamente para evitar problemas de serialização
import type { TrpcContext } from "./context";
import { sanitizeError } from "../utils/security";
import { addWatermark, detectCloneAttempt } from "../utils/watermark";

const t = initTRPC.context<TrpcContext>().create({
  // SEM transformer - usando JSON puro para evitar problemas de serialização
  errorFormatter({ shape, error }) {
    // Sanitiza erros para não revelar informações do banco
    const sanitized = sanitizeError(error);
    
    return {
      ...shape,
      message: sanitized.message,
      code: sanitized.code || shape.code,
      // Remove stack trace em produção
      ...(process.env.NODE_ENV === "production" ? {} : { stack: error.stack }),
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Detecta tentativas de clonagem
  if (detectCloneAttempt(ctx.req)) {
    console.error(`[SECURITY] Tentativa de clonagem detectada de IP: ${ctx.req.ip || ctx.req.socket.remoteAddress}`);
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado" 
    });
  }

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // VALIDAÇÃO DE TENANT DESABILITADA - Permite acesso sem bloqueios
  // Apenas log para informação, mas não bloqueia acesso
  if (ctx.user.tenantId) {
    try {
      const { getTenantById } = await import("../db");
      const tenant = await getTenantById(ctx.user.tenantId);
      if (tenant) {
        console.log(`[TRPC] Tenant: ID=${tenant.id}, Status=${tenant.status}`);
      }
    } catch (error) {
      // Não bloqueia acesso mesmo se houver erro ao buscar tenant
      console.warn(`[TRPC] Aviso: Não foi possível buscar informações do tenant (não bloqueia acesso)`);
    }
  }

  // Adiciona informações do plano do tenant ao contexto
  let planLimits = null;
  if (ctx.user.tenantId && ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
    try {
      const { getTenantPlanLimits } = await import("../utils/planLimits");
      planLimits = await getTenantPlanLimits(ctx.user.tenantId);
    } catch (error) {
      console.warn("[TRPC] Erro ao obter limites do plano (não crítico):", error);
    }
  }

  const result = await next({
    ctx: {
      ...ctx,
      user: ctx.user,
      planLimits, // Adiciona limites do plano ao contexto
    },
  });

  // IMPORTANTE: NÃO adicionar watermark em respostas de login/auth
  // Login retorna { success: true, user: {...} } diretamente, não em result.data
  // Verificar se é resposta de login/auth (tem "success" e "user" no result direto)
  const isLoginResponse = result && typeof result === "object" && 
    ("success" in result || ("data" in result && typeof result.data === "object" && result.data && "success" in result.data));
  
  // Adiciona watermark apenas se NÃO for login e se tiver data
  if (result && typeof result === "object" && "data" in result && !isLoginResponse) {
    try {
      // Verificar se data não é resposta de login
      const dataIsLogin = result.data && typeof result.data === "object" && "success" in result.data && "user" in result.data;
      if (!dataIsLogin) {
        result.data = addWatermark(result.data, ctx.user.id);
      }
    } catch (watermarkError) {
      console.warn("[TRPC] Erro ao adicionar watermark (não crítico):", watermarkError);
      // Não bloqueia a resposta se falhar
    }
  }

  return result;
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Permitir admin, super_admin e tenant_admin (administrador geral do sistema)
    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'tenant_admin')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware para verificar permissões específicas
 */
export const requirePermission = (codigoPermissao: string) => {
  return t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    // Admins sempre têm todas as permissões
    if (ctx.user.role === 'admin') {
      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    }

    // Verifica se o usuário tem a permissão específica
    const { userHasPermission } = await import("../db");
    const hasPermission = await userHasPermission(ctx.user.id, codigoPermissao);

    if (!hasPermission) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: `Você não tem permissão para realizar esta ação: ${codigoPermissao}` 
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });
};

/**
 * Procedure que requer uma permissão específica
 */
export const permissionProcedure = (codigoPermissao: string) => {
  return protectedProcedure.use(requirePermission(codigoPermissao));
};
