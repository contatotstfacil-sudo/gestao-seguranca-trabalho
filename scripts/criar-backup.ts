import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from "fs";
import { execSync } from "child_process";
import mysql from "mysql2/promise";

// Carregar .env e .env.local
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function criarBackup() {
  const agora = new Date();
  const dataHora = agora.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace(/-(\d{2})-(\d{2})$/, '_$1h$2m');
  
  const nomeBackup = `backup_${dataHora}`;
  const pastaBackups = resolve(process.cwd(), "backups");
  const pastaBackupAtual = resolve(pastaBackups, nomeBackup);

  console.log("💾 Criando backup do sistema...\n");
  console.log(`📁 Pasta de backup: ${pastaBackupAtual}\n`);

  try {
    // Criar pasta de backups se não existir
    if (!existsSync(pastaBackups)) {
      mkdirSync(pastaBackups, { recursive: true });
      console.log("✅ Pasta 'backups' criada");
    }

    // Criar pasta do backup atual
    mkdirSync(pastaBackupAtual, { recursive: true });
    console.log(`✅ Pasta do backup criada: ${nomeBackup}\n`);

    // 1. Backup do banco de dados
    console.log("📊 Fazendo backup do banco de dados...");
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("postgresql://usuario:senha") && !process.env.DATABASE_URL.includes("mysql://usuario:senha")) {
      try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        
        // Extrair informações da URL
        const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
        const database = url.pathname.replace('/', '');
        const user = url.username;
        const password = url.password;
        const host = url.hostname;
        const port = url.port || '3306';

        // Criar dump do banco
        const arquivoSQL = resolve(pastaBackupAtual, `database_${nomeBackup}.sql`);
        
        // Usar mysqldump se disponível, senão fazer dump manual
        try {
          execSync(`mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > "${arquivoSQL}"`, {
            stdio: 'pipe',
            shell: true
          });
          console.log(`✅ Backup do banco de dados criado: database_${nomeBackup}.sql`);
        } catch (error: any) {
          console.log("⚠️  mysqldump não disponível, criando dump manual...");
          
          // Dump manual usando queries
          const tables = await connection.query('SHOW TABLES');
          let dumpSQL = `-- Backup criado em ${agora.toLocaleString('pt-BR')}\n`;
          dumpSQL += `-- Database: ${database}\n\n`;
          dumpSQL += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

          const tableList = (tables[0] as any[]).map((row: any) => Object.values(row)[0]);

          for (const table of tableList) {
            dumpSQL += `-- Table: ${table}\n`;
            dumpSQL += `DROP TABLE IF EXISTS \`${table}\`;\n`;
            
            const [createTable] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
            const createStatement = (createTable as any[])[0]['Create Table'];
            dumpSQL += `${createStatement};\n\n`;

            const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
            if ((rows as any[]).length > 0) {
              dumpSQL += `INSERT INTO \`${table}\` VALUES\n`;
              const values = (rows as any[]).map((row: any) => {
                const vals = Object.values(row).map((val: any) => {
                  if (val === null) return 'NULL';
                  if (typeof val === 'string') {
                    return `'${val.replace(/'/g, "''")}'`;
                  }
                  return val;
                });
                return `(${vals.join(', ')})`;
              });
              dumpSQL += values.join(',\n') + ';\n\n';
            }
          }

          dumpSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;
          writeFileSync(arquivoSQL, dumpSQL, 'utf-8');
          console.log(`✅ Backup do banco de dados criado: database_${nomeBackup}.sql`);
        }

        await connection.end();
      } catch (error: any) {
        console.error(`❌ Erro ao fazer backup do banco: ${error.message}`);
        console.log("⚠️  Continuando com backup de arquivos...");
      }
    } else {
      console.log("⚠️  DATABASE_URL não configurada ou é placeholder. Pulando backup do banco.");
    }

    // 2. Backup de arquivos importantes
    console.log("\n📁 Fazendo backup de arquivos importantes...");

    const arquivosImportantes = [
      '.env.local',
      'drizzle/schema.ts',
      'package.json',
      'tsconfig.json',
    ];

    const pastasImportantes = [
      'client/src',
      'server',
      'drizzle',
    ];

    // Criar estrutura de pastas
    const pastaArquivos = resolve(pastaBackupAtual, 'arquivos');
    mkdirSync(pastaArquivos, { recursive: true });

    // Copiar arquivos importantes
    for (const arquivo of arquivosImportantes) {
      const caminhoOrigem = resolve(process.cwd(), arquivo);
      if (existsSync(caminhoOrigem)) {
        const caminhoDestino = resolve(pastaArquivos, arquivo.replace(/\//g, '_'));
        try {
          copyFileSync(caminhoOrigem, caminhoDestino);
          console.log(`✅ ${arquivo} copiado`);
        } catch (error: any) {
          console.log(`⚠️  Erro ao copiar ${arquivo}: ${error.message}`);
        }
      }
    }

    // 3. Criar arquivo de informações do backup
    const infoBackup = {
      dataHora: agora.toISOString(),
      dataHoraFormatada: agora.toLocaleString('pt-BR'),
      nomeBackup,
      versao: '1.0.0',
      arquivos: arquivosImportantes.filter(f => existsSync(resolve(process.cwd(), f))),
      database: process.env.DATABASE_URL ? 'backupado' : 'não configurado',
    };

    writeFileSync(
      resolve(pastaBackupAtual, 'info_backup.json'),
      JSON.stringify(infoBackup, null, 2),
      'utf-8'
    );

    // 4. Criar script de restauração
    const scriptRestauracao = `#!/usr/bin/env node
/**
 * Script de Restauração do Backup: ${nomeBackup}
 * Data/Hora: ${agora.toLocaleString('pt-BR')}
 * 
 * Para restaurar este backup:
 * 1. Configure a DATABASE_URL no .env
 * 2. Execute: npx tsx backups/${nomeBackup}/restaurar.ts
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { execSync } from "child_process";
import mysql from "mysql2/promise";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function restaurar() {
  const pastaBackup = resolve(process.cwd(), "backups", "${nomeBackup}");
  
  if (!existsSync(pastaBackup)) {
    console.error("❌ Pasta de backup não encontrada:", pastaBackup);
    process.exit(1);
  }

  console.log("🔄 Iniciando restauração do backup: ${nomeBackup}");
  console.log("📅 Data/Hora do backup: ${agora.toLocaleString('pt-BR')}\\n");

  try {
    // Restaurar banco de dados
    const arquivoSQL = resolve(pastaBackup, "database_${nomeBackup}.sql");
    if (existsSync(arquivoSQL) && process.env.DATABASE_URL) {
      console.log("📊 Restaurando banco de dados...");
      
      const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
      const database = url.pathname.replace('/', '');
      const user = url.username;
      const password = url.password;
      const host = url.hostname;
      const port = url.port || '3306';

      try {
        execSync(\`mysql -h \${host} -P \${port} -u \${user} -p\${password} \${database} < "\${arquivoSQL}"\`, {
          stdio: 'inherit',
          shell: true
        });
        console.log("✅ Banco de dados restaurado com sucesso!");
      } catch (error: any) {
        console.error("❌ Erro ao restaurar banco:", error.message);
        console.log("⚠️  Tente restaurar manualmente usando:");
        console.log(\`   mysql -u \${user} -p \${database} < "\${arquivoSQL}"\`);
      }
    } else {
      console.log("⚠️  Arquivo SQL não encontrado ou DATABASE_URL não configurada");
    }

    // Restaurar arquivos
    console.log("\\n📁 Restaurando arquivos...");
    const pastaArquivos = resolve(pastaBackup, "arquivos");
    
    if (existsSync(pastaArquivos)) {
      const arquivos = [
        { origem: "arquivos/.env.local", destino: ".env.local" },
        { origem: "arquivos/drizzle_schema.ts", destino: "drizzle/schema.ts" },
        { origem: "arquivos/package.json", destino: "package.json" },
        { origem: "arquivos/tsconfig.json", destino: "tsconfig.json" },
      ];

      for (const arquivo of arquivos) {
        const caminhoOrigem = resolve(pastaBackup, arquivo.origem);
        const caminhoDestino = resolve(process.cwd(), arquivo.destino);
        
        if (existsSync(caminhoOrigem)) {
          try {
            // Criar diretório se não existir
            const dir = caminhoDestino.substring(0, caminhoDestino.lastIndexOf('/'));
            if (!existsSync(dir)) {
              require('fs').mkdirSync(dir, { recursive: true });
            }
            
            copyFileSync(caminhoOrigem, caminhoDestino);
            console.log(\`✅ \${arquivo.destino} restaurado\`);
          } catch (error: any) {
            console.log(\`⚠️  Erro ao restaurar \${arquivo.destino}: \${error.message}\`);
          }
        }
      }
    }

    console.log("\\n🎉 Restauração concluída!");
    console.log("\\n⚠️  IMPORTANTE:");
    console.log("   - Verifique se todos os arquivos foram restaurados corretamente");
    console.log("   - Execute 'pnpm install' se necessário");
    console.log("   - Execute 'pnpm db:push' para sincronizar o schema");

  } catch (error: any) {
    console.error("❌ Erro durante restauração:", error.message);
    process.exit(1);
  }
}

restaurar().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});
`;

    writeFileSync(
      resolve(pastaBackupAtual, 'restaurar.ts'),
      scriptRestauracao,
      'utf-8'
    );

    // 5. Criar README do backup
    const readme = `# Backup: ${nomeBackup}

**Data/Hora:** ${agora.toLocaleString('pt-BR')}  
**Data/Hora ISO:** ${agora.toISOString()}

## Conteúdo do Backup

- ✅ Banco de dados: \`database_${nomeBackup}.sql\`
- ✅ Arquivos importantes: pasta \`arquivos/\`
- ✅ Informações: \`info_backup.json\`
- ✅ Script de restauração: \`restaurar.ts\`

## Como Restaurar

1. Configure a \`DATABASE_URL\` no arquivo \`.env\`
2. Execute o script de restauração:
   \`\`\`bash
   npx tsx backups/${nomeBackup}/restaurar.ts
   \`\`\`

## Observações

- Este backup foi criado automaticamente
- Mantenha este backup em local seguro
- Verifique a integridade antes de restaurar em produção
`;

    writeFileSync(
      resolve(pastaBackupAtual, 'README.md'),
      readme,
      'utf-8'
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ BACKUP CRIADO COM SUCESSO!");
    console.log("=".repeat(60));
    console.log(`📁 Local: ${pastaBackupAtual}`);
    console.log(`📅 Data/Hora: ${agora.toLocaleString('pt-BR')}`);
    console.log(`\n💡 Para restaurar este backup:`);
    console.log(`   npx tsx backups/${nomeBackup}/restaurar.ts`);
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("❌ Erro ao criar backup:", error.message);
    process.exit(1);
  }
}

criarBackup().catch((err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});













