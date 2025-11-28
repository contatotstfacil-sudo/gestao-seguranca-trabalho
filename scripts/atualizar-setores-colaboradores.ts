import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function atualizarSetoresColaboradores() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Buscando colaboradores sem setor...");
    const [colaboradoresSemSetor] = await connection.execute(
      "SELECT id, empresaId, cargoId FROM colaboradores WHERE setorId IS NULL"
    );
    const colaboradores = colaboradoresSemSetor as any[];
    
    console.log(`✅ ${colaboradores.length} colaboradores sem setor encontrados`);

    if (colaboradores.length === 0) {
      console.log("✅ Todos os colaboradores já têm setor atribuído!");
      return;
    }

    console.log("🔄 Buscando vínculos cargo-setor...");
    const [vinculos] = await connection.execute(
      "SELECT cargoId, setorId FROM cargoSetores"
    );
    const vinculosList = vinculos as any[];
    
    // Criar mapa de cargoId -> setorId[]
    const mapaCargoSetor: { [key: number]: number[] } = {};
    for (const vinculo of vinculosList) {
      if (!mapaCargoSetor[vinculo.cargoId]) {
        mapaCargoSetor[vinculo.cargoId] = [];
      }
      mapaCargoSetor[vinculo.cargoId].push(vinculo.setorId);
    }

    console.log(`✅ ${Object.keys(mapaCargoSetor).length} cargos com setores vinculados`);

    console.log("🔄 Buscando setores por empresa...");
    const [setores] = await connection.execute(
      "SELECT id, empresaId FROM setores"
    );
    const setoresList = setores as any[];
    
    // Criar mapa de empresaId -> setorId[]
    const mapaEmpresaSetor: { [key: number]: number[] } = {};
    for (const setor of setoresList) {
      if (!mapaEmpresaSetor[setor.empresaId]) {
        mapaEmpresaSetor[setor.empresaId] = [];
      }
      mapaEmpresaSetor[setor.empresaId].push(setor.id);
    }

    console.log("🔄 Atribuindo setores aos colaboradores...");

    let atualizados = 0;
    let semSetorDisponivel = 0;

    for (const colab of colaboradores) {
      let setorId: number | null = null;

      // Tentar encontrar setor através do vínculo cargo-setor
      if (colab.cargoId && mapaCargoSetor[colab.cargoId]) {
        const setoresDoCargo = mapaCargoSetor[colab.cargoId];
        // Filtrar apenas setores da mesma empresa
        const setoresDaEmpresa = setoresDoCargo.filter((sid: number) => {
          const setor = setoresList.find((s: any) => s.id === sid && s.empresaId === colab.empresaId);
          return setor !== undefined;
        });
        
        if (setoresDaEmpresa.length > 0) {
          // Escolher um setor aleatório dos disponíveis
          setorId = setoresDaEmpresa[Math.floor(Math.random() * setoresDaEmpresa.length)];
        }
      }

      // Se não encontrou pelo cargo, usar qualquer setor da empresa
      if (!setorId && mapaEmpresaSetor[colab.empresaId]) {
        const setoresDaEmpresa = mapaEmpresaSetor[colab.empresaId];
        setorId = setoresDaEmpresa[Math.floor(Math.random() * setoresDaEmpresa.length)];
      }

      if (setorId) {
        await connection.execute(
          "UPDATE colaboradores SET setorId = ? WHERE id = ?",
          [setorId, colab.id]
        );
        atualizados++;
      } else {
        semSetorDisponivel++;
        console.log(`  ⚠️ Colaborador ID ${colab.id} não pôde receber setor (empresa ${colab.empresaId} sem setores)`);
      }

      if (atualizados % 100 === 0) {
        console.log(`✅ ${atualizados}/${colaboradores.length} colaboradores atualizados...`);
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   - ${atualizados} colaboradores atualizados com setor`);
    if (semSetorDisponivel > 0) {
      console.log(`   - ⚠️ ${semSetorDisponivel} colaboradores não puderam receber setor`);
    }

    // Verificação final
    const [verificacao] = await connection.execute(
      "SELECT COUNT(*) as total, COUNT(setorId) as comSetor FROM colaboradores"
    );
    const resultado = (verificacao as any[])[0];
    console.log(`\n📊 Verificação:`);
    console.log(`   - Total de colaboradores: ${resultado.total}`);
    console.log(`   - Colaboradores com setor: ${resultado.comSetor}`);

  } catch (error) {
    console.error("❌ Erro ao atualizar setores:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
atualizarSetoresColaboradores()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

