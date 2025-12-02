/**
 * Script de Teste Automatizado do Sistema
 * Valida funcionalidades críticas antes do lançamento
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

config({ path: envPath });
config({ path: envLocalPath, override: true });

import { getDb } from "../server/db";

interface TestResult {
  name: string;
  status: "✅ PASSOU" | "❌ FALHOU" | "⚠️ AVISO";
  message: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: "✅ PASSOU" | "❌ FALHOU" | "⚠️ AVISO", message: string) {
  results.push({ name, status, message });
  console.log(`${status} ${name}: ${message}`);
}

async function testDatabaseConnection() {
  try {
    const db = await getDb();
    if (!db) {
      addResult("Conexão com Banco", "❌ FALHOU", "Banco de dados não disponível");
      return false;
    }
    
    await db.execute("SELECT 1");
    addResult("Conexão com Banco", "✅ PASSOU", "Conexão estabelecida com sucesso");
    return true;
  } catch (error: any) {
    addResult("Conexão com Banco", "❌ FALHOU", error.message);
    return false;
  }
}

async function testTablesExist() {
  try {
    const db = await getDb();
    if (!db) {
      addResult("Tabelas do Banco", "❌ FALHOU", "Banco não disponível");
      return;
    }

    const requiredTables = [
      "users",
      "tenants",
      "empresas",
      "colaboradores",
      "cargos",
      "asos",
      "epis",
      "treinamentos",
    ];

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        await db.execute(`SELECT 1 FROM \`${table}\` LIMIT 1`);
      } catch (error) {
        missingTables.push(table);
      }
    }

    if (missingTables.length === 0) {
      addResult("Tabelas do Banco", "✅ PASSOU", `Todas as ${requiredTables.length} tabelas existem`);
    } else {
      addResult("Tabelas do Banco", "❌ FALHOU", `Tabelas faltando: ${missingTables.join(", ")}`);
    }
  } catch (error: any) {
    addResult("Tabelas do Banco", "❌ FALHOU", error.message);
  }
}

async function testAdminUserExists() {
  try {
    const db = await getDb();
    if (!db) {
      addResult("Usuário Admin", "❌ FALHOU", "Banco não disponível");
      return;
    }

    const [admins] = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'super_admin')"
    ) as any[];

    const count = admins[0]?.count || 0;

    if (count > 0) {
      addResult("Usuário Admin", "✅ PASSOU", `${count} admin(s) encontrado(s)`);
    } else {
      addResult("Usuário Admin", "⚠️ AVISO", "Nenhum admin encontrado - execute: pnpm deploy:create-admin");
    }
  } catch (error: any) {
    addResult("Usuário Admin", "❌ FALHOU", error.message);
  }
}

async function testTenantsExist() {
  try {
    const db = await getDb();
    if (!db) {
      addResult("Tenants", "❌ FALHOU", "Banco não disponível");
      return;
    }

    const [tenants] = await db.execute("SELECT COUNT(*) as count FROM tenants") as any[];
    const count = tenants[0]?.count || 0;

    if (count > 0) {
      addResult("Tenants", "✅ PASSOU", `${count} tenant(s) encontrado(s)`);
    } else {
      addResult("Tenants", "⚠️ AVISO", "Nenhum tenant encontrado - execute: npx tsx scripts/aplicar-migracao-e-criar-clientes.ts");
    }
  } catch (error: any) {
    addResult("Tenants", "❌ FALHOU", error.message);
  }
}

async function testPlanosValidos() {
  try {
    const db = await getDb();
    if (!db) {
      addResult("Planos Válidos", "❌ FALHOU", "Banco não disponível");
      return;
    }

    const [invalidPlans] = await db.execute(
      "SELECT COUNT(*) as count FROM tenants WHERE plano NOT IN ('bronze', 'prata', 'ouro', 'diamante')"
    ) as any[];

    const count = invalidPlans[0]?.count || 0;

    if (count === 0) {
      addResult("Planos Válidos", "✅ PASSOU", "Todos os tenants têm planos válidos (Bronze, Prata, Ouro, Diamante)");
    } else {
      addResult("Planos Válidos", "❌ FALHOU", `${count} tenant(s) com planos inválidos (Básico/Profissional ainda existem)`);
    }
  } catch (error: any) {
    addResult("Planos Válidos", "❌ FALHOU", error.message);
  }
}

async function testEnvironmentVariables() {
  const requiredVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "COOKIE_SECRET",
    "ENCRYPTION_KEY",
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    addResult("Variáveis de Ambiente", "✅ PASSOU", "Todas as variáveis necessárias estão configuradas");
  } else {
    addResult("Variáveis de Ambiente", "❌ FALHOU", `Variáveis faltando: ${missing.join(", ")}`);
  }
}

async function runAllTests() {
  console.log("🧪 Iniciando testes do sistema...\n");

  // Testes básicos
  await testEnvironmentVariables();
  const dbConnected = await testDatabaseConnection();

  if (dbConnected) {
    await testTablesExist();
    await testAdminUserExists();
    await testTenantsExist();
    await testPlanosValidos();
  }

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DOS TESTES");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.status === "✅ PASSOU").length;
  const failed = results.filter(r => r.status === "❌ FALHOU").length;
  const warnings = results.filter(r => r.status === "⚠️ AVISO").length;

  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`⚠️  Avisos: ${warnings}`);
  console.log(`📝 Total: ${results.length}`);

  if (failed > 0) {
    console.log("\n❌ CORRIJA OS ERROS ANTES DE LANÇAR!");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  Revise os avisos antes de lançar.");
    process.exit(0);
  } else {
    console.log("\n✅ TODOS OS TESTES PASSARAM! Sistema pronto para lançamento.");
    process.exit(0);
  }
}

runAllTests().catch((error) => {
  console.error("❌ Erro ao executar testes:", error);
  process.exit(1);
});

