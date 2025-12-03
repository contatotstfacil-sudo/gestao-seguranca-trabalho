/**
 * Script para verificar e corrigir tenantId das ordens de serviço
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });
dotenv.config();

async function verificarECorrigirTenantOrdens() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("🔍 Verificando ordens de serviço no banco...\n");

    // Buscar todas as ordens
    const [ordens] = await connection.execute(`
      SELECT 
        os.id,
        os.numeroOrdem,
        os.empresaId,
        os.tenantId,
        e.tenantId as empresaTenantId
      FROM ordensServico os
      LEFT JOIN empresas e ON os.empresaId = e.id
      ORDER BY os.id
    `);

    const ordensArray = ordens as any[];
    
    console.log(`📊 Total de ordens encontradas: ${ordensArray.length}\n`);
    
    if (ordensArray.length === 0) {
      console.log("ℹ️ Nenhuma ordem encontrada no banco.");
      await connection.end();
      return;
    }

    // Analisar ordens
    const ordensSemTenant = ordensArray.filter(o => !o.tenantId);
    const ordensComTenantIncorreto = ordensArray.filter(o => 
      o.tenantId && o.empresaTenantId && o.tenantId !== o.empresaTenantId
    );
    const ordensCorretas = ordensArray.filter(o => 
      o.tenantId && o.empresaTenantId && o.tenantId === o.empresaTenantId
    );

    console.log(`✅ Ordens com tenantId correto: ${ordensCorretas.length}`);
    console.log(`⚠️ Ordens sem tenantId: ${ordensSemTenant.length}`);
    console.log(`❌ Ordens com tenantId incorreto: ${ordensComTenantIncorreto.length}\n`);

    if (ordensSemTenant.length > 0) {
      console.log("📋 Ordens sem tenantId:");
      ordensSemTenant.forEach(o => {
        console.log(`  - ID: ${o.id}, Número: ${o.numeroOrdem}, EmpresaId: ${o.empresaId}, EmpresaTenantId: ${o.empresaTenantId || "N/A"}`);
      });
      console.log();
    }

    if (ordensComTenantIncorreto.length > 0) {
      console.log("📋 Ordens com tenantId incorreto:");
      ordensComTenantIncorreto.forEach(o => {
        console.log(`  - ID: ${o.id}, Número: ${o.numeroOrdem}, TenantId atual: ${o.tenantId}, TenantId correto: ${o.empresaTenantId}`);
      });
      console.log();
    }

    // Corrigir ordens sem tenantId
    let corrigidas = 0;
    for (const ordem of ordensSemTenant) {
      if (ordem.empresaTenantId) {
        await connection.execute(
          "UPDATE ordensServico SET tenantId = ? WHERE id = ?",
          [ordem.empresaTenantId, ordem.id]
        );
        console.log(`✅ Corrigida ordem ID ${ordem.id}: tenantId = ${ordem.empresaTenantId}`);
        corrigidas++;
      } else {
        console.log(`⚠️ Ordem ID ${ordem.id} não pode ser corrigida: empresa sem tenantId`);
      }
    }

    // Corrigir ordens com tenantId incorreto
    for (const ordem of ordensComTenantIncorreto) {
      if (ordem.empresaTenantId) {
        await connection.execute(
          "UPDATE ordensServico SET tenantId = ? WHERE id = ?",
          [ordem.empresaTenantId, ordem.id]
        );
        console.log(`✅ Corrigida ordem ID ${ordem.id}: tenantId ${ordem.tenantId} → ${ordem.empresaTenantId}`);
        corrigidas++;
      }
    }

    console.log(`\n✅ Total de ordens corrigidas: ${corrigidas}`);
    console.log("\n✅ Verificação concluída!");

    await connection.end();
  } catch (error: any) {
    console.error("❌ Erro ao verificar ordens:", error);
    process.exit(1);
  }
}

verificarECorrigirTenantOrdens();





