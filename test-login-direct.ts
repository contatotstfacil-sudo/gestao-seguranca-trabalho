/**
 * Teste direto do login - Simula acesso
 */

import mysql from "mysql2/promise";

async function testLogin() {
  console.log("🧪 TESTE DIRETO DE LOGIN");
  console.log("========================");
  console.log("");

  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  
  try {
    // Buscar usuário
    const [users] = await connection.query(
      "SELECT * FROM users WHERE cpf = ? OR email = ? LIMIT 1",
      ["38099529820", "38099529820"]
    ) as any[];
    
    if (users.length === 0) {
      console.log("❌ Usuário não encontrado!");
      return;
    }
    
    const user = users[0];
    console.log("✅ Usuário encontrado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   TenantId: ${user.tenantId || 'NULL'}`);
    console.log("");
    
    // Testar serialização
    const testResponse = {
      success: true,
      user: {
        id: Number(user.id),
        name: String(user.name || ""),
        email: String(user.email || ""),
        role: String(user.role || "user"),
        empresaId: user.empresaId ? Number(user.empresaId) : null,
        tenantId: user.tenantId ? Number(user.tenantId) : null,
      },
    };
    
    console.log("🧪 Testando serialização...");
    const json = JSON.stringify(testResponse);
    const parsed = JSON.parse(json);
    
    console.log("✅ Serialização OK!");
    console.log("");
    console.log("📦 Resposta JSON:");
    console.log(json);
    console.log("");
    console.log("✅ TESTE CONCLUÍDO - Resposta é serializável!");
    
  } catch (error: any) {
    console.error("❌ ERRO:", error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

testLogin();























