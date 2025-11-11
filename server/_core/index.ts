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
