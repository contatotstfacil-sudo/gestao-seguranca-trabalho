import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function garantirVinculosCargosSetores() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Verificando cargos sem vínculo com setores...");
    
    // Buscar todos os cargos
    const [cargos] = await connection.execute(
      "SELECT id, nomeCargo, empresaId, tenantId FROM cargos"
    );
    const cargosList = cargos as any[];
    console.log(`✅ ${cargosList.length} cargos encontrados`);

    // Buscar todos os setores
    const [setores] = await connection.execute(
      "SELECT id, nomeSetor, empresaId FROM setores"
    );
    const setoresList = setores as any[];
    console.log(`✅ ${setoresList.length} setores encontrados`);

    // Buscar vínculos existentes
    const [vinculos] = await connection.execute(
      "SELECT cargoId, setorId FROM cargoSetores"
    );
    const vinculosList = vinculos as any[];
    const vinculosSet = new Set(vinculosList.map((v: any) => `${v.cargoId}-${v.setorId}`));
    console.log(`✅ ${vinculosList.length} vínculos existentes`);

    // Verificar quais cargos não têm vínculo
    const cargosSemVinculo: any[] = [];
    for (const cargo of cargosList) {
      const temVinculo = vinculosList.some((v: any) => v.cargoId === cargo.id);
      if (!temVinculo) {
        cargosSemVinculo.push(cargo);
      }
    }

    console.log(`\n📊 ${cargosSemVinculo.length} cargos sem vínculo encontrados`);

    if (cargosSemVinculo.length === 0) {
      console.log("✅ Todos os cargos já têm vínculo com setores!");
      return;
    }

    console.log("\n🔄 Criando vínculos para cargos sem vínculo...");
    let vinculosCriados = 0;

    for (const cargo of cargosSemVinculo) {
      // Encontrar setores da mesma empresa
      const setoresDaEmpresa = setoresList.filter((s: any) => s.empresaId === cargo.empresaId);
      
      if (setoresDaEmpresa.length === 0) {
        console.log(`  ⚠️ Cargo "${cargo.nomeCargo}" (ID: ${cargo.id}) não tem setores disponíveis na empresa ${cargo.empresaId}`);
        continue;
      }

      // Mapeamento inteligente baseado no nome do cargo
      const nomeCargoLower = cargo.nomeCargo.toLowerCase();
      let setorEscolhido: any = null;

      if (nomeCargoLower.includes("servente") || nomeCargoLower.includes("carpinteiro") || 
          nomeCargoLower.includes("pedreiro") || nomeCargoLower.includes("gesseiro") || 
          nomeCargoLower.includes("tintor") || nomeCargoLower.includes("pintor")) {
        setorEscolhido = setoresDaEmpresa.find((s: any) => s.nomeSetor === "Obras");
      } else if (nomeCargoLower.includes("engenheiro") || nomeCargoLower.includes("engenharia")) {
        setorEscolhido = setoresDaEmpresa.find((s: any) => s.nomeSetor === "Engenharia");
      } else if (nomeCargoLower.includes("segurança") || nomeCargoLower.includes("técnico de segurança")) {
        setorEscolhido = setoresDaEmpresa.find((s: any) => s.nomeSetor === "Segurança do Trabalho");
      } else if (nomeCargoLower.includes("rh") || nomeCargoLower.includes("recursos humanos") || nomeCargoLower.includes("analista de rh")) {
        setorEscolhido = setoresDaEmpresa.find((s: any) => s.nomeSetor === "Recursos Humanos");
      } else if (nomeCargoLower.includes("coordenador") || nomeCargoLower.includes("gerente")) {
        // Coordenadores e gerentes podem estar em Obras ou Administrativo
        setorEscolhido = setoresDaEmpresa.find((s: any) => s.nomeSetor === "Obras") || 
                        setoresDaEmpresa.find((s: any) => s.nomeSetor === "Administrativo");
      }

      // Se não encontrou mapeamento específico, usar setor aleatório
      if (!setorEscolhido) {
        setorEscolhido = setoresDaEmpresa[Math.floor(Math.random() * setoresDaEmpresa.length)];
      }

      // Criar vínculo
      const chaveVinculo = `${cargo.id}-${setorEscolhido.id}`;
      if (!vinculosSet.has(chaveVinculo)) {
        await connection.execute(
          "INSERT INTO cargoSetores (tenantId, cargoId, setorId, empresaId) VALUES (?, ?, ?, ?)",
          [cargo.tenantId, cargo.id, setorEscolhido.id, cargo.empresaId]
        );
        vinculosSet.add(chaveVinculo);
        vinculosCriados++;
        console.log(`  ✅ Cargo "${cargo.nomeCargo}" vinculado ao setor "${setorEscolhido.nomeSetor}"`);
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   - ${vinculosCriados} vínculos criados`);

    // Estatísticas finais
    const [totalVinculos] = await connection.execute("SELECT COUNT(*) as total FROM cargoSetores");
    console.log(`\n📊 Total de vínculos: ${(totalVinculos as any[])[0].total}`);

  } catch (error) {
    console.error("❌ Erro ao garantir vínculos:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
garantirVinculosCargosSetores()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });










