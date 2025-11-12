import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
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

  const result = await next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });

  // Adiciona watermark nas respostas (apenas se não for login)
  // Login não deve ter watermark para evitar problemas de serialização
  if (result && typeof result === "object" && "data" in result && !("success" in result)) {
    try {
      result.data = addWatermark(result.data, ctx.user.id);
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

    if (!ctx.user || ctx.user.role !== 'admin') {
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
