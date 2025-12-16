import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function forcarCargosTodos() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Buscando todos os colaboradores...");
    const [colaboradores] = await connection.execute(
      "SELECT id FROM colaboradores ORDER BY id"
    );
    const colaboradoresList = colaboradores as any[];
    
    console.log(`✅ ${colaboradoresList.length} colaboradores encontrados`);

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

    console.log("🔄 FORÇANDO atualização de cargos e setores em TODOS os colaboradores...");

    let atualizados = 0;

    for (const colab of colaboradoresList) {
      // Sempre atribuir um cargo aleatório
      const cargoId = cargosList[Math.floor(Math.random() * cargosList.length)].id;
      
      // Atribuir setor se houver setores disponíveis
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
        console.log(`✅ ${atualizados}/${colaboradoresList.length} colaboradores atualizados...`);
      }
    }

    console.log(`\n✅ ${atualizados} colaboradores atualizados com sucesso!`);
    console.log(`   - Todos os colaboradores agora têm cargo atribuído`);

    // Verificar resultado
    const [verificacao] = await connection.execute(
      "SELECT COUNT(*) as total, COUNT(cargoId) as comCargo FROM colaboradores"
    );
    const resultado = (verificacao as any[])[0];
    console.log(`\n📊 Verificação:`);
    console.log(`   - Total de colaboradores: ${resultado.total}`);
    console.log(`   - Colaboradores com cargo: ${resultado.comCargo}`);

  } catch (error) {
    console.error("❌ Erro ao atualizar cargos:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
forcarCargosTodos()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });










