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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        identifier: z.string().min(1, "Email, CPF ou CNPJ é obrigatório"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { identifier, password } = input;
        
        // Rate limiting para login (mais permissivo)
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        const rateLimit = checkLoginRateLimit(ip);
        if (!rateLimit.allowed) {
          throw new Error(`Muitas tentativas de login. Tente novamente em ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutos.`);
        }
        
        try {
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
          
          console.log(`[Login] Usuário encontrado: ID=${user.id}, Email=${user.email || "N/A"}, CPF=${user.cpf || "N/A"}, Role=${user.role}`);
          
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
          
          console.log(`[Login] Login bem-sucedido para usuário ID=${user.id}`);
          
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
            throw new Error("Erro ao criar sessão. Tente novamente.");
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
          return responseData;
        } catch (error: any) {
          console.error("[Login] Erro completo:", error);
          console.error("[Login] Stack:", error?.stack);
          // Retorna erro serializável
          const errorMessage = String(error?.message || "Erro ao fazer login. Tente novamente.");
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
    stats: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      return db.getDashboardStats(empresaId);
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
      .query(async ({ input }) => {
        return db.getAllEmpresas(input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEmpresaById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        razaoSocial: z.string(),
        cnpj: z.string(),
        responsavelTecnico: z.string().optional(),
        emailContato: z.union([z.string().email(), z.literal('')]).optional(),
        status: z.enum(["ativa", "inativa"]).default("ativa"),
      }))
      .mutation(async ({ input }) => {
        return db.createEmpresa(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        razaoSocial: z.string().optional(),
        cnpj: z.string().optional(),
        responsavelTecnico: z.string().optional(),
        emailContato: z.union([z.string().email(), z.literal('')]).optional(),
        status: z.enum(["ativa", "inativa"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateEmpresa(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteEmpresa(input.id);
      }),
  }),

  // Colaboradores
  colaboradores: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        dataAdmissaoInicio: z.string().optional(),
        dataAdmissaoFim: z.string().optional(),
        funcao: z.string().optional(),
        empresaId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // Se o usuário selecionou uma empresa nos filtros, usar ela; senão usar a empresa do usuário (se não for admin)
        const empresaIdFiltro = input?.empresaId ? input.empresaId : undefined;
        const empresaId = ctx.user.role === "admin" ? empresaIdFiltro : (empresaIdFiltro || ctx.user.empresaId || undefined);
        return db.getAllColaboradores(empresaId, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getColaboradorById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeCompleto: z.string(),
        funcao: z.string().optional(),
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
      .mutation(async ({ input: formInput }) => {
        const data = {
          ...formInput,
          dataAdmissao: formInput.dataAdmissao ? new Date(formInput.dataAdmissao) : undefined,
          dataPrimeiroAso: formInput.dataPrimeiroAso ? new Date(formInput.dataPrimeiroAso) : undefined,
          validadeAso: formInput.validadeAso ? new Date(formInput.validadeAso) : undefined,
          dataNascimento: formInput.dataNascimento ? new Date(formInput.dataNascimento) : undefined,
        };
        return db.createColaborador(data);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        funcao: z.string().optional(),
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
        return db.updateColaborador(id, data);
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
      .query(async ({ ctx }) => {
        const empresaId = ctx.user.role === 'admin' ? undefined : ctx.user.empresaId || undefined;
        return db.getColaboradorStats(empresaId);
      }),
  }),

  // Obras
  obras: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      return db.getAllObras(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getObraById(input.id);
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
        bairroEndereco: z.string().optional(),
        cidadeEndereco: z.string().optional(),
        estadoEndereco: z.string().optional(),
        cepEndereco: z.string().optional(),
        endereco: z.string().optional(),
        empresaId: z.number(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        status: z.enum(["ativa", "concluida"]).default("ativa"),
      }))
      .mutation(async ({ input }) => {
        const data = {
          ...input,
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
        bairroEndereco: z.string().optional(),
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
        return db.updateObra(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteObra(input.id);
      }),
  }),

  // Treinamentos
  treinamentos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      return db.getAllTreinamentos(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTreinamentoById(input.id);
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
      .mutation(async ({ input }) => {
        const data = {
          ...input,
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
      return db.getAllEpis(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEpiById(input.id);
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
      .mutation(async ({ input }) => {
        const data = {
          ...input,
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
        return db.getDadosFichaEPI(input.empresaId, input.colaboradorId);
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
          
          // Salvar registro da ficha emitida
          const ficha = await db.createFichaEpiEmitida({
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
        return db.getAllFichasEpiEmitidas(empresaId);
      }),
    deleteFichaEmitida: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteFichaEpiEmitida(input.id);
      }),
  }),

  cargos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      return db.getAllCargos(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCargoById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeCargo: z.string(),
        descricao: z.string().optional(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        return db.createCargo({ ...input, empresaId });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCargo: z.string().optional(),
        descricao: z.string().optional(),
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
  }),

  setores: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
        return db.getAllSetores(input, empresaId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSetorById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeSetor: z.string(),
        descricao: z.string().optional(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        return db.createSetor({ ...input, empresaId });
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
        return db.getTreinamentosByCargo(input.cargoId);
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
        return db.getSetoresByCargo(input.cargoId);
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
        return db.getAllRiscosOcupacionais(empresaId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRiscoOcupacionalById(input.id);
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
        return db.getRiscosByCargo(input.cargoId);
      }),
    create: protectedProcedure
      .input(z.object({
        cargoId: z.number(),
        riscoOcupacionalId: z.number(),
        tipoAgente: z.string().optional(),
        descricaoRiscos: z.string().optional(),
        empresaId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const empresaId = input.empresaId || ctx.user.empresaId;
        const dataToInsert: any = {
          cargoId: input.cargoId,
          riscoOcupacionalId: input.riscoOcupacionalId,
        };
        if (input.tipoAgente && input.tipoAgente.trim()) {
          dataToInsert.tipoAgente = input.tipoAgente.trim();
        }
        if (input.descricaoRiscos && input.descricaoRiscos.trim()) {
          dataToInsert.descricaoRiscos = input.descricaoRiscos.trim();
        }
        if (empresaId) {
          dataToInsert.empresaId = empresaId;
        }
        return db.createCargoRisco(dataToInsert);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        cargoId: z.number(),
        tipoAgente: z.string().optional(),
        descricaoRiscos: z.string().optional(),
        riscoOcupacionalId: z.number().optional(),
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
        return db.getAllTiposTreinamentos(input, empresaId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTipoTreinamentoById(input.id);
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
        return db.createTipoTreinamento({ ...input, empresaId });
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
      return db.getAllModelosCertificados(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getModeloCertificadoById(input.id);
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
        return db.createModeloCertificado({ ...input, empresaId });
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
      const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
      return db.getAllResponsaveis(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getResponsavelById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nomeCompleto: z.string().min(1),
        funcao: z.string().optional().nullable(),
        registroProfissional: z.string().optional().nullable(),
        empresaId: z.number().optional().nullable(),
        status: z.enum(["ativo", "inativo"]).default("ativo"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Preparar dados para inserção - apenas campos definidos
        const data: InsertResponsavel = {
          nomeCompleto: input.nomeCompleto.trim(),
          status: input.status || "ativo",
        };
        
        // Adicionar campos opcionais apenas se tiverem valor (não vazio)
        if (input.funcao !== undefined && input.funcao !== null && input.funcao.trim() !== "") {
          data.funcao = input.funcao.trim();
        }
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
        return db.getAllCertificadosEmitidos(empresaId, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCertificadoEmitidoById(input.id);
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
        return db.createCertificadoEmitido({
          ...input,
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
        const empresaId = ctx.user.role === "admin" ? undefined : ctx.user.empresaId || undefined;
        return db.getAllOrdensServico(empresaId, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOrdemServicoById(input.id);
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
      .mutation(async ({ input }) => {
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
      return db.getAllModelosOrdemServico(empresaId);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getModeloOrdemServicoById(input.id);
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
        return db.createModeloOrdemServico({ ...input, empresaId });
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
})

export type AppRouter = typeof appRouter;
