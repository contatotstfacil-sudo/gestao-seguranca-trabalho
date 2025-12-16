import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";

// Carregar .env.local se existir
const envLocalPath = resolve(process.cwd(), ".env.local");
config({ path: envLocalPath });
config();

const bairros = [
  "Centro", "Jardim das Flores", "Vila Nova", "Bela Vista", "Parque Industrial",
  "Jardim América", "Vila Esperança", "Centro Comercial", "Jardim Primavera",
  "Vila São Paulo", "Parque das Árvores", "Jardim dos Estados", "Vila Progresso",
  "Centro Empresarial", "Jardim Europa", "Vila Mariana", "Parque Residencial",
  "Jardim Paulista", "Vila Madalena", "Centro Histórico", "Jardim Botânico",
  "Vila Olímpia", "Parque Verde", "Jardim das Acácias", "Vila Formosa",
  "Centro Cívico", "Jardim das Rosas", "Vila Nova Conceição", "Parque dos Pássaros",
  "Jardim das Palmeiras"
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  console.log("🚀 Forçando preenchimento de bairros...");

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Verificar se coluna existe, criar se não existir
    try {
      await connection.execute("SELECT bairroEndereco FROM empresas LIMIT 1");
    } catch {
      console.log("📝 Criando coluna bairroEndereco...");
      await connection.execute("ALTER TABLE empresas ADD COLUMN bairroEndereco VARCHAR(255) NULL");
    }

    // Buscar todas as empresas
    const [empresas] = await connection.execute("SELECT id, razaoSocial FROM empresas");
    
    console.log(`📊 Encontradas ${(empresas as any[]).length} empresas`);

    // Atualizar TODAS as empresas com bairros aleatórios
    for (const empresa of empresas as any[]) {
      const bairro = bairros[Math.floor(Math.random() * bairros.length)];
      await connection.execute(
        "UPDATE empresas SET bairroEndereco = ? WHERE id = ?",
        [bairro, empresa.id]
      );
      console.log(`✅ ${empresa.razaoSocial}: ${bairro}`);
    }

    await connection.end();
    console.log("\n✅ TODOS os bairros foram preenchidos com sucesso!");
    
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();















