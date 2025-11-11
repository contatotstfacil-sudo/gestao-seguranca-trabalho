/**
 * Script para verificar configuração antes do deploy
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "COOKIE_SECRET",
  "ENCRYPTION_KEY",
];

const optionalEnvVars = [
  "ALLOWED_ORIGINS",
  "NODE_ENV",
  "PORT",
];

async function checkDatabase() {
  try {
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      console.error("❌ Banco de dados não disponível");
      return false;
    }
    
    // Testa conexão simples
    await db.execute("SELECT 1");
    console.log("✅ Conexão com banco de dados OK");
    return true;
  } catch (error: any) {
    console.error("❌ Erro ao conectar no banco:", error.message);
    return false;
  }
}

async function checkEnvVars() {
  console.log("\n📋 Verificando variáveis de ambiente...\n");
  
  let allOk = true;
  
  // Verifica variáveis obrigatórias
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      console.error(`❌ ${envVar} não configurada`);
      allOk = false;
    } else {
      // Não mostra valor completo por segurança
      const displayValue = envVar.includes("SECRET") || envVar.includes("KEY")
        ? `${value.substring(0, 8)}...`
        : value;
      console.log(`✅ ${envVar}: ${displayValue}`);
    }
  }
  
  // Verifica variáveis opcionais
  console.log("\n📋 Variáveis opcionais:");
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value}`);
    } else {
      console.log(`⚠️  ${envVar}: não configurada (usará padrão)`);
    }
  }
  
  return allOk;
}

async function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split(".")[0].substring(1));
  
  if (majorVersion < 18) {
    console.error(`❌ Node.js ${nodeVersion} detectado. Requer Node.js 18+`);
    return false;
  }
  
  console.log(`✅ Node.js ${nodeVersion} OK`);
  return true;
}

async function checkDependencies() {
  try {
    const fs = await import("fs");
    const packageJson = JSON.parse(
      fs.readFileSync("package.json", "utf-8")
    );
    
    const requiredDeps = [
      "express",
      "@trpc/server",
      "drizzle-orm",
      "mysql2",
      "bcryptjs",
    ];
    
    const missing = requiredDeps.filter(
      dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missing.length > 0) {
      console.error(`❌ Dependências faltando: ${missing.join(", ")}`);
      return false;
    }
    
    console.log("✅ Dependências principais OK");
    return true;
  } catch (error: any) {
    console.error("❌ Erro ao verificar dependências:", error.message);
    return false;
  }
}

async function main() {
  console.log("🔍 Verificando configuração para deploy...\n");
  
  const checks = [
    { name: "Node.js", fn: checkNodeVersion },
    { name: "Dependências", fn: checkDependencies },
    { name: "Variáveis de Ambiente", fn: checkEnvVars },
    { name: "Banco de Dados", fn: checkDatabase },
  ];
  
  const results = await Promise.all(
    checks.map(async check => ({
      name: check.name,
      ok: await check.fn(),
    }))
  );
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMO");
  console.log("=".repeat(50));
  
  const allOk = results.every(r => r.ok);
  
  results.forEach(result => {
    console.log(`${result.ok ? "✅" : "❌"} ${result.name}`);
  });
  
  if (allOk) {
    console.log("\n🎉 Tudo pronto para deploy!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Alguns problemas encontrados. Corrija antes de fazer deploy.");
    process.exit(1);
  }
}

main().catch(console.error);


