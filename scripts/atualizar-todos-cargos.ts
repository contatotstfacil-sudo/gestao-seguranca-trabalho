import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function atualizarTodosCargos() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Buscando todos os colaboradores...");
    const [colaboradores] = await connection.execute(
      "SELECT id, cargoId, setorId FROM colaboradores ORDER BY id"
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

    console.log("🔄 Atribuindo cargos e setores a TODOS os colaboradores...");

    let atualizados = 0;
    let semCargo = 0;
    let semSetor = 0;

    for (const colab of colaboradoresList) {
      let precisaAtualizar = false;
      let cargoId = colab.cargoId;
      let setorId = colab.setorId;

      // Se não tem cargo, atribuir um
      if (!cargoId) {
        cargoId = cargosList[Math.floor(Math.random() * cargosList.length)].id;
        precisaAtualizar = true;
        semCargo++;
      }

      // Se não tem setor e há setores disponíveis, atribuir um
      if (!setorId && setoresList.length > 0) {
        setorId = setoresList[Math.floor(Math.random() * setoresList.length)].id;
        precisaAtualizar = true;
        semSetor++;
      }

      // Atualizar se necessário
      if (precisaAtualizar) {
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
      }

      if ((atualizados + colaboradoresList.length - semCargo - semSetor) % 100 === 0) {
        console.log(`✅ Processando... ${atualizados} atualizados`);
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   - ${atualizados} colaboradores atualizados`);
    console.log(`   - ${semCargo} colaboradores receberam cargo`);
    console.log(`   - ${semSetor} colaboradores receberam setor`);

  } catch (error) {
    console.error("❌ Erro ao atualizar cargos:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
atualizarTodosCargos()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });







