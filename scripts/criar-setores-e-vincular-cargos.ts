import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Setores padrão para construção civil
const SETORES_PADRAO = [
  { nome: "Obras", descricao: "Setor responsável pelas atividades de campo e execução de obras" },
  { nome: "Administrativo", descricao: "Setor responsável pelas atividades administrativas e de gestão" },
  { nome: "Segurança do Trabalho", descricao: "Setor responsável pela segurança e saúde ocupacional" },
  { nome: "Recursos Humanos", descricao: "Setor responsável pela gestão de pessoas e recrutamento" },
  { nome: "Engenharia", descricao: "Setor responsável pelo planejamento e projetos de engenharia" },
  { nome: "Qualidade", descricao: "Setor responsável pelo controle de qualidade das obras" },
  { nome: "Compras", descricao: "Setor responsável pelas compras e suprimentos" },
  { nome: "Manutenção", descricao: "Setor responsável pela manutenção de equipamentos e instalações" },
];

async function criarSetoresEVincularCargos() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🔄 Verificando setores existentes...");
    const [setoresExistentes] = await connection.execute("SELECT id, nomeSetor, empresaId FROM setores");
    const setoresList = setoresExistentes as any[];
    
    console.log(`✅ ${setoresList.length} setores encontrados`);

    // Buscar todas as empresas
    console.log("🔄 Buscando empresas...");
    const [empresas] = await connection.execute("SELECT id, tenantId FROM empresas");
    const empresasList = empresas as any[];
    console.log(`✅ ${empresasList.length} empresas encontradas`);

    // Criar setores para cada empresa se não existirem
    let setoresCriados = 0;
    const setoresPorEmpresa: { [key: number]: any[] } = {};

    for (const empresa of empresasList) {
      setoresPorEmpresa[empresa.id] = [];

      // Verificar se já existem setores para esta empresa
      const setoresDaEmpresa = setoresList.filter((s: any) => s.empresaId === empresa.id);
      
      if (setoresDaEmpresa.length === 0) {
        console.log(`\n🔄 Criando setores para empresa ID ${empresa.id}...`);
        
        for (const setorPadrao of SETORES_PADRAO) {
          const [result] = await connection.execute(
            "INSERT INTO setores (tenantId, nomeSetor, descricao, empresaId) VALUES (?, ?, ?, ?)",
            [empresa.tenantId, setorPadrao.nome, setorPadrao.descricao, empresa.id]
          );
          const insertId = (result as any).insertId;
          setoresPorEmpresa[empresa.id].push({ id: insertId, nome: setorPadrao.nome });
          setoresCriados++;
          console.log(`  ✅ Setor criado: ${setorPadrao.nome} (ID: ${insertId})`);
        }
      } else {
        console.log(`\n✅ Empresa ID ${empresa.id} já possui ${setoresDaEmpresa.length} setores`);
        setoresPorEmpresa[empresa.id] = setoresDaEmpresa.map((s: any) => ({ id: s.id, nome: s.nomeSetor }));
      }
    }

    // Buscar todos os setores atualizados (incluindo os recém-criados)
    const [todosSetores] = await connection.execute("SELECT id, nomeSetor, empresaId, tenantId FROM setores");
    const todosSetoresList = todosSetores as any[];

    console.log(`\n🔄 Buscando cargos...`);
    const [cargos] = await connection.execute("SELECT id, nomeCargo, empresaId, tenantId FROM cargos");
    const cargosList = cargos as any[];
    console.log(`✅ ${cargosList.length} cargos encontrados`);

    // Verificar vínculos existentes
    console.log(`\n🔄 Verificando vínculos existentes...`);
    const [vinculosExistentes] = await connection.execute("SELECT cargoId, setorId FROM cargoSetores");
    const vinculosList = vinculosExistentes as any[];
    const vinculosSet = new Set(vinculosList.map((v: any) => `${v.cargoId}-${v.setorId}`));
    console.log(`✅ ${vinculosList.length} vínculos existentes encontrados`);

    // Vincular cargos aos setores
    console.log(`\n🔄 Vinculando cargos aos setores...`);
    let vinculosCriados = 0;

    // Mapeamento de cargos para setores (baseado no nome do cargo)
    const mapeamentoCargoSetor: { [key: string]: string[] } = {
      "servente": ["Obras"],
      "carpinteiro": ["Obras"],
      "pedreiro": ["Obras"],
      "gesseiro": ["Obras"],
      "tintor": ["Obras"],
      "pintor": ["Obras"],
      "engenheiro": ["Engenharia"],
      "coordenador": ["Obras", "Engenharia"],
      "gerente": ["Obras", "Administrativo"],
      "técnico de segurança": ["Segurança do Trabalho"],
      "analista de rh": ["Recursos Humanos"],
      "estagiário": ["Administrativo", "Recursos Humanos", "Engenharia", "Segurança do Trabalho"],
    };

    for (const cargo of cargosList) {
      const nomeCargoLower = cargo.nomeCargo.toLowerCase();
      
      // Encontrar setores da mesma empresa
      const setoresDaEmpresa = todosSetoresList.filter((s: any) => s.empresaId === cargo.empresaId);
      
      if (setoresDaEmpresa.length === 0) {
        console.log(`  ⚠️ Cargo "${cargo.nomeCargo}" (ID: ${cargo.id}) não tem setores disponíveis na empresa ${cargo.empresaId}`);
        continue;
      }

      // Determinar quais setores vincular baseado no nome do cargo
      let setoresParaVincular: any[] = [];
      
      for (const [palavraChave, nomesSetores] of Object.entries(mapeamentoCargoSetor)) {
        if (nomeCargoLower.includes(palavraChave)) {
          for (const nomeSetor of nomesSetores) {
            const setor = setoresDaEmpresa.find((s: any) => s.nomeSetor === nomeSetor);
            if (setor && !setoresParaVincular.find(s => s.id === setor.id)) {
              setoresParaVincular.push(setor);
            }
          }
        }
      }

      // Se não encontrou mapeamento específico, vincular a um setor aleatório da empresa
      if (setoresParaVincular.length === 0) {
        const setorAleatorio = setoresDaEmpresa[Math.floor(Math.random() * setoresDaEmpresa.length)];
        setoresParaVincular = [setorAleatorio];
      }

      // Criar vínculos
      for (const setor of setoresParaVincular) {
        const chaveVinculo = `${cargo.id}-${setor.id}`;
        
        if (!vinculosSet.has(chaveVinculo)) {
          await connection.execute(
            "INSERT INTO cargoSetores (tenantId, cargoId, setorId, empresaId) VALUES (?, ?, ?, ?)",
            [cargo.tenantId, cargo.id, setor.id, cargo.empresaId]
          );
          vinculosSet.add(chaveVinculo);
          vinculosCriados++;
        }
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   - ${setoresCriados} setores criados`);
    console.log(`   - ${vinculosCriados} vínculos criados entre cargos e setores`);

    // Estatísticas finais
    const [totalSetores] = await connection.execute("SELECT COUNT(*) as total FROM setores");
    const [totalVinculos] = await connection.execute("SELECT COUNT(*) as total FROM cargoSetores");
    console.log(`\n📊 Estatísticas finais:`);
    console.log(`   - Total de setores: ${(totalSetores as any[])[0].total}`);
    console.log(`   - Total de vínculos: ${(totalVinculos as any[])[0].total}`);

  } catch (error) {
    console.error("❌ Erro ao criar setores e vincular cargos:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
criarSetoresEVincularCargos()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });










