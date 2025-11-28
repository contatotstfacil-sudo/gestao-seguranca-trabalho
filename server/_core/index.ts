import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local primeiro (prioridade), depois .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Carregar .env primeiro (base)
config({ path: envPath });
// Carregar .env.local depois (sobrescreve)
config({ path: envLocalPath, override: true });
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  // Tentar a porta preferida primeiro
  if (await isPortAvailable(startPort)) {
    return startPort;
  }
  
  // Se não estiver disponível, tentar outras portas
  for (let port = startPort + 1; port < startPort + 50; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy para obter IP real em produção
  app.set("trust proxy", 1);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Middleware de segurança global
  const { securityMiddleware } = await import("../utils/security");
  app.use(securityMiddleware);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Servir arquivos estáticos de uploads (fichas de EPI)
  const uploadsPath = resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  const fichasEpiPath = resolve(uploadsPath, "fichas_epi");
  if (!fs.existsSync(fichasEpiPath)) {
    fs.mkdirSync(fichasEpiPath, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsPath));

  // Middleware específico para parsear body deste endpoint
  const parseBodyMiddleware = express.json({ limit: "50mb" });
  
  // Endpoint REST direto para dashboard de colaboradores (bypass tRPC)
  // IMPORTANTE: Deve estar ANTES do Vite para não ser interceptado
  console.log("[Server] ✅ Registrando endpoint REST: /api/dashboard/colaboradores/stats (GET e POST)");
  
  // Handler comum para GET e POST
  const handleStatsRequest = async (req: any, res: any) => {
    // Log IMEDIATO quando a requisição chega (antes de qualquer processamento)
    console.log("🔥🔥🔥 [REST API] REQUISIÇÃO CHEGOU - MÉTODO:", req.method, "URL:", req.originalUrl || req.url);
    try {
      console.log("═══════════════════════════════════════");
      console.log("[REST API] 🚀 REQUISIÇÃO RECEBIDA");
      console.log("[REST API] Método:", req.method);
      console.log("[REST API] URL:", req.url);
      console.log("[REST API] Content-Type:", req.headers['content-type']);
      console.log("[REST API] Body RAW:", req.body);
      console.log("[REST API] Body tipo:", typeof req.body);
      console.log("[REST API] Body é objeto?:", typeof req.body === 'object' && req.body !== null);
      console.log("[REST API] Body é array?:", Array.isArray(req.body));
      
      // Se body é string ou undefined, tentar parsear manualmente
      let bodyParsed: any = req.body;
      
      if (req.body === undefined || req.body === null) {
        console.log("[REST API] ⚠️⚠️⚠️ Body é undefined/null - tentando ler do stream");
        // Body não foi parseado, pode ser que o middleware não tenha processado
        bodyParsed = {};
      } else if (typeof req.body === 'string') {
        try {
          bodyParsed = JSON.parse(req.body);
          console.log("[REST API] ✅ Body parseado de string:", bodyParsed);
        } catch (e) {
          console.log("[REST API] ⚠️ Erro ao parsear body:", e);
          bodyParsed = {};
        }
      } else if (typeof req.body === 'object') {
        bodyParsed = req.body;
        console.log("[REST API] ✅ Body já é objeto:", bodyParsed);
      }
      
      console.log("[REST API] 🔍 bodyParsed final:", bodyParsed);
      console.log("[REST API] 🔍 bodyParsed keys:", typeof bodyParsed === 'object' && bodyParsed !== null ? Object.keys(bodyParsed) : 'N/A');
      
      // Obter empresaId - tentar do body primeiro (POST), depois da query (GET)
      let empresaIdParam: any = null;
      
      console.log("[REST API] 🔍 INICIANDO EXTRAÇÃO DE empresaId");
      console.log("[REST API] Método da requisição:", req.method);
      
      if (req.method === 'POST') {
        // POST: empresaId vem no body
        console.log("[REST API] 🔍 É POST - verificando bodyParsed");
        console.log("[REST API] bodyParsed existe?", bodyParsed !== null && bodyParsed !== undefined);
        console.log("[REST API] bodyParsed é objeto?", typeof bodyParsed === 'object');
        console.log("[REST API] bodyParsed não é array?", !Array.isArray(bodyParsed));
        
        if (bodyParsed && typeof bodyParsed === 'object' && bodyParsed !== null && !Array.isArray(bodyParsed)) {
          console.log("[REST API] 🔍 bodyParsed é válido - verificando 'empresaId'");
          console.log("[REST API] 'empresaId' in bodyParsed?", 'empresaId' in bodyParsed);
          console.log("[REST API] bodyParsed.empresaId:", bodyParsed.empresaId);
          
          if ('empresaId' in bodyParsed) {
            empresaIdParam = bodyParsed.empresaId;
            console.log("[REST API] ✅✅✅✅✅✅✅✅✅ empresaId do BODY (POST):", empresaIdParam, "Tipo:", typeof empresaIdParam);
            console.log("[REST API] empresaIdParam AGORA:", empresaIdParam);
          } else {
            console.log("[REST API] ⚠️⚠️⚠️ 'empresaId' NÃO está em bodyParsed");
            console.log("[REST API] bodyParsed completo:", JSON.stringify(bodyParsed, null, 2));
          }
        } else {
          console.log("[REST API] ⚠️⚠️⚠️ bodyParsed não é objeto válido");
        }
      } else if (req.query.empresaId !== undefined) {
        // GET: empresaId vem na query string
        empresaIdParam = req.query.empresaId;
        console.log("[REST API] ✅ empresaId da QUERY (GET):", empresaIdParam);
      } else {
        console.log("[REST API] ⚠️ empresaId não encontrado nem no body nem na query");
      }
      
      console.log("[REST API] ═══════════════════════════════════");
      console.log("[REST API] empresaIdParam FINAL APÓS EXTRAÇÃO:", empresaIdParam, "Tipo:", typeof empresaIdParam);
      console.log("[REST API] ═══════════════════════════════════");
      
      // Converter para number ou undefined
      console.log("[REST API] 🔍🔍🔍 ANTES DA CONVERSÃO:");
      console.log("[REST API] empresaIdParam:", empresaIdParam, "Tipo:", typeof empresaIdParam);
      console.log("[REST API] empresaIdParam === null?", empresaIdParam === null);
      console.log("[REST API] empresaIdParam === undefined?", empresaIdParam === undefined);
      
      let empresaId: number | undefined = undefined;
      if (empresaIdParam === null || empresaIdParam === undefined) {
        empresaId = undefined;
        console.log("[REST API] ⚠️ empresaIdParam é null/undefined, empresaId = undefined");
      } else {
        const parsed = parseInt(String(empresaIdParam), 10);
        console.log("[REST API] parsed:", parsed, "isNaN?", isNaN(parsed), "> 0?", parsed > 0);
        if (!isNaN(parsed) && parsed > 0) {
          empresaId = parsed;
          console.log("[REST API] ✅✅✅✅✅✅✅ empresaId CONVERTIDO:", empresaId, "Tipo:", typeof empresaId);
        } else {
          empresaId = undefined;
          console.log("[REST API] ⚠️ empresaId inválido após parseInt, parsed:", parsed);
        }
      }
      
      console.log("[REST API] ═══════════════════════════════════");
      console.log("[REST API] empresaId APÓS CONVERSÃO:", empresaId, "Tipo:", typeof empresaId);
      console.log("[REST API] empresaId !== null?", empresaId !== null);
      console.log("[REST API] empresaId !== undefined?", empresaId !== undefined);
      console.log("[REST API] ═══════════════════════════════════");
      
      // Criar contexto para autenticação
      const ctx = await createContext({ req, res });
      
      if (!ctx.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      // Determinar empresaId a ser usado (mesma lógica do tRPC)
      let empresaIdFinal: number | undefined;
      
      console.log("[REST API] 👤 Usuário:", ctx.user.email, "Role:", ctx.user.role);
      
      // Admin, super_admin e tenant_admin podem usar o empresaId recebido
      if (ctx.user.role === 'admin' || ctx.user.role === 'super_admin' || ctx.user.role === 'tenant_admin') {
        // Admin pode usar o empresaId recebido
        console.log("[REST API] 🔍 Admin/Tenant Admin - Verificando empresaId:", empresaId);
        console.log("[REST API] 🔍 empresaId !== null?", empresaId !== null);
        console.log("[REST API] 🔍 empresaId !== undefined?", empresaId !== undefined);
        console.log("[REST API] 🔍 !isNaN(empresaId)?", empresaId !== undefined ? !isNaN(empresaId) : 'N/A');
        console.log("[REST API] 🔍 empresaId > 0?", empresaId !== undefined ? empresaId > 0 : 'N/A');
        
        if (empresaId !== null && empresaId !== undefined && !isNaN(empresaId) && empresaId > 0) {
          empresaIdFinal = empresaId;
          console.log("[REST API] ✅✅✅✅✅✅✅✅✅ Admin/Tenant Admin - USANDO empresaId recebido:", empresaIdFinal);
        } else {
          empresaIdFinal = undefined;
          console.log("[REST API] ⚠️⚠️⚠️ Admin/Tenant Admin - empresaId inválido, usando undefined (todas empresas)");
          console.log("[REST API] ⚠️ empresaId era:", empresaId, "Tipo:", typeof empresaId);
        }
      } else {
        // Não-admin só vê sua própria empresa
        empresaIdFinal = ctx.user.empresaId || undefined;
        console.log("[REST API] ⚠️ Não-admin - usando empresaId do contexto:", empresaIdFinal);
      }
      
      console.log("[REST API] ═══════════════════════════════════");
      console.log("[REST API] 🔧🔧🔧 empresaIdFinal DEFINITIVO:", empresaIdFinal);
      console.log("[REST API] 🔧🔧🔧 Tipo:", typeof empresaIdFinal);
      console.log("[REST API] 🔧🔧🔧 É número válido?:", typeof empresaIdFinal === 'number' && empresaIdFinal > 0);
      console.log("[REST API] ═══════════════════════════════════");
      
      // Buscar dados diretamente do banco
      const { getColaboradorStats } = await import("../db");
      console.log("[REST API] 📊 Chamando getColaboradorStats com empresaIdFinal:", empresaIdFinal);
      console.log("[REST API] 📊 empresaIdFinal tipo:", typeof empresaIdFinal);
      console.log("[REST API] 📊 empresaIdFinal é null?:", empresaIdFinal === null);
      console.log("[REST API] 📊 empresaIdFinal é undefined?:", empresaIdFinal === undefined);
      
      const result = await getColaboradorStats(empresaIdFinal, undefined);
      
      console.log("[REST API] ✅ RESULTADO:", {
        total: result?.total,
        ativos: result?.ativos,
        inativos: result?.inativos,
        empresaIdUsado: empresaIdFinal
      });
      console.log("═══════════════════════════════════════");
      
      // Adicionar empresaId usado na resposta para debug
      const responseWithDebug = {
        ...result,
        _debug: {
          empresaIdRecebido: empresaId,
          empresaIdFinal: empresaIdFinal,
          empresaIdTipo: typeof empresaIdFinal
        }
      };
      
      res.json(responseWithDebug);
    } catch (error: any) {
      console.error("[REST API] ❌ Erro:", error);
      res.status(500).json({ error: error.message || "Erro interno" });
    }
  };
  
  // Registrar tanto GET quanto POST com middleware de parsing
  app.get("/api/dashboard/colaboradores/stats", handleStatsRequest);
  app.post("/api/dashboard/colaboradores/stats", parseBodyMiddleware, handleStatsRequest);

  // development mode uses Vite, production mode uses static files
  // IMPORTANTE: Vite deve ser configurado ANTES do tRPC para servir arquivos estáticos
  if (process.env.NODE_ENV === "development") {
    console.log("[Server] Configurando Vite em modo desenvolvimento...");
    try {
      await setupVite(app, server);
      console.log("[Server] ✅ Vite configurado com sucesso");
    } catch (error) {
      console.error("[Server] ❌ Erro ao configurar Vite:", error);
      throw error;
    }
  } else {
    console.log("[Server] Modo produção - servindo arquivos estáticos");
    serveStatic(app);
  }

  // tRPC API - depois do Vite para não interferir no roteamento
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      // SEM transformer - usar JSON puro
    })
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[Server] Porta ${preferredPort} ocupada, usando porta ${port}`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Server] ✅ Servidor rodando em http://localhost:${port}/`);
    console.log(`[Server] Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Banco: ${process.env.DATABASE_URL ? "Configurado" : "Não configurado"}`);
    console.log(`[Server] Acesse: http://localhost:${port}/`);
  });

  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[Server] ❌ Porta ${port} já está em uso`);
      console.log(`[Server] Tentando encontrar outra porta...`);
      findAvailablePort(port + 1).then(newPort => {
        server.listen(newPort, "0.0.0.0", () => {
          console.log(`[Server] ✅ Servidor rodando em http://localhost:${newPort}/`);
        });
      }).catch(err => {
        console.error("[Server] ❌ Erro ao iniciar servidor:", err);
        process.exit(1);
      });
    } else {
      console.error("[Server] ❌ Erro no servidor:", error);
      process.exit(1);
    }
  });
}

startServer().catch((error) => {
  console.error("[Server] ❌ Erro fatal ao iniciar servidor:", error);
  process.exit(1);
});
