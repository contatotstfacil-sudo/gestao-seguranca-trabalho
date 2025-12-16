/**
 * Script para executar o SQL de criação de dados do Filipi
 */

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), ".env") });

async function executarScript() {
  try {
    console.log("🔍 Lendo script SQL...");
    const sqlScript = readFileSync(resolve(process.cwd(), "scripts/criar-dados-filipi.sql"), "utf-8");
    
    console.log("🔌 Conectando ao banco de dados...");
    
    // Tentar usar DATABASE_URL ou criar conexão manual
    let connection: mysql.Connection;
    
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      // Extrair informações da URL ou usar variáveis individuais
      const dbUrl = process.env.DATABASE_URL || '';
      
      // Tentar extrair da URL se for MySQL
      if (dbUrl.includes('mysql://')) {
        connection = await mysql.createConnection(process.env.DATABASE_URL!);
      } else {
        // Criar conexão manual
        connection = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'sst',
        });
      }
    }
    
    console.log("✅ Conectado ao banco de dados!");
    console.log("🚀 Executando script SQL...\n");
    
    // Dividir o script em comandos individuais (separados por ;)
    // Remover comentários e linhas vazias
    const comandos = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== '\n');
    
    let comandosExecutados = 0;
    let erros = 0;
    
    for (const comando of comandos) {
      if (comando.trim().length === 0 || comando.trim().startsWith('--')) {
        continue;
      }
      
      try {
        // Executar comando
        const [result] = await connection.execute(comando);
        
        // Se for um SELECT, mostrar resultado
        if (comando.trim().toUpperCase().startsWith('SELECT')) {
          const rows = result as any[];
          if (rows.length > 0 && rows[0].info) {
            console.log(`  ℹ️  ${rows[0].info}`);
          } else if (rows.length > 0) {
            console.log(`  ✅ Resultado:`, rows[0]);
          }
        } else if (comando.trim().toUpperCase().startsWith('SET')) {
          // SET não precisa mostrar resultado
        } else {
          const insertResult = result as any;
          if (insertResult.affectedRows > 0) {
            console.log(`  ✅ Comando executado (${insertResult.affectedRows} linha(s) afetada(s))`);
          }
        }
        
        comandosExecutados++;
      } catch (error: any) {
        // Ignorar erros de duplicata (ON DUPLICATE KEY UPDATE)
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
          console.log(`  ⚠️  Dados já existem (ignorado)`);
        } else if (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist')) {
          console.log(`  ⚠️  Aviso: ${error.message.substring(0, 100)}`);
        } else {
          console.error(`  ❌ Erro ao executar comando:`, error.message.substring(0, 200));
          erros++;
        }
      }
    }
    
    console.log(`\n✅ Script executado!`);
    console.log(`   - Comandos executados: ${comandosExecutados}`);
    if (erros > 0) {
      console.log(`   - Erros: ${erros}`);
    }
    
    // Executar query final de resumo
    try {
      const [resumo] = await connection.execute(`
        SELECT 
          (SELECT COUNT(*) FROM empresas WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_empresas,
          (SELECT COUNT(*) FROM colaboradores WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_colaboradores,
          (SELECT COUNT(*) FROM cargos WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_cargos,
          (SELECT COUNT(*) FROM setores WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_setores,
          (SELECT COUNT(*) FROM tiposTreinamentos WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_tipos_treinamentos,
          (SELECT COUNT(*) FROM epis WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_epis,
          (SELECT COUNT(*) FROM responsaveis WHERE tenantId = (SELECT tenantId FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1)) AS total_responsaveis
      `);
      
      const resumoData = (resumo as any[])[0];
      console.log(`\n📊 RESUMO DOS DADOS CRIADOS:`);
      console.log(`   - Empresas: ${resumoData.total_empresas}`);
      console.log(`   - Colaboradores: ${resumoData.total_colaboradores}`);
      console.log(`   - Cargos: ${resumoData.total_cargos}`);
      console.log(`   - Setores: ${resumoData.total_setores}`);
      console.log(`   - Tipos de Treinamentos: ${resumoData.total_tipos_treinamentos}`);
      console.log(`   - EPIs: ${resumoData.total_epis}`);
      console.log(`   - Responsáveis: ${resumoData.total_responsaveis}`);
    } catch (error: any) {
      console.log(`\n⚠️  Não foi possível obter resumo: ${error.message}`);
    }
    
    await connection.end();
    console.log("\n✅ Processo finalizado com sucesso!");
    
  } catch (error: any) {
    console.error("\n❌ Erro ao executar script:", error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("\n💡 Dica: Verifique as credenciais do banco de dados no arquivo .env");
      console.error("   O DATABASE_URL deve estar no formato: mysql://usuario:senha@host:porta/banco");
    } else if (error.code === 'ENOENT') {
      console.error("\n💡 Dica: Arquivo SQL não encontrado. Verifique se o arquivo existe.");
    }
    process.exit(1);
  }
}

executarScript();








