/**
 * Script para gerar hash bcrypt de uma senha
 * 
 * Uso: npx tsx scripts/gerar-hash-senha.ts
 */

import bcrypt from "bcryptjs";

async function gerarHash() {
  const senha = "111814gi";
  
  console.log("🔐 Gerando hash bcrypt para a senha:", senha);
  console.log("");
  
  try {
    const hash = await bcrypt.hash(senha, 10);
    
    console.log("✅ Hash gerado com sucesso!");
    console.log("");
    console.log("📋 Use este hash no script SQL:");
    console.log(`SET @password_hash = '${hash}';`);
    console.log("");
    console.log("💡 Ou copie o hash completo:");
    console.log(hash);
    
  } catch (error: any) {
    console.error("❌ Erro ao gerar hash:", error.message);
    process.exit(1);
  }
}

gerarHash();








