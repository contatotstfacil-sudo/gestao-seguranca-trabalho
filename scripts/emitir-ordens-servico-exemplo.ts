/**
 * Script para emitir ordens de serviço de exemplo
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });
dotenv.config();

async function emitirOrdensServico() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("🔍 Buscando empresa 'Construções e Infraestrutura Brasil Ltda'...\n");

    // Buscar a empresa
    const [empresas] = await connection.execute(
      "SELECT id, razaoSocial, tenantId FROM empresas WHERE razaoSocial LIKE ? LIMIT 1",
      ["%Construções e Infraestrutura Brasil%"]
    );

    const empresa = (empresas as any[])[0];

    if (!empresa) {
      console.error("❌ Empresa não encontrada!");
      await connection.end();
      process.exit(1);
    }

    console.log(`✅ Empresa encontrada: ${empresa.razaoSocial} (ID: ${empresa.id}, TenantId: ${empresa.tenantId})\n`);

    // Buscar 5 colaboradores aleatórios dessa empresa
    const [colaboradores] = await connection.execute(
      "SELECT id, nomeCompleto, cargoId FROM colaboradores WHERE empresaId = ? ORDER BY RAND() LIMIT 5",
      [empresa.id]
    );

    const colaboradoresArray = colaboradores as any[];

    if (colaboradoresArray.length === 0) {
      console.error("❌ Nenhum colaborador encontrado para esta empresa!");
      await connection.end();
      process.exit(1);
    }

    console.log(`✅ ${colaboradoresArray.length} colaborador(es) encontrado(s):`);
    colaboradoresArray.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.nomeCompleto} (ID: ${c.id})`);
    });
    console.log();

    // Buscar o maior número de ordem atual
    const [maxNum] = await connection.execute(
      "SELECT MAX(CAST(numeroOrdem AS UNSIGNED)) as maxNum FROM ordensServico WHERE numeroOrdem REGEXP '^[0-9]+$'"
    );
    const maxNumValue = (maxNum as any[])[0]?.maxNum || 0;
    let proximoNumero = maxNumValue + 1;

    console.log(`📝 Próximo número de ordem: ${String(proximoNumero).padStart(6, '0')}\n`);

    // Emitir 5 ordens de serviço
    const ordensCriadas = [];
    const hoje = new Date();
    const dataEmissao = hoje.toISOString().split('T')[0]; // YYYY-MM-DD

    for (let i = 0; i < colaboradoresArray.length; i++) {
      const colaborador = colaboradoresArray[i];
      const numeroOrdem = String(proximoNumero).padStart(6, '0');
      
      try {
        const [result] = await connection.execute(
          `INSERT INTO ordensServico 
           (tenantId, numeroOrdem, empresaId, colaboradorId, descricaoServico, prioridade, status, dataEmissao, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            empresa.tenantId || null,
            numeroOrdem,
            empresa.id,
            colaborador.id,
            `Ordem de serviço de Segurança do Trabalho para ${colaborador.nomeCompleto}`,
            'media',
            'aberta',
            dataEmissao
          ]
        );

        const insertId = (result as any).insertId;
        ordensCriadas.push({
          id: insertId,
          numeroOrdem,
          colaborador: colaborador.nomeCompleto
        });

        console.log(`✅ Ordem ${numeroOrdem} criada para ${colaborador.nomeCompleto} (ID: ${insertId})`);
        proximoNumero++;
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.warn(`⚠️ Número ${numeroOrdem} já existe, tentando próximo...`);
          proximoNumero++;
          i--; // Tentar novamente com o mesmo colaborador
          continue;
        }
        console.error(`❌ Erro ao criar ordem para ${colaborador.nomeCompleto}:`, error.message);
      }
    }

    console.log(`\n✅ Total de ${ordensCriadas.length} ordem(ns) de serviço criada(s) com sucesso!`);
    console.log("\n📋 Resumo:");
    ordensCriadas.forEach((ordem, i) => {
      console.log(`   ${i + 1}. Ordem ${ordem.numeroOrdem} - ${ordem.colaborador}`);
    });

    await connection.end();
  } catch (error: any) {
    console.error("❌ Erro ao emitir ordens de serviço:", error);
    process.exit(1);
  }
}

emitirOrdensServico();






