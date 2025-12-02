/**
 * Script de Diagnóstico de Login
 * Verifica problemas comuns que impedem o login
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

config({ path: envPath });
config({ path: envLocalPath, override: true });

import { getDb, getUserByIdentifier } from "../server/db";
import bcrypt from "bcryptjs";

async function verificarServidor() {
  console.log("🔍 Verificando se o servidor está rodando...");
  
  try {
    const response = await fetch("http://localhost:3000/api/health");
    if (response.ok) {
      console.log("✅ Servidor está rodando na porta 3000");
      return true;
    } else {
      console.log("⚠️ Servidor respondeu mas com erro:", response.status);
      return false;
    }
  } catch (error: any) {
    console.log("❌ Servidor NÃO está rodando na porta 3000");
    console.log("   Erro:", error.message);
    console.log("\n💡 SOLUÇÃO: Execute 'pnpm dev' ou 'pnpm dev:win' para iniciar o servidor");
    return false;
  }
}

async function verificarBancoDados() {
  console.log("\n🔍 Verificando conexão com banco de dados...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.log("❌ Banco de dados não disponível");
      return false;
    }
    
    await db.execute("SELECT 1");
    console.log("✅ Conexão com banco de dados OK");
    return true;
  } catch (error: any) {
    console.log("❌ Erro ao conectar com banco de dados");
    console.log("   Erro:", error.message);
    console.log("\n💡 SOLUÇÃO: Verifique a variável DATABASE_URL no .env");
    return false;
  }
}

async function verificarUsuarioAdmin() {
  console.log("\n🔍 Verificando usuário admin...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.log("⚠️ Banco não disponível - pulando verificação");
      return false;
    }

    // Tentar encontrar usuário pelo CPF comum de admin
    const cpfAdmin = "38099529820";
    const user = await getUserByIdentifier(cpfAdmin);
    
    if (user) {
      console.log(`✅ Usuário admin encontrado: ${user.name || user.email || cpfAdmin}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   TenantId: ${user.tenantId || "N/A"}`);
      return true;
    } else {
      console.log("⚠️ Usuário admin não encontrado");
      console.log("\n💡 SOLUÇÃO: Execute 'pnpm deploy:create-admin' para criar o admin");
      return false;
    }
  } catch (error: any) {
    console.log("❌ Erro ao verificar usuário admin");
    console.log("   Erro:", error.message);
    return false;
  }
}

async function testarLogin(identifier: string, password: string) {
  console.log(`\n🔍 Testando login com: ${identifier}...`);
  
  try {
    const response = await fetch("http://localhost:3000/api/trpc/auth.login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.result?.data?.success) {
      console.log("✅ Login funcionou!");
      return true;
    } else {
      console.log("❌ Login falhou");
      console.log("   Resposta:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error: any) {
    console.log("❌ Erro ao testar login");
    console.log("   Erro:", error.message);
    return false;
  }
}

async function verificarVariaveisAmbiente() {
  console.log("\n🔍 Verificando variáveis de ambiente...");
  
  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "COOKIE_SECRET",
    "ENCRYPTION_KEY",
  ];

  const missing: string[] = [];
  const present: string[] = [];

  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    console.log("✅ Todas as variáveis necessárias estão configuradas");
    return true;
  } else {
    console.log("❌ Variáveis faltando:", missing.join(", "));
    console.log("\n💡 SOLUÇÃO: Configure essas variáveis no arquivo .env ou .env.local");
    return false;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("🔧 DIAGNÓSTICO DE LOGIN");
  console.log("=".repeat(60));

  const results = {
    servidor: false,
    banco: false,
    variaveis: false,
    usuario: false,
  };

  // Verificações
  results.servidor = await verificarServidor();
  results.variaveis = await verificarVariaveisAmbiente();
  results.banco = await verificarBancoDados();
  
  if (results.banco) {
    results.usuario = await verificarUsuarioAdmin();
  }

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO");
  console.log("=".repeat(60));
  console.log(`Servidor rodando: ${results.servidor ? "✅" : "❌"}`);
  console.log(`Variáveis de ambiente: ${results.variaveis ? "✅" : "❌"}`);
  console.log(`Banco de dados: ${results.banco ? "✅" : "❌"}`);
  console.log(`Usuário admin: ${results.usuario ? "✅" : "⚠️"}`);

  if (!results.servidor) {
    console.log("\n🚨 PROBLEMA PRINCIPAL: Servidor não está rodando");
    console.log("   Execute: pnpm dev (ou pnpm dev:win no Windows)");
  } else if (!results.banco) {
    console.log("\n🚨 PROBLEMA PRINCIPAL: Banco de dados não conecta");
    console.log("   Verifique: DATABASE_URL no .env");
  } else if (!results.variaveis) {
    console.log("\n🚨 PROBLEMA PRINCIPAL: Variáveis de ambiente faltando");
    console.log("   Configure: .env ou .env.local");
  } else {
    console.log("\n✅ Tudo parece estar OK!");
    console.log("   Se ainda não conseguir fazer login, verifique:");
    console.log("   1. CPF/Senha estão corretos?");
    console.log("   2. Console do navegador (F12) para erros");
    console.log("   3. Logs do servidor para mais detalhes");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erro ao executar diagnóstico:", error);
  process.exit(1);
});

