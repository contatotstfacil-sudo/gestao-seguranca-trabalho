import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { colaboradores, cargos, setores } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function vincularColaboradores() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);

    console.log("🔄 Iniciando vinculação de colaboradores aos setores e cargos...");

    // Buscar todos os colaboradores
    const todosColaboradores = await db.select().from(colaboradores);
    console.log(`📊 Total de colaboradores encontrados: ${todosColaboradores.length}`);

    // Buscar todos os setores e cargos
    const todosSetores = await db.select().from(setores);
    const todosCargos = await db.select().from(cargos);

    console.log(`📊 Total de setores: ${todosSetores.length}`);
    console.log(`📊 Total de cargos: ${todosCargos.length}`);

    if (todosSetores.length === 0) {
      console.log("⚠️  Nenhum setor encontrado. Cadastre setores primeiro.");
      return;
    }

    if (todosCargos.length === 0) {
      console.log("⚠️  Nenhum cargo encontrado. Cadastre cargos primeiro.");
      return;
    }

    // Função para selecionar aleatoriamente um item de um array
    const aleatorio = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    let vinculados = 0;
    let comSetor = 0;
    let comCargo = 0;

    // Vincular cada colaborador a um setor e cargo aleatórios
    for (const colaborador of todosColaboradores) {
      const atualizacao: any = {};

      // Vincular setor (se ainda não tiver)
      if (!colaborador.setorId && todosSetores.length > 0) {
        const setorAleatorio = aleatorio(todosSetores);
        atualizacao.setorId = setorAleatorio.id;
        comSetor++;
      }

      // Vincular cargo (se ainda não tiver)
      if (!colaborador.cargoId && todosCargos.length > 0) {
        const cargoAleatorio = aleatorio(todosCargos);
        atualizacao.cargoId = cargoAleatorio.id;
        comCargo++;
      }

      // Atualizar apenas se houver algo para atualizar
      if (Object.keys(atualizacao).length > 0) {
        await db.update(colaboradores)
          .set(atualizacao)
          .where(eq(colaboradores.id, colaborador.id));
        vinculados++;
      }
    }

    console.log(`✅ Processo concluído!`);
    console.log(`   - ${vinculados} colaborador(es) atualizado(s)`);
    console.log(`   - ${comSetor} vinculado(s) a setores`);
    console.log(`   - ${comCargo} vinculado(s) a cargos`);

    await connection.end();
  } catch (error) {
    console.error("❌ Erro ao vincular colaboradores:", error);
    process.exit(1);
  }
}

vincularColaboradores();

