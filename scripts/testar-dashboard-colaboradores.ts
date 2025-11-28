import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function testarDashboard() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Testando Dashboard de Colaboradores...\n");

    // 1. Buscar todas as empresas
    console.log("1️⃣ Buscando empresas...");
    const [empresas] = await connection.execute("SELECT id, razaoSocial FROM empresas LIMIT 10");
    const empresasList = empresas as any[];
    console.log(`✅ ${empresasList.length} empresas encontradas\n`);

    if (empresasList.length === 0) {
      console.log("❌ Nenhuma empresa encontrada!");
      return;
    }

    // 2. Para cada empresa, buscar estatísticas
    for (const empresa of empresasList) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📊 TESTANDO EMPRESA: ${empresa.razaoSocial} (ID: ${empresa.id})`);
      console.log(`${"=".repeat(60)}`);

      // Buscar total de colaboradores da empresa
      const [totalRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ?",
        [empresa.id]
      );
      const total = (totalRows as any[])[0]?.total || 0;

      // Buscar colaboradores ativos
      const [ativosRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ? AND status = 'ativo'",
        [empresa.id]
      );
      const ativos = (ativosRows as any[])[0]?.total || 0;

      // Buscar colaboradores inativos
      const [inativosRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ? AND status = 'inativo'",
        [empresa.id]
      );
      const inativos = (inativosRows as any[])[0]?.total || 0;

      // Buscar total de homens
      const [homensRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ? AND sexo = 'masculino'",
        [empresa.id]
      );
      const homens = (homensRows as any[])[0]?.total || 0;

      // Buscar total de mulheres
      const [mulheresRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ? AND sexo = 'feminino'",
        [empresa.id]
      );
      const mulheres = (mulheresRows as any[])[0]?.total || 0;

      // Calcular percentuais
      const percentualHomens = total > 0 ? Math.round((Number(homens) / total) * 100) : 0;
      const percentualMulheres = total > 0 ? Math.round((Number(mulheres) / total) * 100) : 0;
      const taxaAtividade = total > 0 ? Math.round((Number(ativos) / total) * 100) : 0;

      console.log(`\n📈 ESTATÍSTICAS DA EMPRESA:`);
      console.log(`   Total de Colaboradores: ${total}`);
      console.log(`   Ativos: ${ativos}`);
      console.log(`   Inativos: ${inativos}`);
      console.log(`   Taxa de Atividade: ${taxaAtividade}%`);
      console.log(`   Homens: ${homens} (${percentualHomens}%)`);
      console.log(`   Mulheres: ${mulheres} (${percentualMulheres}%)`);

      // Top 5 cargos
      const [topCargosRows] = await connection.execute(
        `SELECT car.nomeCargo as funcao, COUNT(c.id) as count
         FROM colaboradores c
         LEFT JOIN cargos car ON c.cargoId = car.id
         WHERE c.empresaId = ?
         GROUP BY car.nomeCargo
         ORDER BY count DESC
         LIMIT 5`,
        [empresa.id]
      );
      const topCargos = topCargosRows as any[];
      
      if (topCargos.length > 0) {
        console.log(`\n🏆 TOP 5 CARGOS:`);
        topCargos.forEach((cargo, index) => {
          console.log(`   ${index + 1}. ${cargo.funcao || "Sem cargo"}: ${cargo.count} colaborador(es)`);
        });
      }

      // Top 5 setores
      const [topSetoresRows] = await connection.execute(
        `SELECT s.nomeSetor as setor, COUNT(c.id) as count
         FROM colaboradores c
         LEFT JOIN setores s ON c.setorId = s.id
         WHERE c.empresaId = ?
         GROUP BY s.nomeSetor
         ORDER BY count DESC
         LIMIT 5`,
        [empresa.id]
      );
      const topSetores = topSetoresRows as any[];
      
      if (topSetores.length > 0) {
        console.log(`\n🏢 TOP 5 SETORES:`);
        topSetores.forEach((setor, index) => {
          console.log(`   ${index + 1}. ${setor.setor || "Sem setor"}: ${setor.count} colaborador(es)`);
        });
      }

      console.log(`\n✅ Teste da empresa ${empresa.razaoSocial} concluído!\n`);
    }

    // 3. Testar sem filtro (todas as empresas)
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 TESTANDO SEM FILTRO (TODAS AS EMPRESAS)`);
    console.log(`${"=".repeat(60)}`);

    const [totalGeralRows] = await connection.execute("SELECT COUNT(*) as total FROM colaboradores");
    const totalGeral = (totalGeralRows as any[])[0]?.total || 0;

    const [ativosGeralRows] = await connection.execute(
      "SELECT COUNT(*) as total FROM colaboradores WHERE status = 'ativo'"
    );
    const ativosGeral = (ativosGeralRows as any[])[0]?.total || 0;

    console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
    console.log(`   Total de Colaboradores: ${totalGeral}`);
    console.log(`   Ativos: ${ativosGeral}`);
    console.log(`   Inativos: ${totalGeral - ativosGeral}`);

    console.log(`\n✅ Todos os testes concluídos!`);
    console.log(`\n💡 Se os dados acima estão corretos, o problema está no frontend.`);
    console.log(`💡 Se os dados estão incorretos, o problema está no backend.`);

  } catch (error) {
    console.error("❌ Erro ao testar dashboard:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
testarDashboard()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

