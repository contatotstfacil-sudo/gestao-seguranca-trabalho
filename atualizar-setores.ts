import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { setores } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const SETORES_OFICIAIS = [
  "Diretoria / Presidência",
  "Departamento Financeiro",
  "Recursos Humanos (RH)",
  "Departamento Jurídico",
  "Departamento Comercial",
  "Marketing e Comunicação",
  "Compras e Suprimentos",
  "Almoxarifado / Logística",
  "Tecnologia da Informação (TI)",
  "Departamento Administrativo",
  "Engenharia de Obras",
  "Departamento de Projetos",
  "Planejamento e Controle de Obras (PCO)",
  "Segurança do Trabalho (SST)",
  "Qualidade (SGQ)",
  "Meio Ambiente (SMA)",
  "Topografia",
  "Manutenção e Equipamentos",
  "Custos e Orçamentos",
  "Pós-Obra / Assistência Técnica"
];

async function atualizarSetores() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);

    console.log("🔄 Iniciando atualização de setores...");

    // Buscar todos os setores existentes
    const setoresExistentes = await db.select().from(setores);
    console.log(`📊 Setores existentes: ${setoresExistentes.length}`);

    // Buscar IDs dos setores que devem ser mantidos
    const setoresParaManter = new Set<string>();
    const setoresParaCriar: string[] = [];

    // Verificar quais setores já existem
    for (const nomeSetor of SETORES_OFICIAIS) {
      const existe = setoresExistentes.find(s => s.nomeSetor === nomeSetor);
      if (existe) {
        setoresParaManter.add(nomeSetor);
      } else {
        setoresParaCriar.push(nomeSetor);
      }
    }

    // Criar setores que não existem
    if (setoresParaCriar.length > 0) {
      console.log(`➕ Criando ${setoresParaCriar.length} novo(s) setor(es)...`);
      for (const nomeSetor of setoresParaCriar) {
        await db.insert(setores).values({
          nomeSetor,
          descricao: `Setor responsável por ${nomeSetor.toLowerCase()}`
        });
        console.log(`   ✅ Criado: ${nomeSetor}`);
      }
    }

    // Identificar setores que não estão na lista oficial e devem ser removidos
    const setoresParaRemover = setoresExistentes.filter(
      s => !SETORES_OFICIAIS.includes(s.nomeSetor)
    );

    if (setoresParaRemover.length > 0) {
      console.log(`🗑️  Removendo ${setoresParaRemover.length} setor(es) que não estão na lista oficial...`);
      for (const setor of setoresParaRemover) {
        await db.delete(setores).where(eq(setores.id, setor.id));
        console.log(`   ❌ Removido: ${setor.nomeSetor}`);
      }
    }

    // Verificar se algum setor precisa ter o nome atualizado (caso tenha diferença de capitalização, etc)
    for (const nomeSetor of SETORES_OFICIAIS) {
      const existe = setoresExistentes.find(s => s.nomeSetor === nomeSetor);
      if (existe && existe.nomeSetor !== nomeSetor) {
        await db.update(setores)
          .set({ nomeSetor })
          .where(eq(setores.id, existe.id));
        console.log(`   ✏️  Atualizado: ${existe.nomeSetor} → ${nomeSetor}`);
      }
    }

    // Listar todos os setores finais
    const setoresFinais = await db.select().from(setores).orderBy(setores.nomeSetor);
    console.log(`\n✅ Processo concluído!`);
    console.log(`📋 Total de setores cadastrados: ${setoresFinais.length}`);
    console.log(`\n📝 Lista de setores:`);
    setoresFinais.forEach((setor, index) => {
      console.log(`   ${index + 1}. ${setor.nomeSetor}`);
    });

    await connection.end();
  } catch (error) {
    console.error("❌ Erro ao atualizar setores:", error);
    process.exit(1);
  }
}

atualizarSetores();

