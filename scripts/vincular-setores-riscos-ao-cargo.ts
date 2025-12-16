/**
 * Script para vincular todos os setores e riscos existentes ao cargo "Analista de recursos humanos"
 * 
 * Uso: npx tsx scripts/vincular-setores-riscos-ao-cargo.ts
 */

import "dotenv/config";
import * as db from "../server/db";

async function vincularSetoresERiscos() {
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
    
    // ========== VINCULAR SETORES ==========
    console.log("\n" + "=".repeat(50));
    console.log("📁 VINCULANDO SETORES");
    console.log("=".repeat(50));
    
    // Buscar todos os setores do mesmo tenant
    console.log("🔍 Buscando todos os setores...");
    const setores = await db.getAllSetores(cargoAnalista.tenantId, undefined, undefined);
    
    if (!setores || setores.length === 0) {
      console.log("⚠️  Nenhum setor encontrado!");
    } else {
      console.log(`✅ Encontrados ${setores.length} setores`);
      
      // Buscar setores já vinculados
      const setoresVinculados = await db.getSetoresByCargo(cargoAnalista.id, cargoAnalista.tenantId);
      const idsJaVinculados = new Set(setoresVinculados.map((s: any) => s.setorId));
      
      console.log(`📊 Setores já vinculados: ${idsJaVinculados.size}`);
      
      // Vincular cada setor que ainda não está vinculado
      let vinculados = 0;
      let jaExistentes = 0;
      let erros = 0;
      
      for (const setor of setores) {
        if (idsJaVinculados.has(setor.id)) {
          console.log(`⏭️  Setor "${setor.nomeSetor}" já está vinculado`);
          jaExistentes++;
          continue;
        }
        
        try {
          console.log(`🔗 Vinculando setor "${setor.nomeSetor}"...`);
          const result = await db.createCargoSetor({
            cargoId: cargoAnalista.id,
            setorId: setor.id,
            empresaId: null,
            tenantId: cargoAnalista.tenantId,
          });
          
          if (result.success) {
            console.log(`✅ Setor vinculado com sucesso!`);
            vinculados++;
          } else {
            console.log(`⚠️  ${result.alreadyExists ? 'Já existe' : 'Resultado inesperado'}`);
            jaExistentes++;
          }
        } catch (error: any) {
          console.error(`❌ Erro ao vincular setor "${setor.nomeSetor}":`, error.message);
          erros++;
        }
      }
      
      console.log("\n📊 RESUMO SETORES:");
      console.log(`  ✅ Vinculados: ${vinculados}`);
      console.log(`  ⏭️  Já existentes: ${jaExistentes}`);
      console.log(`  ❌ Erros: ${erros}`);
      console.log(`  📦 Total de setores: ${setores.length}`);
    }
    
    // ========== VINCULAR RISCOS ==========
    console.log("\n" + "=".repeat(50));
    console.log("⚠️  VINCULANDO RISCOS");
    console.log("=".repeat(50));
    
    // Buscar todos os riscos do mesmo tenant
    console.log("🔍 Buscando todos os riscos ocupacionais...");
    const riscos = await db.getAllRiscosOcupacionais(cargoAnalista.tenantId, undefined);
    
    if (!riscos || riscos.length === 0) {
      console.log("⚠️  Nenhum risco encontrado!");
    } else {
      console.log(`✅ Encontrados ${riscos.length} riscos ocupacionais`);
      
      // Buscar riscos já vinculados
      const riscosVinculados = await db.getRiscosByCargo(cargoAnalista.id, cargoAnalista.tenantId);
      const idsJaVinculados = new Set(riscosVinculados.map((r: any) => r.riscoOcupacionalId));
      
      console.log(`📊 Riscos já vinculados: ${idsJaVinculados.size}`);
      
      // Vincular cada risco que ainda não está vinculado
      let vinculados = 0;
      let jaExistentes = 0;
      let erros = 0;
      
      for (const risco of riscos) {
        if (idsJaVinculados.has(risco.id)) {
          console.log(`⏭️  Risco "${risco.nomeRisco}" já está vinculado`);
          jaExistentes++;
          continue;
        }
        
        try {
          console.log(`🔗 Vinculando risco "${risco.nomeRisco}"...`);
          const result = await db.createCargoRisco({
            cargoId: cargoAnalista.id,
            riscoOcupacionalId: risco.id,
            empresaId: null,
            tenantId: cargoAnalista.tenantId,
          });
          
          if (result.success) {
            console.log(`✅ Risco vinculado com sucesso!`);
            vinculados++;
          } else {
            console.log(`⚠️  Resultado inesperado`);
            jaExistentes++;
          }
        } catch (error: any) {
          console.error(`❌ Erro ao vincular risco "${risco.nomeRisco}":`, error.message);
          erros++;
        }
      }
      
      console.log("\n📊 RESUMO RISCOS:");
      console.log(`  ✅ Vinculados: ${vinculados}`);
      console.log(`  ⏭️  Já existentes: ${jaExistentes}`);
      console.log(`  ❌ Erros: ${erros}`);
      console.log(`  📦 Total de riscos: ${riscos.length}`);
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ PROCESSO CONCLUÍDO!");
    console.log("=".repeat(50));
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

vincularSetoresERiscos();


