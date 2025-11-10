import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { setores, empresas, colaboradores, obras } from "./drizzle/schema";

async function verificarDados() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);
    
    const [setoresRows] = await connection.execute("SELECT COUNT(*) as total FROM setores");
    const [empresasRows] = await connection.execute("SELECT COUNT(*) as total FROM empresas");
    const [colaboradoresRows] = await connection.execute("SELECT COUNT(*) as total FROM colaboradores");
    const [obrasRows] = await connection.execute("SELECT COUNT(*) as total FROM obras");
    
    console.log("📊 DADOS SALVOS NO BANCO DE DADOS:");
    console.log(`   ✅ Setores: ${(setoresRows as any[])[0].total}`);
    console.log(`   ✅ Empresas: ${(empresasRows as any[])[0].total}`);
    console.log(`   ✅ Colaboradores: ${(colaboradoresRows as any[])[0].total}`);
    console.log(`   ✅ Obras: ${(obrasRows as any[])[0].total}`);
    console.log("\n✨ Todos os dados estão salvos no banco MySQL!");
    console.log("💾 Os dados permanecerão mesmo após fechar o sistema.");
    
    await connection.end();
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

verificarDados();

