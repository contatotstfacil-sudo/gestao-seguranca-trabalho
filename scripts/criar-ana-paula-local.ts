/**
 * Script SIMPLES para criar Ana Paula localmente
 * Funciona mesmo se DATABASE_URL estiver errada
 * 
 * Uso: npx tsx scripts/criar-ana-paula-local.ts
 */

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function criarAnaPaulaLocal() {
  console.log("👤 Criando Ana Paula (Plano Bronze) - Teste Local\n");
  
  // Configuração local padrão - AJUSTE SE NECESSÁRIO
  // Se você usa XAMPP/WAMP, geralmente a senha é vazia ""
  // Se você configurou MySQL, use sua senha
  const config = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "", // MUDE: "" para XAMPP/WAMP, ou sua senha do MySQL
    database: "sst" // MUDE SE SEU BANCO TIVER OUTRO NOME
  };
  
  console.log("📋 Configuração MySQL:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Password: ${config.password === "senha" ? "⚠️  CONFIGURE SUA SENHA!" : "***"}\n`);
  
  if (config.password === "senha") {
    console.log("⚠️  ATENÇÃO: Configure a senha do MySQL no script!");
    console.log("   Edite o arquivo e mude 'password: \"senha\"' para sua senha real\n");
  }
  
  let connection: mysql.Connection | null = null;
  
  try {
    console.log("🔌 Conectando ao MySQL...");
    connection = await mysql.createConnection(config);
    console.log("✅ Conectado!\n");
    
    // Dados de Ana Paula
    const nome = "Ana Paula";
    const email = "ana.paula@consultoriasst.com.br";
    const cpf = "55566677788";
    const telefone = "(11) 91111-0000";
    const senha = "111814gi";
    const plano = "bronze";
    
    // 1. Verificar se já existe
    console.log("🔍 Verificando se já existe...");
    const [users] = await connection.execute(
      "SELECT id, name, email, tenantId FROM users WHERE email = ? OR cpf = ?",
      [email, cpf]
    );
    
    if (Array.isArray(users) && users.length > 0) {
      console.log("⚠️  Usuário já existe!");
      const user = users[0] as any;
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   TenantId: ${user.tenantId || "N/A"}\n`);
      
      // Verificar tenant
      if (user.tenantId) {
        const [tenants] = await connection.execute(
          "SELECT id, nome, plano, status FROM tenants WHERE id = ?",
          [user.tenantId]
        );
        
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tenant = tenants[0] as any;
          console.log("📋 Tenant encontrado:");
          console.log(`   ID: ${tenant.id}`);
          console.log(`   Nome: ${tenant.nome}`);
          console.log(`   Plano: ${tenant.plano}`);
          console.log(`   Status: ${tenant.status}\n`);
          
          if (tenant.status === "ativo") {
            console.log("✅ TUDO OK! Usuário já existe e está ativo.");
            console.log("\n🔑 Credenciais:");
            console.log(`   Email/CPF: ${email} ou ${cpf}`);
            console.log(`   Senha: ${senha}\n`);
            return;
          }
        }
      }
      
      console.log("💡 Se não conseguir fazer login, execute o script SQL de criação.\n");
      return;
    }
    
    // 2. Criar tenant
    console.log("🏢 Criando tenant (sistema Bronze)...");
    const [tenantResult] = await connection.execute(
      `INSERT INTO tenants (
        nome, email, telefone, cpf, plano, status, dataInicio, dataFim,
        valorPlano, dataUltimoPagamento, dataProximoPagamento,
        periodicidade, statusPagamento, observacoes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), NULL, ?, CURDATE(), 
        DATE_ADD(CURDATE(), INTERVAL 1 MONTH), ?, ?, ?, NOW(), NOW())`,
      [
        nome, email, telefone, cpf, plano, "ativo",
        "67,90", "mensal", "pago", "Acesso fictício - teste local"
      ]
    );
    
    const tenantId = (tenantResult as any).insertId;
    console.log(`✅ Tenant criado! ID: ${tenantId}\n`);
    
    // 3. Criar hash da senha
    console.log("🔐 Gerando hash da senha...");
    const passwordHash = await bcrypt.hash(senha, 10);
    
    // 4. Criar usuário
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
    
    // 5. Verificar
    console.log("🔍 Verificando criação...");
    const [verificacao] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.tenantId,
        t.id as tenant_id, t.plano, t.status
      FROM users u
      LEFT JOIN tenants t ON u.tenantId = t.id
      WHERE u.id = ?`,
      [userId]
    );
    
    if (Array.isArray(verificacao) && verificacao.length > 0) {
      const dados = verificacao[0] as any;
      console.log("✅ Verificação OK!");
      console.log(`   Usuário ID: ${dados.id}`);
      console.log(`   Tenant ID: ${dados.tenant_id}`);
      console.log(`   Plano: ${dados.plano}`);
      console.log(`   Status: ${dados.status}\n`);
    }
    
    console.log("═══════════════════════════════════════");
    console.log("✅ ANA PAULA CRIADA COM SUCESSO!");
    console.log("═══════════════════════════════════════\n");
    console.log("🔑 Credenciais de Login:");
    console.log(`   Email/CPF: ${email} ou ${cpf}`);
    console.log(`   Senha: ${senha}\n`);
    console.log("💡 Agora você pode fazer login e ver como ela verá o sistema!");
    console.log("   (Ela é tenant_admin do plano Bronze, não super_admin)\n");
    
  } catch (error: any) {
    console.error("\n❌ Erro:");
    console.error(error.message);
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 MySQL não está rodando ou configuração incorreta.");
      console.error("   Verifique:");
      console.error("   1. MySQL está rodando?");
      console.error("   2. Host, porta, usuário e senha estão corretos?");
      console.error("   3. O banco de dados existe?");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Senha ou usuário incorretos.");
      console.error("   Edite o script e configure a senha correta do MySQL.");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("\n💡 Banco de dados não existe.");
      console.error(`   Crie o banco '${config.database}' ou mude o nome no script.`);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Conexão fechada.");
    }
  }
}

// Executa
criarAnaPaulaLocal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

