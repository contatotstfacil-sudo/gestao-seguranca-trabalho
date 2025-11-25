import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { colaboradores, asos } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("postgresql://usuario:senha@host:porta/nomedobanco")) {
    console.error("❌ Erro: DATABASE_URL não configurada ou é um placeholder.");
    console.error("   Configure o arquivo .env com a URL real do MySQL.");
    process.exit(1);
  }

  console.log("🔗 Conectando ao banco de dados...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("🚀 Iniciando adição de ASOs admissionais para colaboradores...\n");

    // Buscar todos os colaboradores
    const todosColaboradores = await db.select().from(colaboradores);
    console.log(`📋 Total de colaboradores encontrados: ${todosColaboradores.length}\n`);

    if (todosColaboradores.length === 0) {
      console.log("⚠️  Nenhum colaborador encontrado. Nada a fazer.");
      await connection.end();
      return;
    }

    let asosCriados = 0;
    let asosJaExistentes = 0;
    let colaboradoresSemDataAdmissao = 0;
    let erros = 0;

    for (const colaborador of todosColaboradores) {
      try {
        // Verificar se o colaborador tem data de admissão
        if (!colaborador.dataAdmissao) {
          console.log(`⚠️  Colaborador ${colaborador.id} (${colaborador.nomeCompleto}) não tem data de admissão. Pulando...`);
          colaboradoresSemDataAdmissao++;
          continue;
        }

        // Verificar se já existe ASO admissional para este colaborador
        const asosExistentes = await db
          .select()
          .from(asos)
          .where(
            and(
              eq(asos.tenantId, colaborador.tenantId),
              eq(asos.colaboradorId, colaborador.id),
              eq(asos.tipoAso, "admissional")
            )
          );

        if (asosExistentes.length > 0) {
          console.log(`✓ Colaborador ${colaborador.id} (${colaborador.nomeCompleto}) já possui ASO admissional.`);
          asosJaExistentes++;
          continue;
        }

        // Calcular data de emissão (2 dias antes da admissão)
        const dataAdmissao = new Date(colaborador.dataAdmissao);
        const dataEmissao = new Date(dataAdmissao);
        dataEmissao.setDate(dataEmissao.getDate() - 2);
        dataEmissao.setHours(0, 0, 0, 0);

        // Calcular data de validade (1 ano a partir da data de emissão do primeiro ASO)
        const dataValidade = new Date(dataEmissao);
        dataValidade.setFullYear(dataValidade.getFullYear() + 1);
        dataValidade.setHours(23, 59, 59, 999);

        // Verificar status (ativo ou vencido)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const status = dataValidade < hoje ? "vencido" : "ativo";

        // Criar ASO admissional
        const asoData = {
          tenantId: colaborador.tenantId,
          colaboradorId: colaborador.id,
          empresaId: colaborador.empresaId,
          numeroAso: null,
          tipoAso: "admissional" as const,
          dataEmissao: dataEmissao,
          dataValidade: dataValidade,
          medicoResponsavel: null,
          clinicaMedica: null,
          crmMedico: null,
          apto: "sim" as const,
          restricoes: null,
          observacoes: "ASO admissional criado automaticamente durante migração de dados.",
          anexoUrl: null,
          status: status as "ativo" | "vencido",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result: any = await db.insert(asos).values(asoData);
        const insertId = result?.insertId ?? (Array.isArray(result) ? result[0]?.insertId : undefined);

        if (insertId) {
          console.log(
            `✅ ASO admissional criado para colaborador ${colaborador.id} (${colaborador.nomeCompleto}) - ` +
            `Emissão: ${dataEmissao.toLocaleDateString("pt-BR")}, ` +
            `Validade: ${dataValidade.toLocaleDateString("pt-BR")}, ` +
            `Status: ${status}`
          );
          asosCriados++;
        } else {
          console.error(`❌ Erro ao criar ASO para colaborador ${colaborador.id}: insertId não encontrado`);
          erros++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar colaborador ${colaborador.id} (${colaborador.nomeCompleto}):`, error.message);
        erros++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Resumo da execução:");
    console.log(`   ✅ ASOs criados: ${asosCriados}`);
    console.log(`   ⏭️  ASOs já existentes: ${asosJaExistentes}`);
    console.log(`   ⚠️  Colaboradores sem data de admissão: ${colaboradoresSemDataAdmissao}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log("=".repeat(60));
    console.log("\n🎉 Processo concluído!");

  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

