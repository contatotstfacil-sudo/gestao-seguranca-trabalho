import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
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
