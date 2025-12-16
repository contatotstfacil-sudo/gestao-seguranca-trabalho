import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";

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

  console.log("🚀 FORÇANDO preenchimento de TODOS os bairros...\n");

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Criar coluna se não existir
    try {
      await connection.execute("SELECT bairroEndereco FROM empresas LIMIT 1");
    } catch {
      console.log("📝 Criando coluna bairroEndereco...");
      await connection.execute("ALTER TABLE empresas ADD COLUMN bairroEndereco VARCHAR(255) NULL");
    }

    // Buscar TODAS as empresas
    const [empresas] = await connection.execute("SELECT id, razaoSocial, bairroEndereco FROM empresas");
    const empresasList = empresas as any[];
    
    console.log(`📊 Encontradas ${empresasList.length} empresas\n`);

    // FORÇAR atualização de TODAS, mesmo as que já têm bairro
    for (const empresa of empresasList) {
      const bairro = bairros[Math.floor(Math.random() * bairros.length)];
      await connection.execute(
        "UPDATE empresas SET bairroEndereco = ? WHERE id = ?",
        [bairro, empresa.id]
      );
      console.log(`✅ ID ${empresa.id} - ${empresa.razaoSocial}: ${bairro}`);
    }

    // Verificar se foi salvo
    console.log("\n🔍 Verificando se foi salvo...");
    const [verificacao] = await connection.execute("SELECT id, razaoSocial, bairroEndereco FROM empresas");
    for (const emp of verificacao as any[]) {
      console.log(`   ID ${emp.id}: ${emp.bairroEndereco || "❌ VAZIO"}`);
    }

    await connection.end();
    console.log("\n✅ CONCLUÍDO! Todos os bairros foram forçados!");
    
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();















