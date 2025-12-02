import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("postgresql://usuario:senha@host:porta/nomedobanco")) {
    console.error("❌ Erro: DATABASE_URL não configurada ou é um placeholder.");
    console.error("   Configure o arquivo .env com a URL real do MySQL.");
    process.exit(1);
  }

  console.log("🔗 Conectando ao banco de dados...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🚀 Removendo coluna 'funcao' da tabela colaboradores...\n");

    // Verificar se a coluna existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'colaboradores' 
      AND COLUMN_NAME = 'funcao'
    `);

    if (Array.isArray(columns) && columns.length === 0) {
      console.log("✅ Coluna 'funcao' não existe na tabela colaboradores. Nada a fazer.");
      await connection.end();
      return;
    }

    // Remover a coluna
    await connection.query(`
      ALTER TABLE colaboradores 
      DROP COLUMN IF EXISTS funcao
    `);

    console.log("✅ Coluna 'funcao' removida com sucesso da tabela colaboradores!");
    console.log("\n🎉 Migração concluída!");

  } catch (error: any) {
    console.error("❌ Erro ao remover coluna:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});











