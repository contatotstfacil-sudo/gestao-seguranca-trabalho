/**
 * Atualizar enum de role para incluir tenant_admin
 */

import mysql from "mysql2/promise";

async function atualizarRoleEnum() {
  console.log("🔄 Atualizando enum de role...");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    // Atualizar enum
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('super_admin', 'tenant_admin', 'user', 'admin', 'gestor', 'tecnico') 
      DEFAULT 'user'
    `);
    console.log("✅ Enum atualizado!");
    
    // Atualizar usuários admin para tenant_admin
    await connection.query(`
      UPDATE users 
      SET role = 'tenant_admin' 
      WHERE role = 'admin' AND tenantId IS NOT NULL
    `);
    console.log("✅ Roles atualizadas!");
    
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  } finally {
    await connection.end();
  }
}

atualizarRoleEnum();













