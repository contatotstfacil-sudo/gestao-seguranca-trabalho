/**
 * Script para criar usuário de teste rapidamente
 * Útil para criar credenciais para técnicos testarem
 * 
 * Uso: npx tsx scripts/criar-usuario-teste-rapido.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

async function criarUsuarioTeste() {
  console.log("👤 Criando usuário de teste para técnicos...\n");
  
  // Configuração - AJUSTE SE NECESSÁRIO
  const config = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "", // MUDE: "" para XAMPP/WAMP, ou sua senha
    database: "sst"
  };
  
  // Dados do usuário de teste
  const nome = "Técnico Teste";
  const email = "tecnico@teste.com";
  const cpf = "12345678900";
  const senha = "teste123";
  const plano = "bronze";
  const diasAcesso = 7; // 7 dias de acesso
  
  let connection: mysql.Connection | null = null;
  
  try {
    console.log("🔌 Conectando ao MySQL...");
    connection = await mysql.createConnection(config);
    console.log("✅ Conectado!\n");
    
    // Verificar se já existe
    const [users] = await connection.execute(
      "SELECT id, name, email, tenantId FROM users WHERE email = ? OR cpf = ?",
      [email, cpf]
    );
    
    if (Array.isArray(users) && users.length > 0) {
      console.log("⚠️  Usuário já existe!");
      const user = users[0] as any;
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}\n`);
      
      if (user.tenantId) {
        const [tenants] = await connection.execute(
          "SELECT id, nome, plano, status, dataFim FROM tenants WHERE id = ?",
          [user.tenantId]
        );
        
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tenant = tenants[0] as any;
          console.log("📋 Tenant:");
          console.log(`   ID: ${tenant.id}`);
          console.log(`   Nome: ${tenant.nome}`);
          console.log(`   Plano: ${tenant.plano}`);
          console.log(`   Status: ${tenant.status}`);
          console.log(`   Expira em: ${tenant.dataFim || "Não expira"}\n`);
        }
      }
      
      console.log("🔑 Credenciais:");
      console.log(`   Email/CPF: ${email} ou ${cpf}`);
      console.log(`   Senha: ${senha}\n`);
      return;
    }
    
    // Criar tenant
    console.log("🏢 Criando tenant de teste...");
    const hoje = new Date();
    const dataFim = new Date(hoje);
    dataFim.setDate(dataFim.getDate() + diasAcesso);
    
    const [tenantResult] = await connection.execute(
      `INSERT INTO tenants (
        nome, email, plano, status, dataInicio, dataFim,
        valorPlano, periodicidade, statusPagamento, observacoes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        nome, email, plano, "ativo",
        dataFim.toISOString().split('T')[0],
        "0,00", "mensal", "pago",
        `Usuário de teste - ${diasAcesso} dias de acesso`
      ]
    );
    
    const tenantId = (tenantResult as any).insertId;
    console.log(`✅ Tenant criado! ID: ${tenantId}\n`);
    
    // Criar hash da senha
    console.log("🔐 Gerando hash da senha...");
    const passwordHash = await bcrypt.hash(senha, 10);
    
    // Criar usuário
    console.log("👤 Criando usuário...");
    const openId = `local-${Date.now()}`;
    const [userResult] = await connection.execute(
      `INSERT INTO users (
        tenantId, name, email, cpf, passwordHash, role, openId,
        empresaId, createdAt, updatedAt, lastSignedIn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW(), NOW())`,
      [tenantId, nome, email, cpf, passwordHash, "tenant_admin", openId]
    );
    
    const userId = (userResult as any).insertId;
    console.log(`✅ Usuário criado! ID: ${userId}\n`);
    
    console.log("═══════════════════════════════════════");
    console.log("✅ USUÁRIO DE TESTE CRIADO!");
    console.log("═══════════════════════════════════════\n");
    console.log("🔑 Credenciais de Acesso:");
    console.log(`   Email/CPF: ${email} ou ${cpf}`);
    console.log(`   Senha: ${senha}\n`);
    console.log("📋 Informações:");
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   Plano: ${plano}`);
    console.log(`   Acesso válido até: ${dataFim.toLocaleDateString('pt-BR')} (${diasAcesso} dias)\n`);
    console.log("💡 Compartilhe estas credenciais com os técnicos para testarem!\n");
    
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

criarUsuarioTeste()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

