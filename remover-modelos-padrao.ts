import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });
config({ path: envLocalPath, override: true });

async function removerModelosPadrao() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada");
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Remover todos os modelos que começam com "Modelo Padrão"
    const [result] = await connection.execute(
      `DELETE FROM modelosCertificados WHERE nome LIKE 'Modelo Padrão%'`
    );
    
    console.log(`✅ ${(result as any).affectedRows} modelos removidos com sucesso!`);
  } catch (error: any) {
    console.error("❌ Erro ao remover modelos:", error);
  } finally {
    await connection.end();
  }
}

removerModelosPadrao();

