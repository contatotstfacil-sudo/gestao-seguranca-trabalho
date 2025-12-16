/**
 * Script para EXECUTAR automaticamente o vínculo de setores e riscos
 * ao cargo "Analista de recursos humanos"
 * 
 * Este script será executado automaticamente
 */

import "dotenv/config";
import * as db from "../server/db";

async function executarVinculo() {
  try {
    console.log("🔍 Buscando cargo 'Analista de recursos humanos'...");
    
    const cargos = await db.getAllCargos(null);
    const cargoAnalista = cargos.find((c: any) => 
      c.nomeCargo?.toLowerCase().includes("analista de recursos humanos") ||
      c.codigoCbo === "2524-05"
    );
    
    if (!cargoAnalista) {
      console.error("❌ Cargo não encontrado!");
      return;
    }
    
    console.log(`✅ Cargo encontrado: ${cargoAnalista.nomeCargo} (ID: ${cargoAnalista.id})`);
    
    const tenantId = cargoAnalista.tenantId;
    
    // FORÇAR VÍNCULO DE SETORES
    console.log("\n📁 Forçando vínculo de setores...");
    const setores = await db.getAllSetores(tenantId, undefined, undefined);
    let setoresVinculados = 0;
    
    for (const setor of setores) {
      try {
        const result = await db.createCargoSetor({
          cargoId: cargoAnalista.id,
          setorId: setor.id,
          empresaId: null,
          tenantId: tenantId,
        });
        if (result.success) {
          setoresVinculados++;
        }
      } catch (error: any) {
        // Ignorar erros de duplicata
      }
    }
    console.log(`✅ ${setoresVinculados} setores vinculados`);
    
    // FORÇAR VÍNCULO DE RISCOS
    console.log("\n⚠️  Forçando vínculo de riscos...");
    const riscos = await db.getAllRiscosOcupacionais(tenantId, undefined);
    let riscosVinculados = 0;
    
    for (const risco of riscos) {
      try {
        const result = await db.createCargoRisco({
          cargoId: cargoAnalista.id,
          riscoOcupacionalId: risco.id,
          empresaId: null,
          tenantId: tenantId,
        });
        if (result.success) {
          riscosVinculados++;
        }
      } catch (error: any) {
        // Ignorar erros de duplicata
      }
    }
    console.log(`✅ ${riscosVinculados} riscos vinculados`);
    
    console.log("\n✅ Processo concluído!");
  } catch (error: any) {
    console.error("❌ Erro:", error);
  }
}

// Executar automaticamente
executarVinculo().then(() => process.exit(0)).catch(() => process.exit(1));


