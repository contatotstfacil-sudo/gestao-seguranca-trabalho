import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { responsaveis } from "./drizzle/schema";

async function seedResponsaveis() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada. Configure e rode novamente.");
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);
    
    console.log("🔄 Iniciando cadastro de responsáveis de teste...");
    
    // Cadastrar primeira pessoa
    await db.insert(responsaveis).values({
      nomeCompleto: "João Silva Santos",
      funcao: "Engenheiro de Segurança do Trabalho",
      registroProfissional: "CREA 123456-SP",
      status: "ativo",
    });
    console.log("✅ Responsável 1 cadastrado: João Silva Santos");
    
    // Cadastrar segunda pessoa
    await db.insert(responsaveis).values({
      nomeCompleto: "Maria Oliveira Costa",
      funcao: "Técnica em Segurança do Trabalho",
      registroProfissional: "CREA 789012-RJ",
      status: "ativo",
    });
    console.log("✅ Responsável 2 cadastrado: Maria Oliveira Costa");
    
    console.log("✨ Cadastro concluído com sucesso!");
    console.log("📊 Total: 2 responsáveis cadastrados");
    
    // Listar todos os responsáveis para confirmar
    const todos = await db.select().from(responsaveis);
    console.log(`\n📋 Total de responsáveis no banco: ${todos.length}`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao cadastrar responsáveis:", error);
    process.exit(1);
  }
}

// Executar
seedResponsaveis();

