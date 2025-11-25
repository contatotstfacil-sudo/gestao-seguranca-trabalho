import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { empresas, responsaveis, setores, colaboradores } from "../drizzle/schema";

async function verificarDados() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada no arquivo .env");
  }
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    const [empresasCount] = await db.select().from(empresas).limit(1);
    const empresasTotal = await db.select().from(empresas);
    
    const [responsaveisCount] = await db.select().from(responsaveis).limit(1);
    const responsaveisTotal = await db.select().from(responsaveis);
    
    const [setoresCount] = await db.select().from(setores).limit(1);
    const setoresTotal = await db.select().from(setores);
    
    const [colaboradoresCount] = await db.select().from(colaboradores).limit(1);
    const colaboradoresTotal = await db.select().from(colaboradores);

    await connection.end();

    return {
      empresas: empresasTotal.length,
      responsaveis: responsaveisTotal.length,
      setores: setoresTotal.length,
      colaboradores: colaboradoresTotal.length,
    };
  } catch (error) {
    await connection.end();
    throw error;
  }
}

async function executarSeed(scriptName: string) {
  console.log(`\n🔄 Executando: ${scriptName}...`);
  const { execSync } = require("child_process");
  try {
    execSync(`pnpm tsx ${scriptName}`, { 
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log(`✅ ${scriptName} concluído com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${scriptName}:`, error);
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada no arquivo .env");
    console.error("   Configure a variável DATABASE_URL antes de executar os seeds.");
    process.exit(1);
  }

  console.log("🚀 Iniciando processo de seed completo...\n");

  // Verificar dados existentes
  console.log("📊 Verificando dados existentes no banco...");
  const dados = await verificarDados();
  console.log(`   - Empresas: ${dados.empresas}`);
  console.log(`   - Responsáveis: ${dados.responsaveis}`);
  console.log(`   - Setores: ${dados.setores}`);
  console.log(`   - Colaboradores: ${dados.colaboradores}\n`);

  // Executar seeds em ordem
  const seeds = [
    { name: "Construtoras", script: "../seed-construtoras.ts", condicao: dados.empresas === 0 },
    { name: "Responsáveis", script: "../seed-responsaveis.ts", condicao: dados.responsaveis === 0 },
    { name: "Setores", script: "../seed-setores.ts", condicao: dados.setores === 0 },
    { name: "Colaboradores", script: "../seed-colaboradores.ts", condicao: dados.colaboradores === 0 },
  ];

  for (const seed of seeds) {
    if (seed.condicao) {
      console.log(`\n📝 ${seed.name} não encontrados. Executando seed...`);
      await executarSeed(seed.script);
    } else {
      console.log(`\n⏭️  ${seed.name} já existem (${seed.name === "Construtoras" ? dados.empresas : seed.name === "Responsáveis" ? dados.responsaveis : seed.name === "Setores" ? dados.setores : dados.colaboradores}). Pulando...`);
    }
  }

  // Verificar dados finais
  console.log("\n📊 Verificando dados finais...");
  const dadosFinais = await verificarDados();
  console.log(`   - Empresas: ${dadosFinais.empresas}`);
  console.log(`   - Responsáveis: ${dadosFinais.responsaveis}`);
  console.log(`   - Setores: ${dadosFinais.setores}`);
  console.log(`   - Colaboradores: ${dadosFinais.colaboradores}`);

  console.log("\n✨ Processo de seed concluído!");
}

main().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});

