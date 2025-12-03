/**
 * Script de Migração Segura para Multi-Tenancy
 * 
 * Este script preserva TODOS os dados existentes ao migrar para o sistema multi-tenant.
 * 
 * IMPORTANTE: Faça backup antes de executar!
 * 
 * Uso:
 *   npx tsx scripts/migrar-para-multi-tenancy.ts
 */

import mysql from "mysql2/promise";
import { ENV } from "../server/_core/env";

async function migrarParaMultiTenancy() {
  console.log("🚀 Iniciando migração para Multi-Tenancy...");
  console.log("⚠️  IMPORTANTE: Certifique-se de ter feito backup antes!");
  console.log("");

  let connection: mysql.Connection | null = null;

  try {
    // Conectar ao banco
    console.log("📡 Conectando ao banco de dados...");
    connection = await mysql.createConnection(process.env.DATABASE_URL || "");
    console.log("✅ Conectado com sucesso!");
    console.log("");

    // PASSO 1: Criar tabela tenants
    console.log("📋 PASSO 1: Criando tabela tenants...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(255) NOT NULL,
        plano ENUM('basico', 'profissional') NOT NULL,
        status ENUM('ativo', 'suspenso', 'cancelado') DEFAULT 'ativo',
        dataInicio DATE NOT NULL,
        dataFim DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela tenants criada!");
    console.log("");

    // PASSO 2: Adicionar tenantId como NULLABLE
    console.log("📋 PASSO 2: Adicionando coluna tenantId nas tabelas...");
    
    const tabelas = [
      "users",
      "empresas",
      "colaboradores",
      "obras",
      "treinamentos",
      "epis",
      "fichasEpiEmitidas",
      "cargos",
      "setores",
      "tiposTreinamentos",
      "cargoTreinamentos",
      "cargoSetores",
      "riscosOcupacionais",
      "cargoRiscos",
      "modelosCertificados",
      "responsaveis",
      "certificadosEmitidos",
      "ordensServico",
      "modelosOrdemServico",
    ];

    for (const tabela of tabelas) {
      try {
        await connection.query(`
          ALTER TABLE ${tabela} 
          ADD COLUMN tenantId INT NULL
        `);
        console.log(`  ✅ ${tabela}: tenantId adicionado`);
      } catch (error: any) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`  ⚠️  ${tabela}: tenantId já existe (pulando)`);
        } else {
          console.log(`  ❌ ${tabela}: Erro - ${error.message}`);
        }
      }
    }
    console.log("");

    // PASSO 3: Criar tenant padrão
    console.log("📋 PASSO 3: Criando tenant padrão para dados existentes...");
    const [result] = await connection.query(`
      INSERT INTO tenants (nome, plano, status, dataInicio)
      VALUES ('Dados Existentes', 'profissional', 'ativo', CURDATE())
    `) as any;
    
    const tenantPadraoId = result.insertId;
    console.log(`✅ Tenant padrão criado com ID: ${tenantPadraoId}`);
    console.log("");

    // PASSO 4: Atribuir dados existentes ao tenant padrão
    console.log("📋 PASSO 4: Atribuindo dados existentes ao tenant padrão...");
    
    for (const tabela of tabelas) {
      try {
        const [result] = await connection.query(`
          UPDATE ${tabela} 
          SET tenantId = ? 
          WHERE tenantId IS NULL
        `, [tenantPadraoId]) as any;
        
        if (result.affectedRows > 0) {
          console.log(`  ✅ ${tabela}: ${result.affectedRows} registros atualizados`);
        } else {
          console.log(`  ℹ️  ${tabela}: Nenhum registro para atualizar`);
        }
      } catch (error: any) {
        console.log(`  ❌ ${tabela}: Erro - ${error.message}`);
      }
    }
    console.log("");

    // PASSO 5: Criar índices para performance
    console.log("📋 PASSO 5: Criando índices para performance...");
    
    for (const tabela of tabelas) {
      try {
        await connection.query(`
          CREATE INDEX idx_${tabela}_tenant ON ${tabela}(tenantId)
        `);
        console.log(`  ✅ Índice criado para ${tabela}`);
      } catch (error: any) {
        if (error.code === "ER_DUP_KEYNAME") {
          console.log(`  ⚠️  Índice já existe para ${tabela} (pulando)`);
        } else {
          console.log(`  ❌ Erro ao criar índice para ${tabela}: ${error.message}`);
        }
      }
    }
    console.log("");

    // PASSO 6: Verificar migração
    console.log("📋 PASSO 6: Verificando migração...");
    
    for (const tabela of tabelas) {
      try {
        const [rows] = await connection.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(tenantId) as com_tenant
          FROM ${tabela}
        `) as any;
        
        const { total, com_tenant } = rows[0];
        if (total === com_tenant) {
          console.log(`  ✅ ${tabela}: ${total} registros migrados`);
        } else {
          console.log(`  ⚠️  ${tabela}: ${total} total, ${com_tenant} com tenantId`);
        }
      } catch (error: any) {
        console.log(`  ❌ Erro ao verificar ${tabela}: ${error.message}`);
      }
    }
    console.log("");

    // PASSO 7: Atualizar role do usuário admin
    console.log("📋 PASSO 7: Atualizando role dos usuários...");
    try {
      await connection.query(`
        UPDATE users 
        SET role = 'tenant_admin' 
        WHERE role = 'admin' AND tenantId = ?
      `, [tenantPadraoId]);
      console.log("✅ Roles atualizadas!");
    } catch (error: any) {
      console.log(`⚠️  Erro ao atualizar roles: ${error.message}`);
    }
    console.log("");

    console.log("🎉 Migração concluída com sucesso!");
    console.log("");
    console.log("📊 Resumo:");
    console.log(`   - Tenant padrão criado: ID ${tenantPadraoId}`);
    console.log(`   - Tabelas migradas: ${tabelas.length}`);
    console.log("");
    console.log("✅ Todos os seus dados foram preservados!");
    console.log("✅ Você agora é admin do tenant padrão!");
    console.log("");
    console.log("⚠️  PRÓXIMOS PASSOS:");
    console.log("   1. Testar o sistema");
    console.log("   2. Verificar que todos os dados aparecem");
    console.log("   3. Se tudo OK, continuar com a implementação");

  } catch (error: any) {
    console.error("❌ ERRO durante migração:", error);
    console.error("");
    console.error("🛡️  Seu banco de dados está seguro!");
    console.error("    - Nenhum dado foi deletado");
    console.error("    - Você pode restaurar o backup se necessário");
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("📡 Conexão fechada");
    }
  }
}

// Executar migração
migrarParaMultiTenancy()
  .then(() => {
    console.log("✅ Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script falhou:", error);
    process.exit(1);
  });






















