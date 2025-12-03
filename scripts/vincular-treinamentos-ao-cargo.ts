/**
 * Script para vincular todos os treinamentos existentes ao cargo "Analista de recursos humanos"
 * 
 * Uso: npx tsx scripts/vincular-treinamentos-ao-cargo.ts
 */

import "dotenv/config";
import * as db from "../server/db";

async function vincularTreinamentos() {
  try {
    console.log("🔍 Buscando cargo 'Analista de recursos humanos'...");
    
    // Buscar todos os cargos (null = admin, vê todos)
    const cargos = await db.getAllCargos(null);
    const cargoAnalista = cargos.find((c: any) => 
      c.nomeCargo?.toLowerCase().includes("analista de recursos humanos") ||
      c.codigoCbo === "2524-05"
    );
    
    if (!cargoAnalista) {
      console.error("❌ Cargo 'Analista de recursos humanos' não encontrado!");
      console.log("Cargos disponíveis:");
      cargos.slice(0, 10).forEach((c: any) => {
        console.log(`  - ${c.nomeCargo} (CBO: ${c.codigoCbo}, ID: ${c.id}, Tenant: ${c.tenantId})`);
      });
      if (cargos.length > 10) {
        console.log(`  ... e mais ${cargos.length - 10} cargos`);
      }
      process.exit(1);
    }
    
    console.log(`✅ Cargo encontrado: ${cargoAnalista.nomeCargo} (ID: ${cargoAnalista.id}, Tenant: ${cargoAnalista.tenantId})`);
    
    // Buscar todos os tipos de treinamentos do mesmo tenant
    console.log("🔍 Buscando todos os tipos de treinamentos...");
    const tiposTreinamentos = await db.getAllTiposTreinamentos(cargoAnalista.tenantId, undefined, undefined);
    
    if (!tiposTreinamentos || tiposTreinamentos.length === 0) {
      console.error("❌ Nenhum tipo de treinamento encontrado!");
      process.exit(1);
    }
    
    console.log(`✅ Encontrados ${tiposTreinamentos.length} tipos de treinamentos`);
    
    // Buscar treinamentos já vinculados
    const treinamentosVinculados = await db.getTreinamentosByCargo(cargoAnalista.id, cargoAnalista.tenantId);
    const idsJaVinculados = new Set(treinamentosVinculados.map((t: any) => t.tipoTreinamentoId));
    
    console.log(`📊 Treinamentos já vinculados: ${idsJaVinculados.size}`);
    
    // Vincular cada treinamento que ainda não está vinculado
    let vinculados = 0;
    let jaExistentes = 0;
    let erros = 0;
    
    for (const tipoTreinamento of tiposTreinamentos) {
      if (idsJaVinculados.has(tipoTreinamento.id)) {
        console.log(`⏭️  Treinamento "${tipoTreinamento.nomeTreinamento}" já está vinculado`);
        jaExistentes++;
        continue;
      }
      
      try {
        console.log(`🔗 Vinculando "${tipoTreinamento.nomeTreinamento}"...`);
        const result = await db.createCargoTreinamento({
          cargoId: cargoAnalista.id,
          tipoTreinamentoId: tipoTreinamento.id,
          empresaId: null,
          tenantId: cargoAnalista.tenantId,
        });
        
        if (result.success) {
          console.log(`✅ Vinculado com sucesso!`);
          vinculados++;
        } else {
          console.log(`⚠️  ${result.alreadyExists ? 'Já existe' : 'Resultado inesperado'}`);
          jaExistentes++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao vincular "${tipoTreinamento.nomeTreinamento}":`, error.message);
        erros++;
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 RESUMO:");
    console.log(`  ✅ Vinculados: ${vinculados}`);
    console.log(`  ⏭️  Já existentes: ${jaExistentes}`);
    console.log(`  ❌ Erros: ${erros}`);
    console.log(`  📦 Total de treinamentos: ${tiposTreinamentos.length}`);
    console.log("=".repeat(50));
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

vincularTreinamentos();

