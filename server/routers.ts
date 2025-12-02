import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import type { InsertResponsavel } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { isValidCPF, isValidCNPJ, isValidEmail, normalizeCPF, normalizeCNPJ } from "./utils/validation";
import { checkLoginRateLimit, recordFailedLogin, clearLoginAttempts, sanitizeInput } from "./utils/security";
import { logAudit, AuditActions } from "./utils/audit";
import bcrypt from "bcryptjs";
import { encryptSensitiveData, decryptSensitiveData } from "./utils/encryption";
import type { InsertAso } from "../drizzle/schema";
import { getTenantPlanLimits, checkQuantityLimit, checkFeatureAvailable, getLimitMessage, getFeatureUnavailableMessage, type PlanoLimits } from "./utils/planLimits";
import { serializeDates } from "./utils/serialization";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      console.log('[Auth.me] ============================================');
      console.log('[Auth.me] Usuário retornado:', user ? { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId } : 'null');
      console.log('[Auth.me] Tipo do role:', user?.role ? typeof user.role : 'N/A');
      console.log('[Auth.me] Role === "admin"?', user?.role === 'admin');
      console.log('[Auth.me] Role === "super_admin"?', user?.role === 'super_admin');
      console.log('[Auth.me] Role (String):', user?.role ? String(user.role) : 'N/A');
      
      // Garantir que o role seja retornado como string e que todos os campos necessários estejam presentes
      // IMPORTANTE: Converter Date para string para evitar problemas de serialização
      if (user) {
        const userResponse = {
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          cpf: user.cpf || null,
          cnpj: user.cnpj || null,
          role: String(user.role || 'user'), // Força o role a ser string
          tenantId: user.tenantId || null,
          empresaId: user.empresaId || null,
          openId: user.openId || null,
          loginMethod: user.loginMethod || null,
          createdAt: user.createdAt ? (user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt)) : null,
          updatedAt: user.updatedAt ? (user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt)) : null,
          lastSignedIn: user.lastSignedIn ? (user.lastSignedIn instanceof Date ? user.lastSignedIn.toISOString() : String(user.lastSignedIn)) : null,
        };
        console.log('[Auth.me] Usuário serializado:', { id: userResponse.id, email: userResponse.email, role: userResponse.role });
        return userResponse;
      }
      console.log('[Auth.me] Usuário é null');
      return null;
    }),
    login: publicProcedure
      .input(z.object({
        identifier: z.string().min(1, "Email, CPF ou CNPJ é obrigatório"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { identifier, password } = input;
          
          console.log(`[Login] 🔐 Tentativa de login iniciada para: ${identifier?.substring(0, 10)}...`);
          
          // Rate limiting para login (mais permissivo)
          const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
          const rateLimit = checkLoginRateLimit(ip);
          if (!rateLimit.allowed) {
            throw new Error(`Muitas tentativas de login. Tente novamente em ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutos.`);
          }
          
          // Normaliza o identificador (sem sanitização agressiva)
          let normalizedIdentifier = identifier.trim();
          console.log(`[Login] Identificador recebido: "${normalizedIdentifier}"`);
          
          // Verifica se é CPF ou CNPJ e normaliza (aceita mesmo sem validação rigorosa)
          const cleanCPF = normalizeCPF(normalizedIdentifier);
          const cleanCNPJ = normalizeCNPJ(normalizedIdentifier);
          
          // Aceita CPF se tiver 11 dígitos (mesmo sem validação rigorosa)
          if (cleanCPF.length === 11) {
            normalizedIdentifier = cleanCPF;
            console.log(`[Login] CPF detectado (11 dígitos): ${normalizedIdentifier}`);
          } 
          // Aceita CNPJ se tiver 14 dígitos
          else if (cleanCNPJ.length === 14) {
            normalizedIdentifier = cleanCNPJ;
            console.log(`[Login] CNPJ detectado (14 dígitos): ${normalizedIdentifier}`);
          } 
          // Caso contrário, assume que é email
          else {
            normalizedIdentifier = normalizedIdentifier.toLowerCase();
            console.log(`[Login] Assumindo email: ${normalizedIdentifier}`);
          }
          
          console.log(`[Login] Buscando usuário com identificador: "${normalizedIdentifier}"`);
          
          // Busca o usuário por email, CPF ou CNPJ
          const user = await db.getUserByIdentifier(normalizedIdentifier);
          
          if (!user) {
            console.log(`[Login] Usuário não encontrado para: ${normalizedIdentifier}`);
            recordFailedLogin(ip);
            throw new Error("Usuário não encontrado. Verifique seu CPF, CNPJ ou email.");
          }
          
          console.log(`[Login] Usuário encontrado: ID=${user.id}, Email=${user.email || "N/A"}, CPF=${user.cpf || "N/A"}, Role=${user.role}, TenantId=${user.tenantId || "N/A"}`);
          
          if (!user.passwordHash) {
            recordFailedLogin(ip);
            throw new Error("Este usuário não possui senha cadastrada.");
          }
          
          // Verifica a senha (sem sanitização adicional)
          const passwordMatch = await bcrypt.compare(password, user.passwordHash);
          
          if (!passwordMatch) {
            console.log(`[Login] Senha incorreta para usuário ID=${user.id}`);
            recordFailedLogin(ip);
            throw new Error("Senha incorreta. Verifique sua senha e tente novamente.");
          }
          
          console.log(`[Login] Senha correta para usuário ID=${user.id}`);
          
          // VALIDAÇÃO DE TENANT DESABILITADA - Permite acesso sem bloqueios
          // Apenas log para informação, mas não bloqueia acesso
          console.log(`[Login] Usuário ID=${user.id}, Role=${user.role}, TenantId=${user.tenantId || "N/A"}`);
          
          if (user.tenantId) {
            try {
              const tenant = await db.getTenantById(user.tenantId);
              if (tenant) {
                console.log(`[Login] Tenant encontrado: ID=${tenant.id}, Status=${tenant.status}`);
              }
            } catch (error) {
              // Não bloqueia acesso mesmo se houver erro ao buscar tenant
              console.warn(`[Login] Aviso: Não foi possível buscar informações do tenant (não bloqueia acesso)`);
            }
          }
          
          console.log(`[Login] ✅ Login bem-sucedido para usuário ID=${user.id}`);
          
          // Limpa tentativas de login após sucesso
          clearLoginAttempts(ip);
          
          // Garante que o usuário tenha um openId
          const userOpenId = user.openId || `local-${user.id}`;
          
          // Atualiza lastSignedIn e garante openId (não bloqueia se falhar)
          if (!user.openId || !user.lastSignedIn) {
            try {
              await db.upsertUser({
                id: user.id,
                openId: userOpenId,
                lastSignedIn: new Date(),
              });
              console.log(`[Login] Usuário atualizado com openId: ${userOpenId}`);
            } catch (updateError: any) {
              console.warn(`[Login] Aviso ao atualizar usuário (não crítico): ${updateError?.message || updateError}`);
              // Não bloqueia o login se falhar
            }
          }
          
          // Cria sessão JWT
          let sessionToken: string;
          try {
            sessionToken = await sdk.signSession({
              openId: userOpenId,
              appId: process.env.VITE_APP_ID || "local-app",
              name: user.name || "Usuário",
            });
            console.log(`[Login] Sessão JWT criada com sucesso`);
          } catch (sessionError: any) {
            console.error(`[Login] Erro ao criar sessão JWT: ${sessionError?.message || sessionError}`);
            console.error(`[Login] Stack trace:`, sessionError?.stack);
            // Cria uma sessão local se falhar (não bloqueia acesso)
            console.warn(`[Login] ⚠️  Erro ao criar sessão JWT, usando sessão local`);
            sessionToken = `local-session-${user.id}-${Date.now()}`;
          }
          
          // Define o cookie com flags de segurança
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { 
            ...cookieOptions, 
            maxAge: ONE_YEAR_MS,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" // Mudado de "strict" para "lax" para melhor compatibilidade
          });
          
          // FORÇA resposta ABSOLUTAMENTE SIMPLES - apenas primitivos JSON
          const userId = typeof user.id === 'number' ? user.id : parseInt(String(user.id || '0'), 10);
          const userName = user.name ? String(user.name).substring(0, 255) : "";
          const userEmail = user.email ? String(user.email).substring(0, 320) : "";
          const userRole = user.role ? String(user.role) : "user";
          const userEmpresaId = (user.empresaId !== null && user.empresaId !== undefined) 
            ? (typeof user.empresaId === 'number' ? user.empresaId : parseInt(String(user.empresaId), 10))
            : null;
          
          // Cria objeto literal simples
          const responseData: {
            success: boolean;
            user: {
              id: number;
              name: string;
              email: string;
              role: string;
              empresaId: number | null;
            };
          } = {
            success: true,
            user: {
              id: userId,
              name: userName,
              email: userEmail,
              role: userRole,
              empresaId: userEmpresaId,
            },
          };
          
          // Validação EXTREMA de serialização
          try {
            const testJson = JSON.stringify(responseData);
            const parsed = JSON.parse(testJson);
            if (!parsed.success || !parsed.user || typeof parsed.user.id !== 'number') {
              throw new Error("Resposta inválida após serialização");
            }
            console.log(`[Login] ✅ Resposta validada:`, testJson.substring(0, 200));
          } catch (serializeError: any) {
            console.error(`[Login] ❌ ERRO FATAL ao serializar:`, serializeError);
            // Retorna resposta mínima absoluta
            return JSON.parse(JSON.stringify({
              success: true,
              user: {
                id: userId,
                name: "",
                email: "",
                role: "user",
                empresaId: null,
              },
            }));
          }
          
          // Retorna objeto simples - tRPC serializa naturalmente
          // Garantir que é um objeto plano sem métodos ou propriedades não enumeráveis
          const finalResponse = {
            success: true,
            user: {
              id: responseData.user.id,
              name: responseData.user.name,
              email: responseData.user.email,
              role: responseData.user.role,
              empresaId: responseData.user.empresaId,
            },
          };
          
          console.log(`[Login] ✅ Retornando resposta final para usuário ID=${userId}, Role=${userRole}`);
          return finalResponse;
        } catch (error: any) {
          console.error("[Login] ❌ ERRO NO LOGIN:", error);
          console.error("[Login] Tipo do erro:", typeof error);
          console.error("[Login] Mensagem:", error?.message);
          console.error("[Login] Stack:", error?.stack);
          console.error("[Login] Erro completo (JSON):", JSON.stringify(error, Object.getOwnPropertyNames(error)));
          
          // Retorna erro serializável - garantir que seja uma string simples
          let errorMessage = "Erro ao fazer login. Tente novamente.";
          if (error?.message) {
            errorMessage = String(error.message).substring(0, 200); // Limitar tamanho
          }
          
          // Log antes de lançar o erro
          console.error(`[Login] Lançando erro: ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Log de auditoria (não bloqueia se falhar)
      if (ctx.user) {
        try {
          await logAudit({
            userId: ctx.user.id,
            action: AuditActions.LOGOUT,
            resource: "auth",
            details: {},
            ip: ctx.req.ip || ctx.req.socket.remoteAddress,
            userAgent: ctx.req.headers["user-agent"],
            timestamp: new Date()
          });
        } catch (auditError) {
          console.warn("[Logout] Erro ao registrar auditoria (não crítico):", auditError);
          // Não bloqueia logout se falhar
        }
      }
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      };
    }),
  }),

  // Dashboard
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({
        empresaId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Sempre usar tenantId do usuário (exceto admin/super_admin)
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos os tenants
          : (ctx.user.tenantId || null);
        
        // Se o usuário não for admin, usar empresaId do contexto
        const empresaId = ctx.user.role === "admin" || ctx.user.role === "super_admin"
          ? (input?.empresaId || undefined)
          : (ctx.user.empresaId || undefined);
        
        return db.getDashboardStats(tenantId, empresaId);
      }),
  }),

  // Permissões
  permissoes: router({
    list: adminProcedure.query(async () => {
      return db.getAllPermissoes();
    }),
    getUserPermissions: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserPermissionsWithDetails(input.userId);
      }),
    assignPermissions: adminProcedure
      .input(z.object({
        userId: z.number(),
        permissaoIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await db.assignPermissionsToUser(input.userId, input.permissaoIds);
        return { success: true };
      }),
  }),

  // Usuários do Sistema
  usuarios: router({
    list: adminProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        role: z.enum(["user", "admin", "gestor", "tecnico"]).optional(),
        empresaId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllUsers(input);
      }),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email().optional().or(z.literal("")),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        role: z.enum(["user", "admin", "gestor", "tecnico"]),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Valida força da senha
        const passwordValidation = validatePasswordStrength(input.password);
        if (!passwordValidation.valid) {
          throw new Error(`Senha fraca: ${passwordValidation.errors.join(", ")}`);
        }
        
        // ISOLAMENTO DE TENANT: Garante que novos usuários sejam vinculados ao tenant correto
        // Super admins podem criar usuários sem tenant (para si mesmos)
        // Outros admins só podem criar usuários no seu próprio tenant
        let tenantIdToUse: number | null = null;
        if (ctx.user.role === "super_admin") {
          // Super admin pode criar usuários sem tenant (para si mesmos) ou especificar um tenant
          // Por padrão, super admins não têm tenant
          tenantIdToUse = null;
        } else {
          // Todos os outros usuários devem ter tenantId
          if (!ctx.user.tenantId) {
            throw new Error("Não é possível criar usuários sem sistema associado.");
          }
          tenantIdToUse = ctx.user.tenantId;
        }
        
        // Sanitiza inputs
        const sanitizedInput = {
          name: sanitizeInput(input.name),
          email: input.email ? sanitizeInput(input.email) : undefined,
          cpf: input.cpf ? sanitizeInput(input.cpf) : undefined,
          cnpj: input.cnpj ? sanitizeInput(input.cnpj) : undefined,
          password: input.password,
          role: input.role,
          empresaId: input.empresaId || undefined,
        };
        
        const newUser = await db.createUser({
          name: sanitizedInput.name,
          email: sanitizedInput.email,
          cpf: sanitizedInput.cpf,
          cnpj: sanitizedInput.cnpj,
          passwordHash: await bcrypt.hash(sanitizedInput.password, 10),
          role: sanitizedInput.role,
          empresaId: sanitizedInput.empresaId || null,
          tenantId: tenantIdToUse, // VINCULA AO TENANT CORRETO
          openId: `local-${Date.now()}`,
        });
        
        // Log de auditoria
        await logAudit({
          userId: ctx.user.id,
          action: AuditActions.USER_CREATE,
          resource: "users",
          resourceId: newUser.id,
          details: { createdUserId: newUser.id, role: sanitizedInput.role },
          ip: ctx.req.ip || ctx.req.socket.remoteAddress,
          userAgent: ctx.req.headers["user-agent"],
          timestamp: new Date()
        });
        
        return newUser;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        password: z.string().min(6).optional(),
        role: z.enum(["user", "admin", "gestor", "tecnico"]).optional(),
        empresaId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...rest } = input;
        
        // Se está alterando senha, valida força
        if (input.password) {
          const passwordValidation = validatePasswordStrength(input.password);
          if (!passwordValidation.valid) {
            throw new Error(`Senha fraca: ${passwordValidation.errors.join(", ")}`);
          }
        }
        
        // Sanitiza inputs
        const sanitizedData: any = {};
        if (rest.name) sanitizedData.name = sanitizeInput(rest.name);
        if (rest.email !== undefined) sanitizedData.email = rest.email ? sanitizeInput(rest.email) : undefined;
        if (rest.cpf !== undefined) sanitizedData.cpf = rest.cpf ? sanitizeInput(rest.cpf) : undefined;
        if (rest.cnpj !== undefined) sanitizedData.cnpj = rest.cnpj ? sanitizeInput(rest.cnpj) : undefined;
        if (rest.role) sanitizedData.role = rest.role;
        if (rest.empresaId !== undefined) sanitizedData.empresaId = rest.empresaId;
        
        if (input.password) {
          sanitizedData.passwordHash = await bcrypt.hash(input.password, 10);
        }
        
        const updatedUser = await db.updateUser(id, sanitizedData);
        
        // Log de auditoria
        await logAudit({
          userId: ctx.user.id,
          action: input.password ? AuditActions.PASSWORD_CHANGE : AuditActions.USER_UPDATE,
          resource: "users",
          resourceId: id,
          details: { updatedFields: Object.keys(sanitizedData) },
          ip: ctx.req.ip || ctx.req.socket.remoteAddress,
          userAgent: ctx.req.headers["user-agent"],
          timestamp: new Date()
        });
        
        return updatedUser;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Log de auditoria antes de deletar
        await logAudit({
          userId: ctx.user.id,
          action: AuditActions.USER_DELETE,
          resource: "users",
          resourceId: input.id,
          details: { deletedUserId: input.id },
          ip: ctx.req.ip || ctx.req.socket.remoteAddress,
          userAgent: ctx.req.headers["user-agent"],
          timestamp: new Date()
        });
        
        return db.deleteUser(input.id);
      }),
  }),

  // Empresas
  empresas: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Passa tenantId do usuário para filtrar dados
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getAllEmpresas(input, tenantId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Passa tenantId do usuário para validar acesso
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        const empresa = await db.getEmpresaById(input.id, tenantId);
        if (!empresa) {
          throw new Error("Empresa não encontrada ou você não tem permissão para acessá-la.");
        }
        return empresa;
      }),
    create: protectedProcedure
      .input(z.object({
        razaoSocial: z.string(),
        cnpj: z.string(),
        grauRisco: z.string().optional(),
        cnae: z.string().optional(),
        descricaoAtividade: z.string().optional(),
        responsavelTecnico: z.string().optional(),
        emailContato: z.union([z.string().email(), z.literal('')]).optional(),
        tipoLogradouro: z.string().optional(),
        nomeLogradouro: z.string().optional(),
        numeroEndereco: z.string().optional(),
        complementoEndereco: z.string().optional(),
        bairroEndereco: z.union([z.string(), z.literal("")]).optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cep: z.string().optional(),
        status: z.enum(["ativa", "inativa"]).default("ativa"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          console.log("[empresas.create] 🏢 Iniciando criação de empresa");
          console.log("[empresas.create] User role:", ctx.user.role);
          console.log("[empresas.create] User tenantId:", ctx.user.tenantId);
          
          // ISOLAMENTO DE TENANT: Vincula empresa ao tenant do usuário
          if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && !ctx.user.tenantId) {
            throw new Error("Não é possível criar empresa sem sistema associado.");
          }
          
          // ISOLAMENTO DE TENANT: Determinar tenantId correto
          // Admin/super_admin podem criar sem tenantId (null), mas clientes precisam ter tenantId
          let tenantId: number | null = null;
          if (ctx.user.role === "admin" || ctx.user.role === "super_admin") {
            // Admin pode criar empresas sem tenantId (para si mesmo) ou especificar um
            tenantId = null; // Admin pode ver todos
          } else {
            // Clientes devem ter tenantId
            if (!ctx.user.tenantId) {
              throw new Error("Não é possível criar empresa sem sistema associado.");
            }
            tenantId = ctx.user.tenantId;
          }
          
          console.log("[empresas.create] tenantId determinado:", tenantId);
          
          // VERIFICAÇÃO DE LIMITE DO PLANO
          if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && tenantId && ctx.planLimits) {
            const empresasExistentes = await db.getAllEmpresas(undefined, tenantId);
            const quantidadeAtual = empresasExistentes?.length || 0;
            
            console.log("[empresas.create] Empresas existentes:", quantidadeAtual, "Limite:", ctx.planLimits.maxEmpresas);
            
            if (!checkQuantityLimit(quantidadeAtual, ctx.planLimits.maxEmpresas)) {
              throw new Error(getLimitMessage('empresas', quantidadeAtual, ctx.planLimits.maxEmpresas));
            }
          }
          
          // Garantir que tenantId está presente (exceto para admin)
          if (tenantId === null && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
            throw new Error("tenantId é obrigatório para criar empresa");
          }
          
          console.log("[empresas.create] Criando empresa com dados:", { ...input, tenantId: tenantId || undefined });
          
          const empresaCriada = await db.createEmpresa({ ...input, tenantId: tenantId! });
          
          if (!empresaCriada) {
            throw new Error("Erro ao criar empresa. Tente novamente.");
          }
          
          console.log("[empresas.create] ✅ Empresa criada com sucesso:", empresaCriada.id);
          
          // Garantir serialização correta - converter todos os Date para string
          const empresaSerializada = serializeDates(empresaCriada);
          
          return empresaSerializada;
        } catch (error: any) {
          console.error("[empresas.create] ❌ Erro:", error.message);
          console.error("[empresas.create] Stack:", error?.stack);
          
          // Se a mensagem já é "Você chegou no limite", retornar exatamente assim
          const errorMessage = error.message || "Erro ao cadastrar empresa. Tente novamente.";
          
          // Garantir que a mensagem seja uma string simples e serializável
          throw new Error(String(errorMessage));
        }
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        razaoSocial: z.string().optional(),
        cnpj: z.string().optional(),
        grauRisco: z.string().optional(),
        cnae: z.string().optional(),
        descricaoAtividade: z.string().optional(),
        responsavelTecnico: z.string().optional(),
        emailContato: z.union([z.string().email(), z.literal('')]).optional(),
        tipoLogradouro: z.string().optional(),
        nomeLogradouro: z.string().optional(),
        numeroEndereco: z.string().optional(),
        complementoEndereco: z.string().optional(),
        bairroEndereco: z.union([z.string(), z.literal("")]).optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cep: z.string().optional(),
        status: z.enum(["ativa", "inativa"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        console.log("📥 Recebendo dados para atualizar:", data);
        console.log("📥 Bairro recebido:", data.bairroEndereco);
        return db.updateEmpresa(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Verificar tenant antes de deletar
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.deleteEmpresa(input.id, tenantId);
      }),
    deleteBatch: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        if (input.ids.length === 0) {
          throw new Error("Nenhuma empresa selecionada para exclusão");
        }
        // ISOLAMENTO DE TENANT: Verificar tenant antes de deletar
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        const results = await Promise.all(
          input.ids.map(id => db.deleteEmpresa(id, tenantId))
        );
        return {
          success: true,
          deletedCount: results.filter(r => r.success).length,
          totalRequested: input.ids.length,
        };
      }),
  }),

  // Colaboradores
  colaboradores: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        dataAdmissaoInicio: z.string().optional(),
        dataAdmissaoFim: z.string().optional(),
        empresaId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // ISOLAMENTO DE TENANT: Filtrar colaboradores apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        // Se o usuário selecionou uma empresa nos filtros, usar ela; senão usar a empresa do usuário (se não for admin)
        const empresaIdFiltro = input?.empresaId ? input.empresaId : undefined;
        const empresaId = ctx.user.role === "admin" ? empresaIdFiltro : (empresaIdFiltro || ctx.user.empresaId || undefined);
        return db.getAllColaboradores(tenantId, empresaId, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Filtrar colaborador apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getColaboradorById(input.id, tenantId);
      }),
    getComCargoESetor: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getColaboradorComCargoESetor(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeCompleto: z.string(),
        cargoId: z.number().optional(),
        setorId: z.number().optional(),
        empresaId: z.number(),
        obraId: z.number().optional(),
        dataAdmissao: z.string().optional(),
        dataPrimeiroAso: z.string().optional(),
        validadeAso: z.string().optional(),
        dataNascimento: z.string().optional(),
        cidadeNascimento: z.string().optional(),
        estadoNascimento: z.string().optional(),
        rg: z.string().optional(),
        cpf: z.string().optional(),
        pis: z.string().optional(),
        tipoLogradouro: z.string().optional(),
        nomeLogradouro: z.string().optional(),
        numeroEndereco: z.string().optional(),
        complementoEndereco: z.string().optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cep: z.string().optional(),
        fotoUrl: z.string().optional(),
        telefonePrincipal: z.string().optional(),
        telefoneRecado: z.string().optional(),
        nomePessoaRecado: z.string().optional(),
        grauParentesco: z.string().optional(),
        observacoes: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).default("ativo"),
      }))
      .mutation(async ({ input: formInput, ctx }) => {
        // VERIFICAÇÃO DE LIMITE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          // Limite de colaboradores é POR EMPRESA
          if (formInput.empresaId && ctx.planLimits.maxColaboradores > 0) {
            const colaboradoresExistentes = await db.getAllColaboradores(ctx.user.tenantId, formInput.empresaId);
            const quantidadeAtual = colaboradoresExistentes?.length || 0;
            
            if (!checkQuantityLimit(quantidadeAtual, ctx.planLimits.maxColaboradores)) {
              throw new Error(getLimitMessage('colaboradores', quantidadeAtual, ctx.planLimits.maxColaboradores, true));
            }
          }
        }
        
        // ISOLAMENTO DE TENANT: Determinar tenantId correto
        let tenantId: number | null = null;
        if (ctx.user.role === "admin" || ctx.user.role === "super_admin") {
          // Admin pode criar colaboradores sem tenantId (para si mesmo) ou especificar um
          tenantId = null; // Admin pode ver todos
        } else {
          // Clientes devem ter tenantId
          if (!ctx.user.tenantId) {
            throw new Error("Não é possível criar colaborador sem sistema associado.");
          }
          tenantId = ctx.user.tenantId;
        }
        
        console.log("[colaboradores.create] 🧑 Criando colaborador com tenantId:", tenantId);
        
        const data = {
          ...formInput,
          tenantId: tenantId!, // Garantir que tenantId está presente
          dataAdmissao: formInput.dataAdmissao ? new Date(formInput.dataAdmissao) : undefined,
          dataPrimeiroAso: formInput.dataPrimeiroAso ? new Date(formInput.dataPrimeiroAso) : undefined,
          validadeAso: formInput.validadeAso ? new Date(formInput.validadeAso) : undefined,
          dataNascimento: formInput.dataNascimento ? new Date(formInput.dataNascimento) : undefined,
        };
        
        const colaboradorCriado = await db.createColaborador(data);
        
        if (!colaboradorCriado) {
          throw new Error("Erro ao criar colaborador. Tente novamente.");
        }
        
        console.log("[colaboradores.create] ✅ Colaborador criado com sucesso:", colaboradorCriado.id);
        
        // Garantir serialização correta - converter todos os Date para string
        const colaboradorSerializado = serializeDates(colaboradorCriado);
        
        return colaboradorSerializado;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        cargoId: z.number().optional(),
        setorId: z.number().optional(),
        empresaId: z.number().optional(),
        obraId: z.number().optional(),
        dataAdmissao: z.string().optional(),
        dataPrimeiroAso: z.string().optional(),
        validadeAso: z.string().optional(),
        dataNascimento: z.string().optional(),
        cidadeNascimento: z.string().optional(),
        estadoNascimento: z.string().optional(),
        rg: z.string().optional(),
        cpf: z.string().optional(),
        pis: z.string().optional(),
        tipoLogradouro: z.string().optional(),
        nomeLogradouro: z.string().optional(),
        numeroEndereco: z.string().optional(),
        complementoEndereco: z.string().optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cep: z.string().optional(),
        fotoUrl: z.string().optional(),
        telefonePrincipal: z.string().optional(),
        telefoneRecado: z.string().optional(),
        nomePessoaRecado: z.string().optional(),
        grauParentesco: z.string().optional(),
        observacoes: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      }))
      .mutation(async ({ input: formInput }) => {
        const { id, ...rest } = formInput;
        const data = {
          ...rest,
          dataAdmissao: rest.dataAdmissao ? new Date(rest.dataAdmissao) : undefined,
          dataPrimeiroAso: rest.dataPrimeiroAso ? new Date(rest.dataPrimeiroAso) : undefined,
          validadeAso: rest.validadeAso ? new Date(rest.validadeAso) : undefined,
          dataNascimento: rest.dataNascimento ? new Date(rest.dataNascimento) : undefined,
        };
        // ISOLAMENTO DE TENANT: Verificar tenant antes de atualizar
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.updateColaborador(id, data, tenantId);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteColaborador(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteColaboradores(input.ids);
      }),
    stats: protectedProcedure
      .input(z.object({
        empresaId: z.number().optional(),
        status: z.enum(['ativo', 'inativo']).optional(),
        setorId: z.number().optional(),
        cargoId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        console.log("═══════════════════════════════════════");
        console.log("[colaboradores.stats] 🚀 QUERY INICIADA");
        console.log("[colaboradores.stats] Input recebido:", JSON.stringify(input, null, 2));
        console.log("[colaboradores.stats] User role:", ctx.user.role);
        console.log("[colaboradores.stats] User empresaId:", ctx.user.empresaId);
        
        // ISOLAMENTO DE TENANT: Sempre usar tenantId do usuário (exceto admin/super_admin)
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos os tenants
          : (ctx.user.tenantId || null);
        
        // Determinar empresaId a ser usado
        let empresaId: number | undefined;
        
        if (ctx.user.role === 'admin' || ctx.user.role === 'super_admin' || ctx.user.role === 'tenant_admin') {
          // Admin/Tenant Admin pode usar empresaId do input ou ver todas
          // Tratar null como undefined
          empresaId = input?.empresaId !== null && input?.empresaId !== undefined ? input.empresaId : undefined;
          console.log("[colaboradores.stats] ✅ Admin/Tenant Admin - usando empresaId:", empresaId);
        } else {
          // Não-admin só vê sua própria empresa (ignora input.empresaId)
          empresaId = ctx.user.empresaId || undefined;
          console.log("[colaboradores.stats] ⚠️ Não-admin - usando empresaId do contexto:", empresaId);
        }
        
        // Criar filtros
        const filters = input && (
          input.status !== undefined ||
          input.setorId !== undefined ||
          input.cargoId !== undefined
        ) ? {
          status: input.status,
          setorId: input.setorId,
          cargoId: input.cargoId,
        } : undefined;
        
        console.log("[colaboradores.stats] 📊 Chamando getColaboradorStats com tenantId:", tenantId, "empresaId:", empresaId);
        const result = await db.getColaboradorStats(tenantId, empresaId, filters);
        console.log("[colaboradores.stats] ✅ RESULTADO:", {
          total: result?.total,
          ativos: result?.ativos,
          inativos: result?.inativos
        });
        console.log("═══════════════════════════════════════");
        
        return result;
      }),
  }),

  // Obras
  obras: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      // ISOLAMENTO DE TENANT: Filtrar obras apenas do tenant do usuário
      const tenantId = ctx.user.role === "super_admin" ? null : (ctx.user.tenantId || null);
      return db.getAllObras(tenantId, empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Filtrar obra apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getObraById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeObra: z.string(),
        cnpj: z.string().optional(),
        cno: z.string().optional(),
        cnae: z.string().optional(),
        descricaoAtividade: z.string().optional(),
        grauRisco: z.string().optional(),
        quantidadePrevistoColaboradores: z.number().optional(),
        tipoLogradouro: z.string().optional(),
        nomeLogradouro: z.string().optional(),
        numeroEndereco: z.string().optional(),
        complementoEndereco: z.string().optional(),
        bairroEndereco: z.union([z.string(), z.literal("")]).optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cepEndereco: z.string().optional(),
        endereco: z.string().optional(),
        empresaId: z.number(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        status: z.enum(["ativa", "concluida"]).default("ativa"),
      }))
      .mutation(async ({ input, ctx }) => {
        // VERIFICAÇÃO DE LIMITE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          // Busca todas as obras do tenant através das empresas
          const empresasDoTenant = await db.getAllEmpresas(undefined, ctx.user.tenantId);
          const empresaIds = empresasDoTenant?.map(e => e.id) || [];
          
          let totalObras = 0;
          for (const empresaId of empresaIds) {
            const obras = await db.getAllObras(ctx.user.tenantId, empresaId);
            totalObras += obras?.length || 0;
          }
          
          if (!checkQuantityLimit(totalObras, ctx.planLimits.maxObras)) {
            throw new Error(getLimitMessage('obras', totalObras, ctx.planLimits.maxObras));
          }
        }
        
        // ISOLAMENTO DE TENANT: Vincula obra ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar obra sem sistema associado.");
        }
        
        const data = {
          ...input,
          tenantId: tenantId,
          dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
        };
        return db.createObra(data);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeObra: z.string().optional(),
        cnpj: z.string().optional(),
        cno: z.string().optional(),
        cnae: z.string().optional(),
        descricaoAtividade: z.string().optional(),
        grauRisco: z.string().optional(),
        quantidadePrevistoColaboradores: z.number().optional(),
        tipoLogradouro: z.string().optional(),
        nomeLogradouro: z.string().optional(),
        numeroEndereco: z.string().optional(),
        complementoEndereco: z.string().optional(),
        bairroEndereco: z.union([z.string(), z.literal("")]).optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cepEndereco: z.string().optional(),
        endereco: z.string().optional(),
        empresaId: z.number().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        status: z.enum(["ativa", "concluida"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data = {
          ...rest,
          dataInicio: rest.dataInicio ? new Date(rest.dataInicio) : undefined,
          dataFim: rest.dataFim ? new Date(rest.dataFim) : undefined,
        };
        // ISOLAMENTO DE TENANT: Verificar tenant antes de atualizar
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.updateObra(id, data, tenantId);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteObra(input.id);
      }),
    deleteBatch: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        if (input.ids.length === 0) {
          throw new Error("Nenhuma obra selecionada para exclusão");
        }
        const results = await Promise.all(
          input.ids.map(id => db.deleteObra(id))
        );
        return {
          success: true,
          deletedCount: results.filter(r => r.success).length,
          totalRequested: input.ids.length,
        };
      }),
  }),

  // Treinamentos
  treinamentos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      // ISOLAMENTO DE TENANT: Filtrar treinamentos apenas do tenant do usuário
      const tenantId = ctx.user.role === "super_admin" ? null : (ctx.user.tenantId || null);
      return db.getAllTreinamentos(tenantId, empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Filtrar treinamento apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getTreinamentoById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeTreinamento: z.string(),
        tipoNr: z.string().optional(),
        colaboradorId: z.number(),
        empresaId: z.number(),
        dataRealizacao: z.string().optional(),
        dataValidade: z.string().optional(),
        status: z.enum(["valido", "vencido", "a_vencer"]).default("valido"),
      }))
      .mutation(async ({ input, ctx }) => {
        // VERIFICAÇÃO DE LIMITE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          // Busca todos os treinamentos do tenant através das empresas
          const empresasDoTenant = await db.getAllEmpresas(undefined, ctx.user.tenantId);
          const empresaIds = empresasDoTenant?.map(e => e.id) || [];
          
          let totalTreinamentos = 0;
          for (const empresaId of empresaIds) {
            const treinamentos = await db.getAllTreinamentos(ctx.user.tenantId, empresaId);
            totalTreinamentos += treinamentos?.length || 0;
          }
          
          if (!checkQuantityLimit(totalTreinamentos, ctx.planLimits.maxTreinamentos)) {
            throw new Error(getLimitMessage('treinamentos', totalTreinamentos, ctx.planLimits.maxTreinamentos));
          }
        }
        
        // ISOLAMENTO DE TENANT: Vincula treinamento ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar treinamento sem sistema associado.");
        }
        
        const data = {
          ...input,
          tenantId: tenantId,
          dataRealizacao: input.dataRealizacao ? new Date(input.dataRealizacao) : undefined,
          dataValidade: input.dataValidade ? new Date(input.dataValidade) : undefined,
        };
        return db.createTreinamento(data);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeTreinamento: z.string().optional(),
        tipoNr: z.string().optional(),
        colaboradorId: z.number().optional(),
        empresaId: z.number().optional(),
        dataRealizacao: z.string().optional(),
        dataValidade: z.string().optional(),
        status: z.enum(["valido", "vencido", "a_vencer"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data = {
          ...rest,
          dataRealizacao: rest.dataRealizacao ? new Date(rest.dataRealizacao) : undefined,
          dataValidade: rest.dataValidade ? new Date(rest.dataValidade) : undefined,
        };
        return db.updateTreinamento(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteTreinamento(input.id);
      }),
  }),

  // EPIs
  epis: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      // ISOLAMENTO DE TENANT: Filtrar EPIs apenas do tenant do usuário
      const tenantId = ctx.user.role === "super_admin" ? null : (ctx.user.tenantId || null);
      return db.getAllEpis(tenantId, empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Filtrar EPI apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getEpiById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeEquipamento: z.string(),
        colaboradorId: z.number(),
        empresaId: z.number(),
        dataEntrega: z.string().optional(),
        dataValidade: z.string().optional(),
        status: z.enum(["em_uso", "vencido", "devolvido"]).default("em_uso"),
      }))
      .mutation(async ({ input, ctx }) => {
        // VERIFICAÇÃO DE LIMITE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          // Busca todos os EPIs do tenant através das empresas
          const empresasDoTenant = await db.getAllEmpresas(undefined, ctx.user.tenantId);
          const empresaIds = empresasDoTenant?.map(e => e.id) || [];
          
          let totalEpis = 0;
          for (const empresaId of empresaIds) {
            const epis = await db.getAllEpis(ctx.user.tenantId, empresaId);
            totalEpis += epis?.length || 0;
          }
          
          if (!checkQuantityLimit(totalEpis, ctx.planLimits.maxEpis)) {
            throw new Error(getLimitMessage('epis', totalEpis, ctx.planLimits.maxEpis));
          }
        }
        
        // ISOLAMENTO DE TENANT: Vincula EPI ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar EPI sem sistema associado.");
        }
        
        const data = {
          ...input,
          tenantId: tenantId,
          dataEntrega: input.dataEntrega ? new Date(input.dataEntrega) : undefined,
          dataValidade: input.dataValidade ? new Date(input.dataValidade) : undefined,
        };
        return db.createEpi(data);
      }),
    createMultiple: protectedProcedure
      .input(z.object({
        epis: z.array(z.object({
          nomeEquipamento: z.string(),
          tipoEpiId: z.number().optional(),
          colaboradorId: z.number(),
          empresaId: z.number(),
          dataEntrega: z.string().optional(),
          quantidade: z.number().optional().default(1),
          caNumero: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        return db.createMultipleEpis(input.epis);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeEquipamento: z.string().optional(),
        tipoEpiId: z.number().optional(),
        colaboradorId: z.number().optional(),
        empresaId: z.number().optional(),
        dataEntrega: z.string().optional(),
        quantidade: z.number().optional(),
        caNumero: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data = {
          ...rest,
          dataEntrega: rest.dataEntrega ? new Date(rest.dataEntrega) : undefined,
        };
        return db.updateEpi(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteEpi(input.id);
      }),
    getDadosFichaEPI: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        colaboradorId: z.number(),
      }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar dados apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getDadosFichaEPI(input.empresaId, input.colaboradorId, tenantId);
      }),
    generateFichaPDF: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        colaboradorId: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const dados = await db.getDadosFichaEPI(input.empresaId, input.colaboradorId);
          return { dados };
        } catch (error: any) {
          console.error("Erro ao gerar ficha PDF:", error);
          throw new Error(error?.message || "Erro ao buscar dados para gerar PDF");
        }
      }),
    saveFichaPDF: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        colaboradorId: z.number(),
        nomeArquivo: z.string(),
        pdfBase64: z.string(), // PDF em base64
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const fs = await import("fs");
          const path = await import("path");
          
          // Converter base64 para buffer
          const pdfBuffer = Buffer.from(input.pdfBase64, "base64");
          
          // Criar diretório se não existir
          const uploadsDir = path.resolve(process.cwd(), "uploads", "fichas_epi");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Salvar arquivo localmente
          const caminhoArquivo = path.join(uploadsDir, input.nomeArquivo);
          fs.writeFileSync(caminhoArquivo, pdfBuffer);
          
          // Gerar URL relativa para servir o arquivo
          const url = `/uploads/fichas_epi/${input.nomeArquivo}`;
          
          // ISOLAMENTO DE TENANT: Vincula ficha ao tenant do usuário
          // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
          if (!tenantId && ctx.user.role !== "super_admin") {
            throw new Error("Não é possível criar ficha sem sistema associado.");
          }
          
          // Salvar registro da ficha emitida
          const ficha = await db.createFichaEpiEmitida({
            tenantId: tenantId,
            empresaId: input.empresaId,
            colaboradorId: input.colaboradorId,
            nomeArquivo: input.nomeArquivo,
            urlArquivo: url,
            caminhoArquivo: caminhoArquivo,
          });
          
          return { ficha, url };
        } catch (error: any) {
          console.error("Erro ao salvar ficha PDF:", error);
          throw new Error(error?.message || "Erro ao salvar PDF");
        }
      }),
    fichasEmitidas: protectedProcedure
      .query(async ({ ctx }) => {
        const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
        // ISOLAMENTO DE TENANT: Filtrar fichas apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getAllFichasEpiEmitidas(tenantId, empresaId);
      }),
    deleteFichaEmitida: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteFichaEpiEmitida(input.id);
      }),
  }),

  cargos: router({
    list: protectedProcedure
      .input(z.object({ empresaId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        console.log("[Cargos.list] 👤 Usuário:", ctx.user.id, "Role:", ctx.user.role, "TenantId:", ctx.user.tenantId);
        
        let empresaId: number | undefined;

        if (ctx.user.role === "admin" || ctx.user.role === "super_admin") {
          empresaId = input?.empresaId ?? undefined;
          console.log("[Cargos.list] 👑 Admin geral detectado - pode ver todos os cargos");
        } else {
          // tenant_admin pode escolher empresa, mas apenas do seu tenant
          empresaId = input?.empresaId ?? ctx.user.empresaId ?? undefined;
          console.log("[Cargos.list] 🔒 Usuário/tenant_admin - filtrando por empresaId:", empresaId);
        }

        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        console.log("[Cargos.list] 📋 Buscando cargos com tenantId:", tenantId, "empresaId:", empresaId);
        const result = await db.getAllCargos(tenantId, empresaId ?? null);
        console.log("[Cargos.list] ✅ Retornando", result?.length || 0, "cargos");
        return result;
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Filtrar cargo apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        const cargo = await db.getCargoById(input.id, tenantId);
        // ISOLAMENTO DE TENANT: Verificar se o cargo pertence ao tenant do usuário
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
          if (!cargo || cargo.tenantId !== ctx.user.tenantId) {
            throw new Error("Cargo não encontrado ou sem permissão de acesso.");
          }
        }
        return cargo;
      }),
    create: protectedProcedure
      .input(z.object({
        nomeCargo: z.string(),
        descricao: z.string().optional(),
        codigoCbo: z.string().max(20).optional(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // ISOLAMENTO DE TENANT: Vincula cargo ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar cargo sem sistema associado.");
        }
        const empresaId = input.empresaId || ctx.user.empresaId;
        return db.createCargo({ ...input, empresaId, tenantId });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCargo: z.string().optional(),
        descricao: z.string().optional(),
        codigoCbo: z.string().max(20).optional().nullable(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateCargo(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCargo(input.id);
      }),
    deleteBatch: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        if (input.ids.length === 0) {
          throw new Error("Nenhum cargo selecionado para exclusão");
        }
        const results = await Promise.all(
          input.ids.map(id => db.deleteCargo(id))
        );
        return {
          success: true,
          deletedCount: results.filter(r => r.success).length,
          totalRequested: input.ids.length,
        };
      }),
    relatorioPorEmpresa: protectedProcedure
      .input(z.object({ empresaId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        let empresaId: number | null = null;
        if (ctx.user.role === "admin") {
          empresaId = input?.empresaId ?? null;
        } else {
          empresaId = ctx.user.empresaId || null;
        }
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        console.log("[Relatório] tenantId:", tenantId, "user.tenantId:", ctx.user.tenantId, "role:", ctx.user.role);
        return db.getRelatorioCargosPorEmpresa(tenantId, empresaId);
      }),
    relatorioPorSetor: protectedProcedure
      .input(z.object({ empresaId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        let empresaId: number | null = null;
        if (ctx.user.role === "admin") {
          empresaId = input?.empresaId ?? null;
        } else {
          empresaId = ctx.user.empresaId || null;
        }
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getRelatorioCargosPorSetor(tenantId, empresaId);
      }),
    relatorioPorEmpresaESetor: protectedProcedure
      .input(z.object({ empresaId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        let empresaId: number | null = null;
        if (ctx.user.role === "admin") {
          empresaId = input?.empresaId ?? null;
        } else {
          empresaId = ctx.user.empresaId || null;
        }
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getRelatorioCargosPorEmpresaESetor(tenantId, empresaId);
      }),
  }),

  cargosCbo: router({
    list: protectedProcedure
      .input(z.object({ searchTerm: z.string().optional() }).optional())
      .query(async ({ input }) => {
        try {
          // Primeiro tenta buscar do banco local
          const cargosLocal = await db.getAllCargosCbo(input?.searchTerm);
          
          // Se encontrar no banco local, retorna
          if (cargosLocal.length > 0) {
            return cargosLocal;
          }
          
          // Se não encontrar no banco local e tiver termo de busca, tenta na API externa
          if (input?.searchTerm && input.searchTerm.trim().length >= 2) {
            console.log(`[CBO] Nenhum resultado no banco local, tentando API externa para: "${input.searchTerm}"`);
            const cargosApi = await db.buscarCboNaApi(input.searchTerm);
            if (cargosApi.length > 0) {
              return cargosApi;
            }
          }
          
          // Se não encontrou nada, retornar array vazio
          return [];
        } catch (error: any) {
          console.error("[CBO] Erro ao buscar cargos CBO:", error);
          // Em caso de erro, retornar array vazio
          return [];
        }
      }),
    buscarNaApi: protectedProcedure
      .input(z.object({ codigoOuNome: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.buscarCboNaApi(input.codigoOuNome);
      }),
    getByCodigo: protectedProcedure
      .input(z.object({ codigoCbo: z.string() }))
      .query(async ({ input }) => {
        // Primeiro busca no banco local
        const cargoLocal = await db.getCargoCboByCodigo(input.codigoCbo);
        if (cargoLocal) {
          return cargoLocal;
        }
        
        // Se não encontrar, busca na API
        const cargosApi = await db.buscarCboNaApi(input.codigoCbo);
        return cargosApi.find(c => c.codigoCbo === input.codigoCbo) || null;
      }),
  }),

  setores: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        empresaId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        let empresaId: number | undefined;

        if (ctx.user.role === "admin") {
          empresaId = input?.empresaId ?? undefined;
        } else {
          empresaId = ctx.user.empresaId || undefined;
        }

        // ISOLAMENTO DE TENANT: Filtrar setores apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getAllSetores(tenantId, input, empresaId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Filtrar setor apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        const setor = await db.getSetorById(input.id, tenantId);
        // ISOLAMENTO DE TENANT: Verificar se o setor pertence ao tenant do usuário
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
          if (!setor || setor.tenantId !== ctx.user.tenantId) {
            throw new Error("Setor não encontrado ou sem permissão de acesso.");
          }
        }
        return setor;
      }),
    create: protectedProcedure
      .input(z.object({
        nomeSetor: z.string(),
        descricao: z.string().optional(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // ISOLAMENTO DE TENANT: Vincula setor ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar setor sem sistema associado.");
        }
        const empresaId = input.empresaId || ctx.user.empresaId;
        return db.createSetor({ ...input, empresaId, tenantId });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeSetor: z.string().optional(),
        descricao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateSetor(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteSetor(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteSetores(input.ids);
      }),
  }),

  cargoTreinamentos: router({
    getByCargo: protectedProcedure
      .input(z.object({ cargoId: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar treinamentos apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getTreinamentosByCargo(input.cargoId, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        cargoId: z.number(),
        tipoTreinamentoId: z.number(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        return db.createCargoTreinamento({ ...input, empresaId });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCargoTreinamento(input.id);
      }),
  }),

  cargoSetores: router({
    getByCargo: protectedProcedure
      .input(z.object({ cargoId: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar setores apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getSetoresByCargo(input.cargoId, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        cargoId: z.number(),
        setorId: z.number(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        return db.createCargoSetor({ ...input, empresaId });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCargoSetor(input.id);
      }),
  }),

  riscosOcupacionais: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
        // ISOLAMENTO DE TENANT: Filtrar riscos apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getAllRiscosOcupacionais(tenantId, empresaId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar risco apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getRiscoOcupacionalById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeRisco: z.string(),
        descricao: z.string().optional(),
        tipoRisco: z.enum(["fisico", "quimico", "biologico", "ergonomico", "mecanico"]),
        codigo: z.string().optional(),
        empresaId: z.number().optional(),
        status: z.enum(["ativo", "inativo"]).default("ativo"),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        const dataToInsert: any = {
          nomeRisco: input.nomeRisco,
          tipoRisco: input.tipoRisco,
          status: input.status || "ativo",
        };
        // Adicionar apenas campos que têm valor definido e não vazio
        if (input.descricao && typeof input.descricao === 'string' && input.descricao.trim() !== "") {
          dataToInsert.descricao = input.descricao.trim();
        }
        if (input.codigo && typeof input.codigo === 'string' && input.codigo.trim() !== "") {
          dataToInsert.codigo = input.codigo.trim();
        }
        if (empresaId && typeof empresaId === 'number') {
          dataToInsert.empresaId = empresaId;
        }
        // ISOLAMENTO DE TENANT: Vincula risco ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar risco sem sistema associado.");
        }
        dataToInsert.tenantId = tenantId;
        
        return db.createRiscoOcupacional(dataToInsert);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeRisco: z.string().optional(),
        descricao: z.string().optional(),
        tipoRisco: z.enum(["fisico", "quimico", "biologico", "ergonomico", "mecanico"]).optional(),
        codigo: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        return db.updateRiscoOcupacional(id, rest);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteRiscoOcupacional(input.id);
      }),
  }),

  cargoRiscos: router({
    getByCargo: protectedProcedure
      .input(z.object({ cargoId: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar riscos apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getRiscosByCargo(input.cargoId, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        cargoId: z.number(),
        riscoOcupacionalId: z.number(),
        tipoAgente: z.string().optional(),
        descricaoRiscos: z.string().optional(),
        fonteGeradora: z.string().optional(),
        tipo: z.string().optional(),
        meioPropagacao: z.string().optional(),
        meioContato: z.string().optional(),
        possiveisDanosSaude: z.string().optional(),
        tipoAnalise: z.string().optional(),
        valorAnaliseQuantitativa: z.string().optional(),
        gradacaoEfeitos: z.string().optional(),
        gradacaoExposicao: z.string().optional(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log("[CargoRiscos.create] Recebido input:", JSON.stringify(input, null, 2));
          console.log("[CargoRiscos.create] ctx.user.id:", ctx.user?.id);
          console.log("[CargoRiscos.create] ctx.user.empresaId:", ctx.user?.empresaId);
          console.log("[CargoRiscos.create] ctx.user.tenantId:", (ctx.user as any)?.tenantId);
          
          // Validações
          if (!input.cargoId || input.cargoId <= 0) {
            const errorMsg = `CargoId é obrigatório e deve ser maior que zero. Recebido: ${input.cargoId}`;
            console.error(`[CargoRiscos.create] ${errorMsg}`);
            throw new Error(errorMsg);
          }
          if (!input.riscoOcupacionalId || input.riscoOcupacionalId <= 0) {
            const errorMsg = `RiscoOcupacionalId é obrigatório e deve ser maior que zero. Recebido: ${input.riscoOcupacionalId}`;
            console.error(`[CargoRiscos.create] ${errorMsg}`);
            throw new Error(errorMsg);
          }

          // ISOLAMENTO DE TENANT: Vincula risco ao tenant do usuário
          // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
          if (!tenantId && ctx.user.role !== "super_admin") {
            throw new Error("Não é possível criar risco sem sistema associado.");
          }
          
          const empresaId = input.empresaId || ctx.user.empresaId;
          console.log("[CargoRiscos.create] empresaId:", empresaId, "tenantId:", tenantId);
          
          const dataToInsert: any = {
            cargoId: input.cargoId,
            riscoOcupacionalId: input.riscoOcupacionalId,
            tenantId: tenantId,
          };
          
          if (input.tipoAgente && input.tipoAgente.trim()) {
            dataToInsert.tipoAgente = input.tipoAgente.trim();
          }
          if (input.descricaoRiscos && input.descricaoRiscos.trim()) {
            dataToInsert.descricaoRiscos = input.descricaoRiscos.trim();
          }
          if (input.fonteGeradora && input.fonteGeradora.trim()) {
            dataToInsert.fonteGeradora = input.fonteGeradora.trim();
          }
          if (input.tipo && input.tipo.trim()) {
            dataToInsert.tipo = input.tipo.trim();
          }
          if (input.meioPropagacao && input.meioPropagacao.trim()) {
            dataToInsert.meioPropagacao = input.meioPropagacao.trim();
          }
          if (input.meioContato && input.meioContato.trim()) {
            dataToInsert.meioContato = input.meioContato.trim();
          }
          if (input.possiveisDanosSaude && input.possiveisDanosSaude.trim()) {
            dataToInsert.possiveisDanosSaude = input.possiveisDanosSaude.trim();
          }
          if (input.tipoAnalise && input.tipoAnalise.trim()) {
            dataToInsert.tipoAnalise = input.tipoAnalise.trim();
          }
          if (input.valorAnaliseQuantitativa && input.valorAnaliseQuantitativa.trim()) {
            dataToInsert.valorAnaliseQuantitativa = input.valorAnaliseQuantitativa.trim();
          }
          if (input.gradacaoEfeitos && input.gradacaoEfeitos.trim()) {
            dataToInsert.gradacaoEfeitos = input.gradacaoEfeitos.trim();
          }
          if (input.gradacaoExposicao && input.gradacaoExposicao.trim()) {
            dataToInsert.gradacaoExposicao = input.gradacaoExposicao.trim();
          }
          if (empresaId) {
            dataToInsert.empresaId = empresaId;
          }

          console.log("[CargoRiscos.create] Dados para inserir:", JSON.stringify(dataToInsert, null, 2));
          
          await db.createCargoRisco(dataToInsert);
          console.log("[CargoRiscos.create] Risco salvo com sucesso");
          
          // Retornar objeto simples e garantidamente serializável
          return {
            success: true,
            cargoId: Number(input.cargoId),
            riscoOcupacionalId: Number(input.riscoOcupacionalId)
          };
        } catch (error: any) {
          console.error("[CargoRiscos.create] Erro ao salvar risco:", error);
          console.error("[CargoRiscos.create] Input recebido:", JSON.stringify(input, null, 2));
          throw new Error(error.message || "Erro ao salvar risco ocupacional");
        }
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        cargoId: z.number().optional(),
        tipoAgente: z.string().optional(),
        descricaoRiscos: z.string().optional(),
        riscoOcupacionalId: z.number().optional(),
        fonteGeradora: z.string().optional(),
        tipo: z.string().optional(),
        meioPropagacao: z.string().optional(),
        meioContato: z.string().optional(),
        possiveisDanosSaude: z.string().optional(),
        tipoAnalise: z.string().optional(),
        valorAnaliseQuantitativa: z.string().optional(),
        gradacaoEfeitos: z.string().optional(),
        gradacaoExposicao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        return db.updateCargoRisco(id, rest);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCargoRisco(input.id);
      }),
  }),

  tiposTreinamentos: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
        // ISOLAMENTO DE TENANT: Filtrar tipos de treinamentos apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getAllTiposTreinamentos(tenantId, input, empresaId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar tipo de treinamento apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getTipoTreinamentoById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeTreinamento: z.string(),
        descricao: z.string().optional(),
        tipoNr: z.string().optional(),
        validadeEmMeses: z.number().optional(),
        empresaId: z.number().optional(),
        status: z.enum(["ativo", "inativo"]).default("ativo"),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        // ISOLAMENTO DE TENANT: Vincula tipo de treinamento ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar tipo de treinamento sem sistema associado.");
        }
        return db.createTipoTreinamento({ ...input, empresaId, tenantId });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeTreinamento: z.string().optional(),
        descricao: z.string().optional(),
        tipoNr: z.string().optional(),
        validadeEmMeses: z.number().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateTipoTreinamento(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteTipoTreinamento(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteTiposTreinamentos(input.ids);
      }),
  }),

  // Modelos de Certificados
  modelosCertificados: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      // ISOLAMENTO DE TENANT: Filtrar modelos apenas do tenant do usuário
      const tenantId = ctx.user.role === "super_admin" ? null : (ctx.user.tenantId || null);
      return db.getAllModelosCertificados(tenantId, empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar modelo apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getModeloCertificadoById(input.id, tenantId);
      }),
    getPadrao: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      return db.getModeloCertificadoPadrao(empresaId);
    }),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        descricao: z.string().optional(),
        htmlTemplate: z.string().optional(),
        corFundo: z.string().optional(),
        corTexto: z.string().optional(),
        corPrimaria: z.string().optional(),
        orientacao: z.enum(["portrait", "landscape"]).optional(),
        textoCabecalho: z.string().optional(),
        textoRodape: z.string().optional(),
        conteudoProgramatico: z.string().optional(),
        tipoTreinamentoId: z.number().optional(),
        descricaoCertificado: z.string().optional(),
        cargaHoraria: z.string().optional(),
        tipoNr: z.string().optional(),
        datas: z.string().optional(), // JSON array com até 4 datas
        mostrarDataEmissao: z.boolean().optional(),
        mostrarValidade: z.boolean().optional(),
        mostrarNR: z.boolean().optional(),
        mostrarConteudoProgramatico: z.boolean().optional(),
        empresaId: z.number().optional(),
        padrao: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        // ISOLAMENTO DE TENANT: Vincula modelo ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar modelo sem sistema associado.");
        }
        return db.createModeloCertificado({ ...input, empresaId, tenantId });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        htmlTemplate: z.string().optional(),
        corFundo: z.string().optional(),
        corTexto: z.string().optional(),
        corPrimaria: z.string().optional(),
        orientacao: z.enum(["portrait", "landscape"]).optional(),
        textoCabecalho: z.string().optional(),
        textoRodape: z.string().optional(),
        conteudoProgramatico: z.string().optional(),
        tipoTreinamentoId: z.number().optional(),
        descricaoCertificado: z.string().optional(),
        cargaHoraria: z.string().optional(),
        tipoNr: z.string().optional(),
        datas: z.string().optional(), // JSON array com até 4 datas
        mostrarDataEmissao: z.boolean().optional(),
        mostrarValidade: z.boolean().optional(),
        mostrarNR: z.boolean().optional(),
        mostrarConteudoProgramatico: z.boolean().optional(),
        empresaId: z.number().optional(),
        padrao: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const empresaId = data.empresaId || ctx.user.empresaId;
        return db.updateModeloCertificado(id, { ...data, empresaId });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteModeloCertificado(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteManyModelosCertificados(input.ids);
      }),
  }),

  // Responsáveis
  responsaveis: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
      const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
        ? null // Admin pode ver todos
        : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
      
      const empresaId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
        ? undefined 
        : (ctx.user.empresaId || undefined);
      
      console.log("[responsaveis.list] tenantId:", tenantId, "empresaId:", empresaId, "role:", ctx.user.role);
      return db.getAllResponsaveis(tenantId, empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const responsavel = await db.getResponsavelById(input.id);
        // ISOLAMENTO DE TENANT: Verificar se o responsável pertence ao tenant do usuário
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
          if (!responsavel || responsavel.tenantId !== ctx.user.tenantId) {
            throw new Error("Responsável não encontrado ou sem permissão de acesso.");
          }
        }
        return responsavel;
      }),
    create: protectedProcedure
      .input(z.object({
        nomeCompleto: z.string().min(1),
        registroProfissional: z.string().optional().nullable(),
        empresaId: z.number().optional().nullable(),
        status: z.enum(["ativo", "inativo"]).default("ativo"),
      }))
      .mutation(async ({ ctx, input }) => {
        // ISOLAMENTO DE TENANT: Vincula responsável ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar responsável sem sistema associado.");
        }
        
        // Preparar dados para inserção - apenas campos definidos
        const data: InsertResponsavel = {
          nomeCompleto: input.nomeCompleto.trim(),
          status: input.status || "ativo",
          tenantId: tenantId,
        };
        
        // Adicionar campos opcionais apenas se tiverem valor (não vazio)
        if (input.registroProfissional !== undefined && input.registroProfissional !== null && input.registroProfissional.trim() !== "") {
          data.registroProfissional = input.registroProfissional.trim();
        }
        
        // Empresa ID - usar do input ou do contexto do usuário (apenas se existir)
        const empresaId = input.empresaId ?? ctx.user.empresaId;
        if (empresaId !== undefined && empresaId !== null) {
          data.empresaId = empresaId;
        }
        
        return db.createResponsavel(data);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        funcao: z.string().optional(),
        registroProfissional: z.string().optional(),
        empresaId: z.number().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateResponsavel(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteResponsavel(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteManyResponsaveis(input.ids);
      }),
  }),

  certificadosEmitidos: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        colaboradorId: z.number().optional(),
        modeloCertificadoId: z.number().optional(),
        empresaId: z.number().optional(),
        mes: z.string().optional(),
        ano: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
        // ISOLAMENTO DE TENANT: Filtrar certificados apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getAllCertificadosEmitidos(tenantId, empresaId, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Filtrar certificado apenas do tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getCertificadoEmitidoById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        modeloCertificadoId: z.number(),
        colaboradorId: z.number(),
        responsavelId: z.number().optional(),
        nomeColaborador: z.string(),
        rgColaborador: z.string().optional(),
        nomeEmpresa: z.string().optional(),
        cnpjEmpresa: z.string().optional(),
        datasRealizacao: z.string().optional(),
        htmlGerado: z.string(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId ?? ctx.user.empresaId;
        // ISOLAMENTO DE TENANT: Vincula certificado ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar certificado sem sistema associado.");
        }
        return db.createCertificadoEmitido({
          ...input,
          tenantId: tenantId,
          empresaId: empresaId || undefined,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCertificadoEmitido(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteManyCertificadosEmitidos(input.ids);
      }),
  }),

  // Tipos de EPIs
  tiposEpis: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllTiposEpis(input?.searchTerm);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTipoEpiById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        tipoEpi: z.string(),
        caNumero: z.string().optional(),
        fabricante: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createTipoEpi(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tipoEpi: z.string().optional(),
        caNumero: z.string().optional(),
        fabricante: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        return db.updateTipoEpi(id, rest);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteTipoEpi(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteManyTiposEpis(input.ids);
      }),
  }),

  // Ordens de Serviço
  ordensServico: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        prioridade: z.string().optional(),
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // VERIFICAÇÃO DE FUNCIONALIDADE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          if (!checkFeatureAvailable(ctx.planLimits, "permiteOrdemServico")) {
            throw new Error(getFeatureUnavailableMessage("Ordem de Serviço", "Prata"));
          }
        }
        
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        
        const empresaId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? undefined 
          : (ctx.user.empresaId || undefined);
        
        console.log("[ordensServico.list] tenantId:", tenantId, "empresaId:", empresaId, "role:", ctx.user.role);
        return db.getAllOrdensServico(tenantId, empresaId, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // VERIFICAÇÃO DE FUNCIONALIDADE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          if (!checkFeatureAvailable(ctx.planLimits, "permiteOrdemServico")) {
            throw new Error(getFeatureUnavailableMessage("Ordem de Serviço", "Prata"));
          }
        }
        
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getOrdemServicoById(input.id, tenantId);
      }),
    getNextNumero: protectedProcedure
      .query(async () => {
        return db.getNextNumeroOrdem();
      }),
    create: protectedProcedure
      .input(z.object({
        numeroOrdem: z.string(),
        empresaId: z.number(),
        colaboradorId: z.number().optional(),
        obraId: z.number().optional(),
        descricaoServico: z.string(),
        tipoServico: z.string().optional(),
        prioridade: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
        status: z.enum(["aberta", "em_andamento", "concluida", "cancelada"]).default("aberta"),
        dataEmissao: z.string(),
        dataPrevistaConclusao: z.string().optional(),
        dataConclusao: z.string().optional(),
        observacoes: z.string().optional(),
        responsavelEmissao: z.string().optional(),
        valorServico: z.string().optional(),
        tipoRisco: z.string().optional(),
        nrRelacionada: z.string().optional(),
        acaoCorretiva: z.string().optional(),
        modeloId: z.number().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        responsavelId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // VERIFICAÇÃO DE FUNCIONALIDADE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          if (!checkFeatureAvailable(ctx.planLimits, "permiteOrdemServico")) {
            throw new Error(getFeatureUnavailableMessage("Ordem de Serviço", "Prata"));
          }
        }
        
        // VERIFICAÇÃO DE FUNCIONALIDADE DO PLANO
        if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin" && ctx.user.tenantId && ctx.planLimits) {
          if (!checkFeatureAvailable(ctx.planLimits, "permiteOrdemServico")) {
            throw new Error(getFeatureUnavailableMessage("Ordem de Serviço", "Prata"));
          }
        }
        
        return db.createOrdemServico(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        numeroOrdem: z.string().optional(),
        empresaId: z.number().optional(),
        colaboradorId: z.number().optional(),
        obraId: z.number().optional(),
        descricaoServico: z.string().optional(),
        tipoServico: z.string().optional(),
        prioridade: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
        status: z.enum(["aberta", "em_andamento", "concluida", "cancelada"]).optional(),
        dataEmissao: z.string().optional(),
        dataPrevistaConclusao: z.string().optional(),
        dataConclusao: z.string().optional(),
        observacoes: z.string().optional(),
        responsavelEmissao: z.string().optional(),
        valorServico: z.string().optional(),
        tipoRisco: z.string().optional(),
        nrRelacionada: z.string().optional(),
        acaoCorretiva: z.string().optional(),
        modeloId: z.number().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        responsavelId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        return db.updateOrdemServico(id, rest);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteOrdemServico(input.id);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        return db.deleteManyOrdensServico(input.ids);
      }),
  }),

  modelosOrdemServico: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
      const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
        ? null // Admin pode ver todos
        : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
      return db.getAllModelosOrdemServico(tenantId, empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        return db.getModeloOrdemServicoById(input.id, tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        descricao: z.string().optional(),
        htmlTemplate: z.string().optional(),
        medidasPreventivasEPC: z.string().optional(),
        orientacoesSeguranca: z.string().optional(),
        termoResponsabilidade: z.string().optional(),
        empresaId: z.number().optional(),
        padrao: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        // ISOLAMENTO DE TENANT: Vincula modelo ao tenant do usuário
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin pode ver todos
          : (ctx.user.tenantId || null); // Clientes só veem seus próprios dados
        if (!tenantId && ctx.user.role !== "super_admin") {
          throw new Error("Não é possível criar modelo sem sistema associado.");
        }
        return db.createModeloOrdemServico({ ...input, empresaId, tenantId });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        htmlTemplate: z.string().optional(),
        medidasPreventivasEPC: z.string().optional(),
        orientacoesSeguranca: z.string().optional(),
        termoResponsabilidade: z.string().optional(),
        padrao: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        return db.updateModeloOrdemServico(id, rest);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteModeloOrdemServico(input.id);
      }),
  }),

  // ASOs - Gestão de Atestados de Saúde Ocupacional
  asos: router({
    dashboard: protectedProcedure
      .query(async ({ ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Acesso negado.");
        }
        
        console.log("[ASOs Dashboard Router] tenantId usado:", tenantId, "userId:", ctx.user.id, "role:", ctx.user.role);

        return db.getAsoDashboard(tenantId);
      }),

    sync: protectedProcedure
      .mutation(async ({ ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Acesso negado.");
        }
        
        console.log("[ASOs Sync Router] Sincronizando ASOs para tenantId:", tenantId);

        const resultado = await db.syncAsosFromColaboradores(tenantId);
        return resultado;
      }),

    list: protectedProcedure
      .input(z.object({
        colaboradorId: z.number().optional(),
        empresaId: z.number().optional(),
        tipoAso: z.enum(["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional"]).optional(),
        status: z.enum(["ativo", "vencido"]).optional(),
        vencidos: z.boolean().optional(),
        aVencerEmDias: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Acesso negado.");
        }
        
        console.log("[ASOs List Router] tenantId usado:", tenantId, "userId:", ctx.user.id, "role:", ctx.user.role);

        return db.getAllAsos({ tenantId, ...input });
      }),

    create: protectedProcedure
      .input(z.object({
        colaboradorId: z.number(),
        empresaId: z.number(),
        numeroAso: z.string().optional().nullable(),
        tipoAso: z.enum(["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional"]),
        dataEmissao: z.string(),
        dataValidade: z.string(),
        medicoResponsavel: z.string().optional().nullable(),
        clinicaMedica: z.string().optional().nullable(),
        crmMedico: z.string().optional().nullable(),
        apto: z.enum(["sim", "nao", "apto_com_restricoes"]),
        restricoes: z.string().optional().nullable(),
        observacoes: z.string().optional().nullable(),
        anexoUrl: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId para criar
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Não é possível criar ASO.");
        }

        return db.createAso({
          tenantId: tenantId!,
          colaboradorId: input.colaboradorId,
          empresaId: input.empresaId,
          numeroAso: input.numeroAso || null,
          tipoAso: input.tipoAso,
          dataEmissao: new Date(input.dataEmissao),
          dataValidade: new Date(input.dataValidade),
          medicoResponsavel: input.medicoResponsavel || null,
          clinicaMedica: input.clinicaMedica || null,
          crmMedico: input.crmMedico || null,
          apto: input.apto,
          restricoes: input.restricoes || null,
          observacoes: input.observacoes || null,
          anexoUrl: input.anexoUrl || null,
          status: "ativo",
        } as InsertAso);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        colaboradorId: z.number().optional(),
        empresaId: z.number().optional(),
        numeroAso: z.string().optional().nullable(),
        tipoAso: z.enum(["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional"]).optional(),
        dataEmissao: z.string().optional(),
        dataValidade: z.string().optional(),
        medicoResponsavel: z.string().optional().nullable(),
        clinicaMedica: z.string().optional().nullable(),
        crmMedico: z.string().optional().nullable(),
        apto: z.enum(["sim", "nao", "apto_com_restricoes"]).optional(),
        restricoes: z.string().optional().nullable(),
        observacoes: z.string().optional().nullable(),
        anexoUrl: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Acesso negado.");
        }

        const updateData: any = {};
        if (input.empresaId !== undefined) updateData.empresaId = input.empresaId;
        if (input.colaboradorId !== undefined) updateData.colaboradorId = input.colaboradorId;
        if (input.numeroAso !== undefined) updateData.numeroAso = input.numeroAso;
        if (input.tipoAso !== undefined) updateData.tipoAso = input.tipoAso;
        if (input.dataEmissao !== undefined) updateData.dataEmissao = new Date(input.dataEmissao);
        if (input.dataValidade !== undefined) updateData.dataValidade = new Date(input.dataValidade);
        if (input.medicoResponsavel !== undefined) updateData.medicoResponsavel = input.medicoResponsavel;
        if (input.clinicaMedica !== undefined) updateData.clinicaMedica = input.clinicaMedica;
        if (input.crmMedico !== undefined) updateData.crmMedico = input.crmMedico;
        if (input.apto !== undefined) updateData.apto = input.apto;
        if (input.restricoes !== undefined) updateData.restricoes = input.restricoes;
        if (input.observacoes !== undefined) updateData.observacoes = input.observacoes;
        if (input.anexoUrl !== undefined) updateData.anexoUrl = input.anexoUrl;

        // ISOLAMENTO DE TENANT: Filtrar ASO apenas do tenant do usuário
        const aso = await db.getAsoById(input.id, tenantId);
        if (!aso) {
          throw new Error("ASO não encontrado ou sem permissão de acesso.");
        }

        return db.updateAso(input.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Acesso negado.");
        }

        // ISOLAMENTO DE TENANT: Filtrar ASO apenas do tenant do usuário
        const aso = await db.getAsoById(input.id, tenantId);
        if (!aso) {
          throw new Error("ASO não encontrado ou sem permissão de acesso.");
        }

        return db.deleteAso(input.id);
      }),

    atualizarStatusVencidos: protectedProcedure
      .mutation(async ({ ctx }) => {
        // ISOLAMENTO DE TENANT: Apenas admin/super_admin podem ver todos os tenants
        // tenant_admin é admin do SEU tenant, não do sistema todo - deve ver apenas seu tenant
        const tenantId = (ctx.user.role === "admin" || ctx.user.role === "super_admin") 
          ? null // Admin geral pode ver todos
          : (ctx.user.tenantId || null); // tenant_admin e outros só veem seus próprios dados
        
        // VALIDAÇÃO CRÍTICA: Usuários não-admin (incluindo tenant_admin) SEMPRE precisam ter tenantId
        if (!tenantId && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new Error("Usuário não associado a um tenant. Acesso negado.");
        }

        return db.atualizarStatusAsosVencidos(tenantId);
      }),
  }),

  // Permissões de Usuários (Nova estrutura com campos booleanos)
  permissoesUsuarios: router({
    list: adminProcedure.query(async () => {
      return db.getAllPermissoesUsuarios();
    }),
    getByUsuarioId: adminProcedure
      .input(z.object({ usuarioId: z.number() }))
      .query(async ({ input }) => {
        return db.getPermissoesUsuario(input.usuarioId);
      }),
    upsert: adminProcedure
      .input(z.object({
        usuarioId: z.number(),
        empresasView: z.boolean().default(false),
        empresasAdd: z.boolean().default(false),
        empresasEdit: z.boolean().default(false),
        empresasDelete: z.boolean().default(false),
        empregadosView: z.boolean().default(false),
        empregadosAdd: z.boolean().default(false),
        empregadosEdit: z.boolean().default(false),
        empregadosDelete: z.boolean().default(false),
        fichasView: z.boolean().default(false),
        fichasAdd: z.boolean().default(false),
        fichasEdit: z.boolean().default(false),
        fichasDelete: z.boolean().default(false),
        osView: z.boolean().default(false),
        osAdd: z.boolean().default(false),
        osEdit: z.boolean().default(false),
        osDelete: z.boolean().default(false),
        treinamentosView: z.boolean().default(false),
        treinamentosAdd: z.boolean().default(false),
        treinamentosEdit: z.boolean().default(false),
        treinamentosDelete: z.boolean().default(false),
        certificadosView: z.boolean().default(false),
        certificadosAdd: z.boolean().default(false),
        certificadosEdit: z.boolean().default(false),
        certificadosDelete: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { usuarioId, ...permissoesData } = input;
        
        const result = await db.upsertPermissoesUsuario(usuarioId, permissoesData);
        
        // Log de auditoria para mudanças de permissões
        await logAudit({
          userId: ctx.user.id,
          action: AuditActions.PERMISSION_CHANGE,
          resource: "permissions",
          resourceId: usuarioId,
          details: { permissoes: permissoesData },
          ip: ctx.req.ip || ctx.req.socket.remoteAddress,
          userAgent: ctx.req.headers["user-agent"],
          timestamp: new Date()
        });
        
        return result;
      }),
  }),

  // === ADMIN: Gerenciamento de Tenants ===
  admin: router({
    // Lista todos os tenants
    listTenants: adminProcedure.query(async () => {
      return await db.getAllTenants();
    }),

    // Cria um novo tenant (com modo demonstração)
    createTenant: adminProcedure
      .input(z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email().optional().or(z.literal("")),
        telefone: z.string().optional(),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        plano: z.enum(["bronze", "prata", "ouro", "diamante"]),
        valorPlano: z.string().optional(),
        modoDemonstracao: z.boolean().default(false), // Modo demonstração
        diasAcesso: z.number().min(1).optional(), // Quantidade de dias de acesso
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const hoje = new Date();
        let dataFim: Date | null = null;
        
        // Se for modo demonstração e tiver dias definidos, calcula dataFim
        if (input.modoDemonstracao && input.diasAcesso) {
          dataFim = new Date(hoje);
          dataFim.setDate(dataFim.getDate() + input.diasAcesso);
        }
        
        // Determina valor do plano se não fornecido
        const valoresPlanos: Record<string, string> = {
          bronze: "67,90",
          prata: "97,90",
          ouro: "137,90",
          diamante: "199,90",
        };
        const valorPlano = input.valorPlano || valoresPlanos[input.plano] || "0,00";
        
        // Normaliza CPF e CNPJ
        const cpfNormalizado = input.cpf ? normalizeCPF(input.cpf) : null;
        const cnpjNormalizado = input.cnpj ? normalizeCNPJ(input.cnpj) : null;
        const emailNormalizado = input.email ? input.email.toLowerCase().trim() : null;
        
        // Verifica se já existe usuário com mesmo CPF, CNPJ ou Email
        if (cpfNormalizado) {
          const usuarioExistente = await db.getUserByIdentifier(cpfNormalizado);
          if (usuarioExistente) {
            throw new Error("Já existe um usuário cadastrado com este CPF");
          }
        }
        
        if (cnpjNormalizado) {
          const usuarioExistente = await db.getUserByIdentifier(cnpjNormalizado);
          if (usuarioExistente) {
            throw new Error("Já existe um usuário cadastrado com este CNPJ");
          }
        }
        
        if (emailNormalizado) {
          const usuarioExistente = await db.getUserByIdentifier(emailNormalizado);
          if (usuarioExistente) {
            throw new Error("Já existe um usuário cadastrado com este email");
          }
        }
        
        // Cria o tenant
        const tenant = await db.createTenant({
          nome: input.nome,
          email: emailNormalizado,
          telefone: input.telefone || null,
          cpf: cpfNormalizado,
          cnpj: cnpjNormalizado,
          plano: input.plano,
          status: "ativo" as any,
          dataInicio: hoje,
          dataFim: dataFim,
          valorPlano: valorPlano,
          dataUltimoPagamento: input.modoDemonstracao ? hoje : null,
          dataProximoPagamento: dataFim || null,
          periodicidade: input.modoDemonstracao ? "mensal" as any : "mensal" as any,
          statusPagamento: input.modoDemonstracao ? "pago" as any : "pendente" as any,
          observacoes: input.modoDemonstracao 
            ? `Modo demonstração - ${input.diasAcesso} dias de acesso${input.observacoes ? `. ${input.observacoes}` : ""}`
            : (input.observacoes || null),
        });
        
        // Cria o usuário automaticamente vinculado ao tenant
        const identificadorLogin = cpfNormalizado || cnpjNormalizado || emailNormalizado;
        if (!identificadorLogin) {
          throw new Error("É necessário informar CPF, CNPJ ou Email para criar o usuário");
        }
        
        const novoUsuario = await db.createUser({
          name: input.nome,
          email: emailNormalizado,
          cpf: cpfNormalizado,
          cnpj: cnpjNormalizado,
          password: input.senha,
          role: "tenant_admin", // Primeiro usuário do tenant é admin do tenant
          tenantId: tenant.id,
          openId: `tenant-${tenant.id}-${Date.now()}`,
          empresaId: null,
        });
        
        console.log(`[CreateTenant] ✅ Tenant ${tenant.id} criado com usuário ${novoUsuario?.id}`);
        
        // Log de auditoria
        await logAudit({
          userId: ctx.user.id,
          action: AuditActions.USER_CREATE, // Reutilizando ação existente
          resource: "tenants",
          resourceId: tenant.id,
          details: { 
            modoDemonstracao: input.modoDemonstracao,
            diasAcesso: input.diasAcesso,
            plano: input.plano,
            usuarioCriado: novoUsuario?.id
          },
          ip: ctx.req.ip || ctx.req.socket.remoteAddress,
          userAgent: ctx.req.headers["user-agent"],
          timestamp: new Date()
        });
        
        return tenant;
      }),

    // Obtém detalhes de um tenant
    getTenant: adminProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTenantById(input.tenantId);
      }),

    // Atualiza o plano de um tenant
    updateTenantPlano: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        plano: z.enum(["bronze", "prata", "ouro", "diamante"]),
        valorPlano: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTenantPlano(input.tenantId, input.plano, input.valorPlano);
      }),

    // Atualiza informações de pagamento
    updateTenantPagamento: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        dataUltimoPagamento: z.string().optional(),
        dataProximoPagamento: z.string().optional(),
        statusPagamento: z.enum(["pago", "pendente", "atrasado", "cancelado"]).optional(),
        valorPlano: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTenantPagamento(
          input.tenantId,
          input.dataUltimoPagamento ? new Date(input.dataUltimoPagamento) : undefined,
          input.dataProximoPagamento ? new Date(input.dataProximoPagamento) : undefined,
          input.statusPagamento,
          input.valorPlano
        );
      }),

    // Atualiza informações de contato
    updateTenantContato: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        nome: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTenantContato(
          input.tenantId,
          input.nome,
          input.email,
          input.telefone,
          input.cpf,
          input.cnpj,
          input.observacoes
        );
      }),

    // Atualiza o status de um tenant
    updateTenantStatus: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        status: z.enum(["ativo", "suspenso", "cancelado"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTenantStatus(input.tenantId, input.status);
      }),

    // Atualiza as datas de um tenant
    updateTenantDates: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        dataInicio: z.string(),
        dataFim: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTenantDates(
          input.tenantId,
          new Date(input.dataInicio),
          input.dataFim ? new Date(input.dataFim) : undefined
        );
      }),
  }),
})

export type AppRouter = typeof appRouter;
