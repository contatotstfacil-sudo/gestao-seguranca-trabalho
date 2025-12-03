import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function preencherCargos() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Buscando colaboradores sem cargo...");
    const [colaboradoresSemCargo] = await connection.execute(
      "SELECT id, empresaId FROM colaboradores WHERE cargoId IS NULL"
    );
    const colaboradores = colaboradoresSemCargo as any[];
    
    console.log(`✅ ${colaboradores.length} colaboradores sem cargo encontrados`);

    if (colaboradores.length === 0) {
      console.log("✅ Todos os colaboradores já têm cargo atribuído!");
      return;
    }

    console.log("🔄 Buscando cargos...");
    const [cargos] = await connection.execute("SELECT id FROM cargos ORDER BY id");
    const cargosList = cargos as any[];
    
    if (cargosList.length === 0) {
      throw new Error("Nenhum cargo encontrado. Cadastre cargos primeiro.");
    }

    console.log(`✅ ${cargosList.length} cargos encontrados`);

    console.log("🔄 Buscando setores...");
    const [setores] = await connection.execute("SELECT id FROM setores ORDER BY id");
    const setoresList = setores as any[];
    console.log(`✅ ${setoresList.length} setores encontrados`);

    console.log("🔄 Atribuindo cargos e setores aos colaboradores...");

    let atualizados = 0;
    for (const colab of colaboradores) {
      // Escolher cargo aleatório
      const cargoId = cargosList[Math.floor(Math.random() * cargosList.length)].id;
      
      // Escolher setor aleatório (se houver setores)
      const setorId = setoresList.length > 0 
        ? setoresList[Math.floor(Math.random() * setoresList.length)].id 
        : null;

      // Atualizar colaborador
      if (setorId) {
        await connection.execute(
          "UPDATE colaboradores SET cargoId = ?, setorId = ? WHERE id = ?",
          [cargoId, setorId, colab.id]
        );
      } else {
        await connection.execute(
          "UPDATE colaboradores SET cargoId = ? WHERE id = ?",
          [cargoId, colab.id]
        );
      }

      atualizados++;
      if (atualizados % 100 === 0) {
        console.log(`✅ ${atualizados}/${colaboradores.length} colaboradores atualizados...`);
      }
    }

    console.log(`\n✅ ${atualizados} colaboradores atualizados com sucesso!`);
    console.log(`   - Cargos atribuídos`);
    console.log(`   - Setores atribuídos (quando disponível)`);

  } catch (error) {
    console.error("❌ Erro ao preencher cargos:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
preencherCargos()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });









