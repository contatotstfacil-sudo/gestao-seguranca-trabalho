/**
 * Script para verificar se Ana Paula pode fazer login
 * Diagnóstico completo da conta
 */

import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function verificarAnaPaula() {
  console.log("🔍 Verificando conta da Ana Paula...\n");
  
  // Configuração - AJUSTE SE NECESSÁRIO
  const config = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "", // MUDE: "" para XAMPP/WAMP, ou sua senha
    database: "sst"
  };
  
  const email = "ana.paula@teste.com";
  const cpf = "12345678901";
  const senha = "111814gi";
  
  let connection: mysql.Connection | null = null;
  
  try {
    console.log("🔌 Conectando ao MySQL...");
    connection = await mysql.createConnection(config);
    console.log("✅ Conectado!\n");
    
    // 1. Verificar se usuário existe
    console.log("1️⃣ Verificando usuário...");
    const [users] = await connection.execute(
      "SELECT id, name, email, cpf, tenantId, role, openId FROM users WHERE email = ? OR cpf = ?",
      [email, cpf]
    );
    
    if (!Array.isArray(users) || users.length === 0) {
      console.log("❌ USUÁRIO NÃO ENCONTRADO!");
      console.log("\n💡 Solução: Execute o script de criação:");
      console.log("   npx tsx scripts/criar-ana-paula-local.ts\n");
      return;
    }
    
    const user = users[0] as any;
    console.log("✅ Usuário encontrado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId || "NULL (PROBLEMA!)"}`);
    console.log(`   OpenID: ${user.openId}\n`);
    
    // 2. Verificar senha
    console.log("2️⃣ Verificando senha...");
    const [passwords] = await connection.execute(
      "SELECT passwordHash FROM users WHERE id = ?",
      [user.id]
    );
    
    if (!Array.isArray(passwords) || passwords.length === 0) {
      console.log("❌ Hash de senha não encontrado!\n");
      return;
    }
    
    const passwordHash = (passwords[0] as any).passwordHash;
    const senhaValida = await bcrypt.compare(senha, passwordHash);
    
    if (senhaValida) {
      console.log("✅ Senha está correta!\n");
    } else {
      console.log("❌ SENHA INCORRETA!");
      console.log(`   Hash no banco: ${passwordHash.substring(0, 20)}...`);
      console.log("\n💡 Solução: Redefina a senha\n");
    }
    
    // 3. Verificar tenant
    if (!user.tenantId) {
      console.log("❌ PROBLEMA CRÍTICO: Usuário não tem tenantId!");
      console.log("   O sistema requer tenant para usuários não-admin.\n");
      return;
    }
    
    console.log("3️⃣ Verificando tenant...");
    const [tenants] = await connection.execute(
      "SELECT id, nome, plano, status, dataInicio, dataFim FROM tenants WHERE id = ?",
      [user.tenantId]
    );
    
    if (!Array.isArray(tenants) || tenants.length === 0) {
      console.log("❌ TENANT NÃO ENCONTRADO!");
      console.log(`   Tenant ID: ${user.tenantId}\n`);
      return;
    }
    
    const tenant = tenants[0] as any;
    console.log("✅ Tenant encontrado:");
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Nome: ${tenant.nome}`);
    console.log(`   Plano: ${tenant.plano}`);
    console.log(`   Status: ${tenant.status}`);
    console.log(`   Data Início: ${tenant.dataInicio}`);
    console.log(`   Data Fim: ${tenant.dataFim || "NULL (sem expiração)"}\n`);
    
    // 4. Validar status do tenant
    console.log("4️⃣ Validando status do tenant...");
    
    if (tenant.status !== "ativo") {
      console.log(`❌ TENANT ESTÁ ${tenant.status.toUpperCase()}!`);
      console.log("   O sistema bloqueia login para tenants suspensos/cancelados.\n");
    } else {
      console.log("✅ Tenant está ativo\n");
    }
    
    // 5. Verificar expiração
    if (tenant.dataFim) {
      const dataFim = new Date(tenant.dataFim);
      const hoje = new Date();
      
      console.log("5️⃣ Verificando expiração...");
      console.log(`   Data Fim: ${dataFim.toLocaleDateString('pt-BR')}`);
      console.log(`   Hoje: ${hoje.toLocaleDateString('pt-BR')}`);
      
      if (dataFim < hoje) {
        console.log("❌ TENANT EXPIRADO!");
        console.log("   O sistema bloqueia login para tenants expirados.\n");
      } else {
        const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`✅ Tenant válido por mais ${diasRestantes} dia(s)\n`);
      }
    } else {
      console.log("5️⃣ Verificando expiração...");
      console.log("✅ Tenant não tem data de expiração (válido indefinidamente)\n");
    }
    
    // 6. Resumo final
    console.log("═══════════════════════════════════════");
    console.log("📋 RESUMO:");
    console.log("═══════════════════════════════════════\n");
    
    const problemas: string[] = [];
    
    if (!senhaValida) {
      problemas.push("❌ Senha incorreta");
    }
    
    if (!user.tenantId) {
      problemas.push("❌ Usuário sem tenantId");
    }
    
    if (tenant.status !== "ativo") {
      problemas.push(`❌ Tenant ${tenant.status}`);
    }
    
    if (tenant.dataFim) {
      const dataFim = new Date(tenant.dataFim);
      const hoje = new Date();
      if (dataFim < hoje) {
        problemas.push("❌ Tenant expirado");
      }
    }
    
    if (problemas.length === 0) {
      console.log("✅ TUDO OK! A conta deve funcionar.\n");
      console.log("🔑 Credenciais:");
      console.log(`   Email/CPF: ${email} ou ${cpf}`);
      console.log(`   Senha: ${senha}\n`);
      console.log("💡 Se ainda não funcionar, verifique:");
      console.log("   - Logs do servidor ao tentar fazer login");
      console.log("   - Console do navegador (F12)");
      console.log("   - Mensagens de erro específicas\n");
    } else {
      console.log("❌ PROBLEMAS ENCONTRADOS:\n");
      problemas.forEach(p => console.log(`   ${p}`));
      console.log("\n💡 Corrija os problemas acima e tente novamente.\n");
    }
    
  } catch (error: any) {
    console.error("\n❌ Erro:");
    console.error(error.message);
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 MySQL não está rodando ou configuração incorreta.");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Senha ou usuário incorretos. Configure no script.");
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verificarAnaPaula()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

