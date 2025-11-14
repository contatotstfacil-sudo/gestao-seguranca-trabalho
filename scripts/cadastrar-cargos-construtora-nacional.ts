import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, like, or } from "drizzle-orm";
import {
  cargos,
  cargoSetores,
  empresas,
  setores,
} from "../drizzle/schema";

const NOVOS_CARGOS = [
  "Coordenador de Planejamento Tático",
  "Supervisor de Obras Prediais",
  "Analista de Segurança Operacional",
  "Encarregado de Montagem Industrial",
  "Especialista em Equipamentos Pesados",
  "Técnico de Logística de Canteiro",
  "Gestor de Qualidade de Obras",
  "Assistente de Produção Civil",
  "Coordenador de Equipes de Campo",
  "Analista de Documentação Técnica",
];

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  try {
    const [colunas] = await connection.query(
      "SHOW COLUMNS FROM cargos LIKE 'codigoCbo'"
    );

    if (Array.isArray(colunas) && colunas.length === 0) {
      await connection.query(
        "ALTER TABLE cargos ADD COLUMN codigoCbo VARCHAR(20) NULL"
      );
    }

    await connection.query(
      "ALTER TABLE cargos MODIFY COLUMN codigoCbo VARCHAR(20) NULL"
    );

    const empresasEncontradas = await db
      .select()
      .from(empresas)
      .where(
        or(
          like(empresas.razaoSocial, "%Construtora Nacional%"),
          like(empresas.razaoSocial, "%Nacional Constru%")
        )
      );

    if (!empresasEncontradas.length) {
      throw new Error("Empresa contendo 'Construtora Nacional' não encontrada.");
    }

    let empresaAlvo: typeof empresasEncontradas[number] | null = null;
    let setoresEmpresa: Array<{ id: number; nomeSetor: string }> = [];

    for (const emp of empresasEncontradas) {
      let setoresDoEmp = await db
        .select({ id: setores.id, nomeSetor: setores.nomeSetor })
        .from(setores)
        .where(eq(setores.empresaId, emp.id));

      if (!setoresDoEmp.length) {
        const setoresIniciais = [
          "Operações",
          "Planejamento",
          "Engenharia",
          "Segurança do Trabalho",
          "Suprimentos",
        ];

        console.log(`ℹ️ Nenhum setor encontrado para ${emp.razaoSocial}. Criando setores padrão.`);

        for (const nomeSetor of setoresIniciais) {
          const insertSetor = await db.insert(setores).values({
            tenantId: emp.tenantId,
            nomeSetor,
            descricao: `Setor ${nomeSetor.toLowerCase()} da empresa ${emp.razaoSocial}.`,
            empresaId: emp.id,
          });
          const setorId = (insertSetor as any)[0]?.insertId;
          if (setorId) {
            setoresDoEmp.push({ id: setorId, nomeSetor });
          }
        }
      }

      if (setoresDoEmp.length) {
        empresaAlvo = emp;
        setoresEmpresa = setoresDoEmp;
        break;
      }
    }

    if (!empresaAlvo) {
      throw new Error("Nenhuma empresa 'Construtora Nacional' pôde receber setores.");
    }

    if (empresasEncontradas.length > 1) {
      console.log("⚠️ Empresas encontradas:");
      empresasEncontradas.forEach((emp) => {
        console.log(` - ${emp.id}: ${emp.razaoSocial}`);
      });
      console.log(`➡️ Utilizando a empresa ${empresaAlvo.razaoSocial} (ID ${empresaAlvo.id}).`);
    } else {
      console.log(`➡️ Empresa alvo: ${empresaAlvo.razaoSocial} (ID ${empresaAlvo.id}).`);
    }

    const empresa = empresaAlvo;

    console.log(`🛠️ Inserindo cargos para ${empresa.razaoSocial} (tenant ${empresa.tenantId})`);

    for (const [index, nomeCargo] of NOVOS_CARGOS.entries()) {
      const descricao = `Responsável por ${nomeCargo.toLowerCase()} em obras diversas.`;
      const codigoCbo = `999${index}`;

      const insertResult = await db.insert(cargos).values({
        tenantId: empresa.tenantId,
        nomeCargo,
        descricao,
        codigoCbo,
        empresaId: empresa.id,
      });

      const cargoId = (insertResult as any)[0]?.insertId;
      if (!cargoId) {
        console.warn(`Não foi possível obter o ID do cargo ${nomeCargo}.`);
        continue;
      }

      const setorAleatorio = setoresEmpresa[Math.floor(Math.random() * setoresEmpresa.length)];

      await db.insert(cargoSetores).values({
        tenantId: empresa.tenantId,
        cargoId,
        setorId: setorAleatorio.id,
        empresaId: empresa.id,
      });

      console.log(`✅ Cargo '${nomeCargo}' criado (CBO ${codigoCbo}) vinculado ao setor '${setorAleatorio.nomeSetor}'.`);
    }

    console.log("🎉 Cadastro concluído!");
  } catch (error) {
    console.error("❌ Erro ao cadastrar cargos:", error);
  } finally {
    await connection.end();
  }
}

main();