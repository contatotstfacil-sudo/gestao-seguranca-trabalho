import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { colaboradores, cargos, setores } from "./drizzle/schema";
import { eq } from "drizzle-orm";

// Mapeamento de setores para cargos mais apropriados (quando possível)
const mapeamentoSetorCargo: Record<string, string[]> = {
  "Diretoria / Presidência": ["Diretor Geral", "Assistente de Diretoria"],
  "Departamento Financeiro": ["Gerente Financeiro", "Analista Financeiro", "Auxiliar Financeiro"],
  "Recursos Humanos (RH)": ["Coordenador de RH", "Analista de RH", "Assistente de RH"],
  "Departamento Jurídico": ["Advogado", "Auxiliar Jurídico"],
  "Departamento Comercial": ["Gerente Comercial", "Representante de Vendas", "Assistente Comercial"],
  "Marketing e Comunicação": ["Analista de Marketing", "Designer / Social Media"],
  "Compras e Suprimentos": ["Coordenador de Compras", "Comprador", "Auxiliar de Suprimentos"],
  "Almoxarifado / Logística": ["Encarregado de Almoxarifado", "Almoxarife", "Motorista / Entregador"],
  "Tecnologia da Informação (TI)": ["Analista de Suporte", "Técnico de Informática"],
  "Departamento Administrativo": ["Assistente Administrativo", "Recepcionista"],
  "Engenharia de Obras": ["Engenheiro Civil", "Engenheiro de Produção", "Mestre de Obras", "Encarregado de Obra", "Estagiário de Engenharia"],
  "Departamento de Projetos": ["Arquiteto", "Desenhista Técnico", "Estagiário de Projetos"],
  "Planejamento e Controle de Obras (PCO)": ["Engenheiro de Planejamento", "Analista de Controle de Obras"],
  "Segurança do Trabalho (SST)": ["Técnico de Segurança do Trabalho", "Auxiliar de Segurança", "Estagiário de SST"],
  "Qualidade (SGQ)": ["Coordenador de Qualidade", "Inspetor de Qualidade"],
  "Meio Ambiente (SMA)": ["Técnico Ambiental", "Auxiliar de Meio Ambiente"],
  "Topografia": ["Topógrafo", "Auxiliar de Topografia"],
  "Manutenção e Equipamentos": ["Mecânico de Equipamentos", "Eletricista de Manutenção", "Operador de Máquinas", "Auxiliar de Manutenção"],
  "Custos e Orçamentos": ["Engenheiro Orçamentista", "Auxiliar de Custos"],
  "Pós-Obra / Assistência Técnica": ["Encarregado de Assistência Técnica", "Técnico de Manutenção", "Ajudante de Obras"]
};

async function atualizarCargosColaboradores() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);

    console.log("🔄 Iniciando atualização de cargos dos colaboradores...");

    // Buscar todos os colaboradores
    const todosColaboradores = await db.select().from(colaboradores);
    console.log(`📊 Total de colaboradores encontrados: ${todosColaboradores.length}`);

    // Buscar todos os cargos
    const todosCargos = await db.select().from(cargos);
    console.log(`📊 Total de cargos disponíveis: ${todosCargos.length}`);

    if (todosCargos.length === 0) {
      console.log("⚠️  Nenhum cargo encontrado. Cadastre cargos primeiro.");
      return;
    }

    // Criar mapa de cargos por nome
    const cargosPorNome = new Map<string, any>();
    todosCargos.forEach(cargo => {
      cargosPorNome.set(cargo.nomeCargo, cargo);
    });

    // Função para selecionar aleatoriamente um item de um array
    const aleatorio = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    let atualizados = 0;
    let comCargoApropriado = 0;
    let comCargoAleatorio = 0;

    // Atualizar cada colaborador
    for (const colaborador of todosColaboradores) {
      let cargoEscolhido: any = null;

      // Tentar escolher cargo apropriado baseado no setor
      if (colaborador.setorId) {
        const setor = await db.select().from(setores).where(eq(setores.id, colaborador.setorId)).limit(1);
        if (setor.length > 0) {
          const nomeSetor = setor[0].nomeSetor;
          const cargosApropriados = mapeamentoSetorCargo[nomeSetor || ""];
          
          if (cargosApropriados && cargosApropriados.length > 0) {
            // Escolher aleatoriamente entre os cargos apropriados
            const nomeCargoEscolhido = aleatorio(cargosApropriados);
            cargoEscolhido = cargosPorNome.get(nomeCargoEscolhido);
            if (cargoEscolhido) {
              comCargoApropriado++;
            }
          }
        }
      }

      // Se não encontrou cargo apropriado, escolher aleatoriamente
      if (!cargoEscolhido) {
        cargoEscolhido = aleatorio(todosCargos);
        comCargoAleatorio++;
      }

      // Atualizar colaborador apenas se o cargo mudou
      if (colaborador.cargoId !== cargoEscolhido.id) {
        await db.update(colaboradores)
          .set({ cargoId: cargoEscolhido.id })
          .where(eq(colaboradores.id, colaborador.id));
        atualizados++;
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`📊 Resumo:`);
    console.log(`   - ${atualizados} colaborador(es) atualizado(s)`);
    console.log(`   - ${comCargoApropriado} vinculado(s) a cargos apropriados ao setor`);
    console.log(`   - ${comCargoAleatorio} vinculado(s) a cargos aleatórios`);

    // Mostrar distribuição de cargos
    const colaboradoresComCargos = await db.select({
      nome: colaboradores.nomeCompleto,
      cargo: cargos.nomeCargo,
      setor: setores.nomeSetor
    })
      .from(colaboradores)
      .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
      .leftJoin(setores, eq(colaboradores.setorId, setores.id))
      .limit(10);

    console.log(`\n📋 Exemplo de distribuição (primeiros 10):`);
    colaboradoresComCargos.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.nome} → ${c.cargo} (${c.setor})`);
    });

    await connection.end();
  } catch (error) {
    console.error("❌ Erro ao atualizar cargos dos colaboradores:", error);
    process.exit(1);
  }
}

atualizarCargosColaboradores();

