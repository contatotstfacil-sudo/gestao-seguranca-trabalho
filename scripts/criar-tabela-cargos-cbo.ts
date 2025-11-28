import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { getDb } from "../server/db";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath, override: true });

async function criarTabela() {
  try {
    console.log("🔄 Criando tabela cargosCbo...\n");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`cargosCbo\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`codigoCbo\` varchar(20) NOT NULL,
        \`nomeCargo\` varchar(255) NOT NULL,
        \`descricao\` text,
        \`familiaOcupacional\` varchar(255),
        \`sinonimia\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`cargosCbo_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`cargosCbo_codigoCbo_unique\` UNIQUE(\`codigoCbo\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await db.execute(createTableSQL);
    console.log("✅ Tabela 'cargosCbo' criada com sucesso!\n");
    
    // Verificar se foi criada
    const result = await db.execute("SHOW TABLES LIKE 'cargosCbo'");
    if ((result as any)[0]?.length > 0) {
      console.log("✅ Tabela verificada e pronta para uso!");
    }
    
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes("already exists") || error.message?.includes("Duplicate table")) {
      console.log("✅ Tabela 'cargosCbo' já existe!");
      process.exit(0);
    }
    console.error("❌ Erro ao criar tabela:", error.message);
    process.exit(1);
  }
}

criarTabela();










