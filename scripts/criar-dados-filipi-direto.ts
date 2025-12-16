/**
 * Script para criar dados fictícios para o usuário Filipi
 * Usa conexão direta e tenta diferentes métodos
 */

import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), ".env") });

async function criarDadosFilipi() {
  let connection: mysql.Connection | null = null;
  
  try {
    console.log("🔍 Buscando configuração do banco...");
    
    // Tentar diferentes formas de conexão
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
      console.log("✅ Usando DATABASE_URL do .env");
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else if (process.env.DB_HOST || process.env.DB_USER) {
      console.log("✅ Usando variáveis individuais do .env");
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sst',
      });
    } else {
      // Tentar valores padrão do MySQL local
      console.log("⚠️  DATABASE_URL não configurado, tentando conexão padrão...");
      console.log("💡 Configure DATABASE_URL=mysql://root:senha@localhost:3306/sst no .env");
      
      // Tentar sem senha primeiro (comum em desenvolvimento)
      try {
        connection = await mysql.createConnection({
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: '',
          database: 'sst',
        });
        console.log("✅ Conectado sem senha!");
      } catch (error: any) {
        console.error("❌ Não foi possível conectar com valores padrão");
        console.error("\n💡 Por favor, configure o DATABASE_URL no arquivo .env:");
        console.error("   DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/sst");
        throw new Error("DATABASE_URL não configurado e conexão padrão falhou");
      }
    }
    
    console.log("✅ Conectado ao banco de dados!\n");
    
    // Buscar tenant do Filipi
    console.log("🔍 Buscando tenant do Filipi...");
    const [users] = await connection.execute(
      "SELECT id, tenantId, name FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1"
    );
    
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error("Usuário Filipi não encontrado! Certifique-se de que o usuário existe no banco.");
    }
    
    const userFilipi = users[0] as any;
    const tenantId = userFilipi.tenantId;
    
    if (!tenantId) {
      throw new Error("Filipi não tem tenantId associado!");
    }
    
    console.log(`✅ Usuário encontrado: ${userFilipi.name} (ID: ${userFilipi.id}, TenantID: ${tenantId})\n`);
    
    // Verificar quantas empresas já existem
    const [empresasExistentes] = await connection.execute(
      "SELECT COUNT(*) as total FROM empresas WHERE tenantId = ?",
      [tenantId]
    );
    const totalEmpresas = (empresasExistentes as any[])[0].total;
    
    console.log(`📊 Empresas existentes: ${totalEmpresas}/5 (máximo do plano Bronze)\n`);
    
    if (totalEmpresas >= 5) {
      console.log("⚠️  Limite de empresas atingido! Pulando criação de empresas...\n");
    } else {
      // Criar empresas
      const empresasParaCriar = [
        {
          razaoSocial: "Construtora Filipi & Associados Ltda",
          cnpj: "12345678000190",
          grauRisco: "4",
          cnae: "4110700",
          responsavelTecnico: "Filipi José Silva",
          emailContato: "contato@filipiconstrucoes.com.br",
          tipoLogradouro: "Avenida",
          nomeLogradouro: "Principal",
          numeroEndereco: "1234",
          complementoEndereco: "Sala 101",
          bairroEndereco: "Centro",
          cidadeEndereco: "São Paulo",
          estadoEndereco: "SP",
          cep: "01310100",
          descricaoAtividade: "Construção de edifícios e obras de infraestrutura",
        },
        {
          razaoSocial: "Filipi Engenharia e Projetos ME",
          cnpj: "98765432000111",
          grauRisco: "3",
          cnae: "7111100",
          responsavelTecnico: "Filipi José Silva",
          emailContato: "engenharia@filipiproj.com.br",
          tipoLogradouro: "Rua",
          nomeLogradouro: "Engenheiros",
          numeroEndereco: "567",
          complementoEndereco: "",
          bairroEndereco: "Jardim das Flores",
          cidadeEndereco: "Campinas",
          estadoEndereco: "SP",
          cep: "13000000",
          descricaoAtividade: "Serviços de engenharia e projetos",
        },
        {
          razaoSocial: "Filipi Serviços de Manutenção Ltda",
          cnpj: "11223344000155",
          grauRisco: "2",
          cnae: "4321500",
          responsavelTecnico: "Filipi José Silva",
          emailContato: "manutencao@filipiservicos.com.br",
          tipoLogradouro: "Rua",
          nomeLogradouro: "Manutenção",
          numeroEndereco: "890",
          complementoEndereco: "Galpão 2",
          bairroEndereco: "Industrial",
          cidadeEndereco: "Guarulhos",
          estadoEndereco: "SP",
          cep: "07000000",
          descricaoAtividade: "Serviços de manutenção e reparo",
        },
        {
          razaoSocial: "Filipi Transportes e Logística ME",
          cnpj: "55667788000122",
          grauRisco: "3",
          cnae: "4923000",
          responsavelTecnico: "Filipi José Silva",
          emailContato: "transporte@filipilog.com.br",
          tipoLogradouro: "Avenida",
          nomeLogradouro: "Transportes",
          numeroEndereco: "2345",
          complementoEndereco: "",
          bairroEndereco: "Logística",
          cidadeEndereco: "São Bernardo do Campo",
          estadoEndereco: "SP",
          cep: "09700000",
          descricaoAtividade: "Transporte rodoviário de cargas",
        },
        {
          razaoSocial: "Filipi Comércio de Materiais de Construção Ltda",
          cnpj: "99887766000133",
          grauRisco: "1",
          cnae: "4663100",
          responsavelTecnico: "Filipi José Silva",
          emailContato: "vendas@filipimateriais.com.br",
          tipoLogradouro: "Rua",
          nomeLogradouro: "Comércio",
          numeroEndereco: "678",
          complementoEndereco: "Loja 1",
          bairroEndereco: "Comercial",
          cidadeEndereco: "Osasco",
          estadoEndereco: "SP",
          cep: "06000000",
          descricaoAtividade: "Comércio varejista de materiais de construção",
        },
      ].slice(0, 5 - totalEmpresas);
      
      console.log(`🏢 Criando ${empresasParaCriar.length} empresas...`);
      
      const empresasIds: number[] = [];
      
      for (const empresaData of empresasParaCriar) {
        try {
          const [result] = await connection.execute(
            `INSERT INTO empresas (
              tenantId, razaoSocial, cnpj, grauRisco, cnae, responsavelTecnico,
              emailContato, tipoLogradouro, nomeLogradouro, numeroEndereco,
              complementoEndereco, bairroEndereco, cidadeEndereco, estadoEndereco, cep,
              descricaoAtividade, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativa', NOW(), NOW())`,
            [
              tenantId,
              empresaData.razaoSocial,
              empresaData.cnpj,
              empresaData.grauRisco,
              empresaData.cnae,
              empresaData.responsavelTecnico,
              empresaData.emailContato,
              empresaData.tipoLogradouro,
              empresaData.nomeLogradouro,
              empresaData.numeroEndereco,
              empresaData.complementoEndereco,
              empresaData.bairroEndereco,
              empresaData.cidadeEndereco,
              empresaData.estadoEndereco,
              empresaData.cep,
              empresaData.descricaoAtividade,
            ]
          );
          
          const insertId = (result as any).insertId;
          empresasIds.push(insertId);
          console.log(`  ✅ Empresa criada: ${empresaData.razaoSocial} (ID: ${insertId})`);
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            // Buscar ID da empresa existente
            const [existing] = await connection.execute(
              "SELECT id FROM empresas WHERE tenantId = ? AND cnpj = ? LIMIT 1",
              [tenantId, empresaData.cnpj]
            );
            if (Array.isArray(existing) && existing.length > 0) {
              empresasIds.push((existing[0] as any).id);
              console.log(`  ⚠️  Empresa já existe: ${empresaData.razaoSocial} (ID: ${(existing[0] as any).id})`);
            }
          } else {
            console.error(`  ❌ Erro ao criar empresa ${empresaData.razaoSocial}: ${error.message}`);
          }
        }
      }
      
      if (empresasIds.length === 0) {
        console.log("\n⚠️  Nenhuma empresa nova foi criada. Continuando com empresas existentes...\n");
        // Buscar empresas existentes
        const [existingEmpresas] = await connection.execute(
          "SELECT id FROM empresas WHERE tenantId = ? LIMIT 5",
          [tenantId]
        );
        if (Array.isArray(existingEmpresas)) {
          empresasIds.push(...existingEmpresas.map((e: any) => e.id));
        }
      }
      
      if (empresasIds.length > 0) {
        console.log(`\n📁 Criando setores e cargos para ${empresasIds.length} empresas...`);
        
        // Criar setores e cargos para cada empresa (simplificado)
        for (const empresaId of empresasIds) {
          // Criar alguns setores
          const setores = ['Obra', 'Administrativo', 'Almoxarifado', 'Manutenção', 'Transporte'];
          for (const nomeSetor of setores) {
            try {
              await connection.execute(
                `INSERT INTO setores (tenantId, empresaId, nomeSetor, descricao, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE updatedAt = NOW()`,
                [tenantId, empresaId, nomeSetor, `Setor ${nomeSetor}`]
              );
            } catch (error: any) {
              // Ignorar erros de duplicata
            }
          }
          
          // Criar alguns cargos
          const cargos = ['Pedreiro', 'Carpinteiro', 'Eletricista', 'Encanador', 'Pintor', 'Soldador', 'Operador de Máquinas', 'Ajudante de Obra', 'Mestre de Obras', 'Engenheiro Civil'];
          for (const nomeCargo of cargos) {
            try {
              await connection.execute(
                `INSERT INTO cargos (tenantId, empresaId, nomeCargo, descricao, codigoCbo, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, '000000', NOW(), NOW())
                 ON DUPLICATE KEY UPDATE updatedAt = NOW()`,
                [tenantId, empresaId, nomeCargo, `Cargo de ${nomeCargo}`]
              );
            } catch (error: any) {
              // Ignorar erros de duplicata
            }
          }
        }
        
        console.log(`  ✅ Setores e cargos criados\n`);
        
        // Criar colaboradores (máximo 20 por empresa)
        console.log(`👥 Criando colaboradores (máximo 20 por empresa)...`);
        let totalColaboradores = 0;
        const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Juliana Ferreira', 'Roberto Alves', 'Fernanda Lima', 'Ricardo Martins', 'Patricia Rocha', 'Marcos Pereira', 'Camila Rodrigues', 'Lucas Barbosa', 'Amanda Gomes', 'Thiago Ribeiro', 'Bruna Carvalho', 'Felipe Araujo', 'Larissa Dias', 'Gabriel Monteiro', 'Isabela Castro'];
        
        for (const empresaId of empresasIds.slice(0, 2)) { // Apenas 2 primeiras empresas
          const [colabExistentes] = await connection.execute(
            "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ? AND tenantId = ?",
            [empresaId, tenantId]
          );
          const totalColabEmpresa = (colabExistentes as any[])[0].total;
          
          const colaboradoresParaCriar = Math.min(20 - totalColabEmpresa, nomes.length);
          
          if (colaboradoresParaCriar <= 0) {
            console.log(`  ⚠️  Limite de colaboradores atingido para empresa ID ${empresaId}`);
            continue;
          }
          
          // Buscar cargos e setores da empresa
          const [cargosEmpresa] = await connection.execute(
            "SELECT id FROM cargos WHERE tenantId = ? AND empresaId = ? LIMIT 10",
            [tenantId, empresaId]
          );
          const [setoresEmpresa] = await connection.execute(
            "SELECT id FROM setores WHERE tenantId = ? AND empresaId = ? LIMIT 5",
            [tenantId, empresaId]
          );
          
          const cargosIds = Array.isArray(cargosEmpresa) ? cargosEmpresa.map((c: any) => c.id) : [];
          const setoresIds = Array.isArray(setoresEmpresa) ? setoresEmpresa.map((s: any) => s.id) : [];
          
          for (let i = 0; i < colaboradoresParaCriar; i++) {
            try {
              const nome = nomes[i % nomes.length];
              const cpf = `${String(10000000000 + totalColaboradores + i).padStart(11, '0')}`;
              const cargoId = cargosIds[i % cargosIds.length] || null;
              const setorId = setoresIds[i % setoresIds.length] || null;
              
              const dataAdmissao = new Date();
              dataAdmissao.setMonth(dataAdmissao.getMonth() - Math.floor(Math.random() * 12));
              
              await connection.execute(
                `INSERT INTO colaboradores (
                  tenantId, empresaId, nomeCompleto, cargoId, setorId, cpf, rg, pis,
                  dataAdmissao, dataPrimeiroAso, validadeAso, status, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', NOW(), NOW())`,
                [
                  tenantId,
                  empresaId,
                  nome,
                  cargoId,
                  setorId,
                  cpf,
                  `RG${String(i + 1).padStart(9, '0')}`,
                  `${String(10000000000 + totalColaboradores + i).padStart(11, '0')}`,
                  dataAdmissao.toISOString().split('T')[0],
                  dataAdmissao.toISOString().split('T')[0],
                  new Date(dataAdmissao.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                ]
              );
              
              totalColaboradores++;
            } catch (error: any) {
              if (error.code !== 'ER_DUP_ENTRY') {
                console.error(`  ⚠️  Erro ao criar colaborador: ${error.message.substring(0, 100)}`);
              }
            }
          }
          
          console.log(`  ✅ ${colaboradoresParaCriar} colaboradores criados para empresa ID ${empresaId}`);
        }
        
        console.log(`\n✅ Total de colaboradores criados: ${totalColaboradores}`);
      }
    }
    
    // Resumo final
    const [resumo] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM empresas WHERE tenantId = ?) AS total_empresas,
        (SELECT COUNT(*) FROM colaboradores WHERE tenantId = ?) AS total_colaboradores,
        (SELECT COUNT(*) FROM cargos WHERE tenantId = ?) AS total_cargos,
        (SELECT COUNT(*) FROM setores WHERE tenantId = ?) AS total_setores
    `, [tenantId, tenantId, tenantId, tenantId]);
    
    const resumoData = (resumo as any[])[0];
    console.log(`\n📊 RESUMO FINAL:`);
    console.log(`   ✅ Empresas: ${resumoData.total_empresas}`);
    console.log(`   ✅ Colaboradores: ${resumoData.total_colaboradores}`);
    console.log(`   ✅ Cargos: ${resumoData.total_cargos}`);
    console.log(`   ✅ Setores: ${resumoData.total_setores}`);
    
    await connection.end();
    console.log("\n🎉 Dados criados com sucesso!");
    
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

criarDadosFilipi();








