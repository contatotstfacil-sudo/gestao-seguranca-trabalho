import { empresas } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";
import mysql from "mysql2/promise";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath });
config(); // Carregar .env também

// Lista de bairros fictícios comuns no Brasil
const bairros = [
  "Centro",
  "Jardim das Flores",
  "Vila Nova",
  "Bela Vista",
  "Parque Industrial",
  "Jardim América",
  "Vila Esperança",
  "Centro Comercial",
  "Jardim Primavera",
  "Vila São Paulo",
  "Parque das Árvores",
  "Jardim dos Estados",
  "Vila Progresso",
  "Centro Empresarial",
  "Jardim Europa",
  "Vila Mariana",
  "Parque Residencial",
  "Jardim Paulista",
  "Vila Madalena",
  "Centro Histórico",
  "Jardim Botânico",
  "Vila Olímpia",
  "Parque Verde",
  "Jardim das Acácias",
  "Vila Formosa",
  "Centro Cívico",
  "Jardim das Rosas",
  "Vila Nova Conceição",
  "Parque dos Pássaros",
  "Jardim das Palmeiras",
];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Erro: Não foi possível conectar ao banco de dados");
    process.exit(1);
  }

  console.log("🚀 Iniciando preenchimento de bairros...");

  try {
    // Verificar se a coluna existe, se não existir, criar
    try {
      await db.execute("SELECT bairroEndereco FROM empresas LIMIT 1");
    } catch (error: any) {
      console.log("📝 Coluna bairroEndereco não existe. Criando...");
      await db.execute("ALTER TABLE empresas ADD COLUMN bairroEndereco VARCHAR(255) NULL");
      console.log("✅ Coluna bairroEndereco criada com sucesso!");
    }

    // Buscar todas as empresas
    const todasEmpresas = await db.select().from(empresas);

    console.log(`📊 Encontradas ${todasEmpresas.length} empresas`);

    let atualizadas = 0;

    for (const empresa of todasEmpresas) {
      // Preencher bairro se estiver vazio, null ou undefined
      const bairroAtual = empresa.bairroEndereco;
      if (!bairroAtual || (typeof bairroAtual === "string" && bairroAtual.trim() === "")) {
        // Selecionar um bairro aleatório da lista
        const bairroAleatorio = bairros[Math.floor(Math.random() * bairros.length)];
        
        // Usar SQL direto via conexão MySQL
        if (!process.env.DATABASE_URL) {
          throw new Error("DATABASE_URL não configurada");
        }
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        await connection.execute(
          `UPDATE empresas SET bairroEndereco = ? WHERE id = ?`,
          [bairroAleatorio, empresa.id]
        );
        await connection.end();
        
        atualizadas++;
        console.log(
          `✅ Empresa ${empresa.id} (${empresa.razaoSocial}): Bairro "${bairroAleatorio}" adicionado`
        );
      } else {
        console.log(
          `⏭️  Empresa ${empresa.id} (${empresa.razaoSocial}): Já possui bairro "${bairroAtual}"`
        );
      }
    }

    console.log("\n📈 Resumo:");
    console.log(`   Total de empresas: ${todasEmpresas.length}`);
    console.log(`   Empresas atualizadas: ${atualizadas}`);
    console.log("\n✅ Preenchimento de bairros concluído com sucesso!");

  } catch (error: any) {
    console.error("❌ Erro ao preencher bairros:", error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

