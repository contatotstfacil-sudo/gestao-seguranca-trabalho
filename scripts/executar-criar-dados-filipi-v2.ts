/**
 * Script para executar o SQL de criação de dados do Filipi
 * Usa a mesma lógica de conexão do sistema
 */

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), ".env") });

async function executarScript() {
  try {
    console.log("🔍 Lendo script SQL...");
    const sqlScript = readFileSync(resolve(process.cwd(), "scripts/criar-dados-filipi.sql"), "utf-8");
    
    console.log("🔌 Conectando ao banco de dados usando a mesma lógica do sistema...");
    
    // Usar a mesma função de conexão do sistema
    const { getDb } = await import("../server/db");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Não foi possível conectar ao banco de dados. Verifique o DATABASE_URL no .env");
    }
    
    // Obter a conexão direta do mysql
    const mysql = await import("mysql2/promise");
    
    // Tentar criar conexão direta
    let connection: any;
    
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      // Tentar usar a conexão do getDb se possível
      // Ou criar conexão manual com valores padrão
      try {
        connection = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'sst',
        });
      } catch (error: any) {
        console.error("❌ Erro ao conectar:", error.message);
        console.log("\n💡 Tente configurar o DATABASE_URL no .env:");
        console.log("   DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/sst");
        throw error;
      }
    }
    
    console.log("✅ Conectado ao banco de dados!");
    console.log("🚀 Executando script SQL...\n");
    
    // Dividir o script em comandos individuais
    const comandos = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        const cmdUpper = cmd.toUpperCase().trim();
        return cmd.length > 0 
          && !cmd.startsWith('--') 
          && cmd !== '\n'
          && !cmdUpper.startsWith('SELECT CONCAT') // Pular SELECTs de debug
          && cmdUpper !== 'SET';
      });
    
    let comandosExecutados = 0;
    let erros = 0;
    let resultados: any[] = [];
    
    for (const comando of comandos) {
      if (comando.trim().length === 0 || comando.trim().startsWith('--')) {
        continue;
      }
      
      // Pular comandos SET que não são críticos
      if (comando.trim().toUpperCase().startsWith('SET @')) {
        try {
          await connection.execute(comando);
        } catch (error: any) {
          // Ignorar erros em SET
        }
        continue;
      }
      
      try {
        const [result] = await connection.execute(comando);
        
        // Se for um SELECT, mostrar resultado
        if (comando.trim().toUpperCase().startsWith('SELECT')) {
          const rows = result as any[];
          if (rows.length > 0) {
            if (rows[0].info) {
              console.log(`  ℹ️  ${rows[0].info}`);
            } else if (rows[0].mensagem) {
              console.log(`  ✅ ${rows[0].mensagem}`);
              resultados.push(rows[0]);
            } else {
              // Mostrar primeira linha do resultado
              console.log(`  ✅ Resultado:`, Object.values(rows[0])[0]);
            }
          }
        } else {
          const insertResult = result as any;
          if (insertResult.affectedRows !== undefined && insertResult.affectedRows > 0) {
            console.log(`  ✅ ${insertResult.affectedRows} registro(s) inserido(s)/atualizado(s)`);
          } else if (insertResult.insertId) {
            console.log(`  ✅ Registro criado (ID: ${insertResult.insertId})`);
          }
        }
        
        comandosExecutados++;
      } catch (error: any) {
        // Ignorar erros de duplicata
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
          console.log(`  ⚠️  Dados já existem (ignorado)`);
        } else if (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist')) {
          console.log(`  ⚠️  Aviso: ${error.message.substring(0, 100)}`);
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  Tabela não encontrada: ${error.message.substring(0, 100)}`);
        } else {
          console.error(`  ❌ Erro: ${error.message.substring(0, 200)}`);
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
      console.log(`   ✅ Empresas: ${resumoData.total_empresas}`);
      console.log(`   ✅ Colaboradores: ${resumoData.total_colaboradores}`);
      console.log(`   ✅ Cargos: ${resumoData.total_cargos}`);
      console.log(`   ✅ Setores: ${resumoData.total_setores}`);
      console.log(`   ✅ Tipos de Treinamentos: ${resumoData.total_tipos_treinamentos}`);
      console.log(`   ✅ EPIs: ${resumoData.total_epis}`);
      console.log(`   ✅ Responsáveis: ${resumoData.total_responsaveis}`);
    } catch (error: any) {
      console.log(`\n⚠️  Não foi possível obter resumo: ${error.message}`);
    }
    
    await connection.end();
    console.log("\n🎉 Processo finalizado com sucesso!");
    
  } catch (error: any) {
    console.error("\n❌ Erro ao executar script:", error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("\n💡 Dica: Verifique as credenciais do banco de dados no arquivo .env");
      console.error("   O DATABASE_URL deve estar no formato: mysql://usuario:senha@host:porta/banco");
      console.error("\n   Exemplo: DATABASE_URL=mysql://root:senha123@localhost:3306/sst");
    } else if (error.code === 'ENOENT') {
      console.error("\n💡 Dica: Arquivo SQL não encontrado. Verifique se o arquivo existe.");
    } else if (error.message.includes('DATABASE_URL')) {
      console.error("\n💡 Configure o DATABASE_URL no arquivo .env:");
      console.error("   DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/sst");
    }
    process.exit(1);
  }
}

executarScript();








