import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

console.log("🔍 Verificando configuração do site...\n");

// Verificar arquivos essenciais
const arquivosEssenciais = [
  "client/src/main.tsx",
  "client/src/App.tsx",
  "client/index.html",
  "client/src/pages/LaudosOcupacionais.tsx",
  "client/src/pages/laudos/LaudoPgro.tsx",
];

console.log("📁 Verificando arquivos essenciais:");
let todosArquivosOk = true;
for (const arquivo of arquivosEssenciais) {
  const caminho = join(process.cwd(), arquivo);
  if (existsSync(caminho)) {
    console.log(`  ✅ ${arquivo}`);
  } else {
    console.log(`  ❌ ${arquivo} - NÃO ENCONTRADO`);
    todosArquivosOk = false;
  }
}

// Verificar .env
console.log("\n🔐 Verificando variáveis de ambiente:");
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.includes("postgresql://usuario:senha")) {
    console.log("  ⚠️  DATABASE_URL parece ser um placeholder - configure com valores reais");
  } else if (dbUrl.startsWith("mysql://")) {
    console.log("  ✅ DATABASE_URL configurada (MySQL)");
  } else {
    console.log("  ⚠️  DATABASE_URL configurada mas formato pode estar incorreto");
  }
} else {
  console.log("  ❌ DATABASE_URL não configurada");
}

// Verificar imports no LaudoPgro
console.log("\n📦 Verificando imports no LaudoPgro:");
try {
  const laudoPgroPath = join(process.cwd(), "client/src/pages/laudos/LaudoPgro.tsx");
  if (existsSync(laudoPgroPath)) {
    const conteudo = readFileSync(laudoPgroPath, "utf-8");
    
    const importsEsperados = [
      "from \"react\"",
      "from \"@/components/ui/card\"",
      "from \"@/components/ui/button\"",
      "from \"@/lib/trpc\"",
      "from \"lucide-react\"",
      "from \"sonner\"",
    ];
    
    let todosImportsOk = true;
    for (const importEsperado of importsEsperados) {
      if (conteudo.includes(importEsperado)) {
        console.log(`  ✅ Import encontrado: ${importEsperado.split("from ")[1]}`);
      } else {
        console.log(`  ❌ Import não encontrado: ${importEsperado.split("from ")[1]}`);
        todosImportsOk = false;
      }
    }
    
    // Verificar export default
    if (conteudo.includes("export default function LaudoPgro")) {
      console.log("  ✅ Export default encontrado");
    } else {
      console.log("  ❌ Export default não encontrado");
      todosImportsOk = false;
    }
  }
} catch (error) {
  console.log("  ❌ Erro ao verificar LaudoPgro:", error);
}

// Verificar App.tsx
console.log("\n🔄 Verificando roteamento no App.tsx:");
try {
  const appPath = join(process.cwd(), "client/src/App.tsx");
  if (existsSync(appPath)) {
    const conteudo = readFileSync(appPath, "utf-8");
    
    if (conteudo.includes("LaudosOcupacionais")) {
      console.log("  ✅ LaudosOcupacionais importado");
    } else {
      console.log("  ❌ LaudosOcupacionais não importado");
    }
    
    if (conteudo.includes("/laudos-ocupacionais")) {
      console.log("  ✅ Rotas de laudos-ocupacionais configuradas");
    } else {
      console.log("  ❌ Rotas de laudos-ocupacionais não configuradas");
    }
  }
} catch (error) {
  console.log("  ❌ Erro ao verificar App.tsx:", error);
}

console.log("\n✨ Verificação concluída!");
console.log("\n💡 Para iniciar o servidor de desenvolvimento:");
console.log("   pnpm dev");








