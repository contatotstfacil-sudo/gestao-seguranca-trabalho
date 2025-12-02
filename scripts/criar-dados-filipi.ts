/**
 * Script para criar dados fictícios para o usuário Filipi
 * Respeitando os limites do plano Bronze:
 * - maxEmpresas: 5
 * - maxColaboradores: 20 por empresa
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  empresas, colaboradores, cargos, setores, treinamentos, epis,
  obras, tiposTreinamentos, responsaveis, asos
} from "../drizzle/schema";
import bcrypt from "bcryptjs";

// Dados fictícios
const empresasFicticias = [
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
];

const cargosFicticios = [
  "Pedreiro", "Carpinteiro", "Eletricista", "Encanador", "Pintor",
  "Soldador", "Operador de Máquinas", "Ajudante de Obra", "Mestre de Obras",
  "Engenheiro Civil", "Arquiteto", "Técnico em Segurança", "Auxiliar Administrativo",
  "Motorista", "Estoquista", "Vendedor", "Gerente de Obra", "Supervisor",
  "Técnico em Manutenção", "Auxiliar de Limpeza"
];

const setoresFicticios = [
  "Obra", "Administrativo", "Almoxarifado", "Manutenção", "Transporte",
  "Vendas", "Segurança", "Qualidade", "Produção", "Logística"
];

const nomesFicticios = [
  "João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Souza",
  "Juliana Ferreira", "Roberto Alves", "Fernanda Lima", "Ricardo Martins", "Patricia Rocha",
  "Marcos Pereira", "Camila Rodrigues", "Lucas Barbosa", "Amanda Gomes", "Thiago Ribeiro",
  "Bruna Carvalho", "Felipe Araujo", "Larissa Dias", "Gabriel Monteiro", "Isabela Castro"
];

const tiposTreinamentosFicticios = [
  { nome: "NR-10 - Segurança em Instalações Elétricas", tipoNr: "NR-10" },
  { nome: "NR-11 - Transporte de Materiais", tipoNr: "NR-11" },
  { nome: "NR-12 - Segurança em Máquinas", tipoNr: "NR-12" },
  { nome: "NR-18 - Condições de Trabalho na Construção", tipoNr: "NR-18" },
  { nome: "NR-35 - Trabalho em Altura", tipoNr: "NR-35" },
  { nome: "NR-33 - Espaço Confinado", tipoNr: "NR-33" },
  { nome: "Primeiros Socorros", tipoNr: "PS" },
  { nome: "Combate a Incêndio", tipoNr: "CI" },
];

const episFicticios = [
  { nome: "Capacete de Segurança", ca: "123456", validade: 365 },
  { nome: "Óculos de Proteção", ca: "234567", validade: 730 },
  { nome: "Protetor Auricular", ca: "345678", validade: 365 },
  { nome: "Luvas de Segurança", ca: "456789", validade: 180 },
  { nome: "Botas de Segurança", ca: "567890", validade: 365 },
  { nome: "Cinto de Segurança", ca: "678901", validade: 365 },
  { nome: "Máscara Respiratória", ca: "789012", validade: 180 },
  { nome: "Avental de Proteção", ca: "890123", validade: 365 },
];

async function criarDadosFilipi() {
  try {
    // Tentar usar DATABASE_URL ou criar conexão manual
    let connection: mysql.Connection;
    
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      // Criar conexão manual se DATABASE_URL não estiver no formato correto
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sst',
      });
    }
    
    const db = drizzle(connection);

    console.log("🔍 Buscando tenant do Filipi...");
    
    // Buscar usuário Filipi
    const [users] = await connection.execute(
      "SELECT id, tenantId, name FROM users WHERE name LIKE '%Filipi%' OR email LIKE '%filipi%' LIMIT 1"
    );
    
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error("Usuário Filipi não encontrado!");
    }
    
    const userFilipi = users[0] as any;
    const tenantId = userFilipi.tenantId;
    
    if (!tenantId) {
      throw new Error("Filipi não tem tenantId associado!");
    }
    
    console.log(`✅ Usuário encontrado: ${userFilipi.name} (ID: ${userFilipi.id}, TenantID: ${tenantId})`);
    
    // Verificar plano do tenant
    const [tenants] = await connection.execute(
      "SELECT id, plano, nome FROM tenants WHERE id = ?",
      [tenantId]
    );
    
    if (!Array.isArray(tenants) || tenants.length === 0) {
      throw new Error("Tenant não encontrado!");
    }
    
    const tenant = tenants[0] as any;
    console.log(`📦 Plano do tenant: ${tenant.plano} (${tenant.nome})`);
    
    // Verificar quantas empresas já existem
    const [empresasExistentes] = await connection.execute(
      "SELECT COUNT(*) as total FROM empresas WHERE tenantId = ?",
      [tenantId]
    );
    const totalEmpresas = (empresasExistentes as any[])[0].total;
    
    console.log(`📊 Empresas existentes: ${totalEmpresas}/5 (máximo do plano Bronze)`);
    
    if (totalEmpresas >= 5) {
      console.log("⚠️  Limite de empresas atingido! Pulando criação de empresas...");
    } else {
      // Criar empresas (máximo 5)
      const empresasParaCriar = empresasFicticias.slice(0, 5 - totalEmpresas);
      console.log(`\n🏢 Criando ${empresasParaCriar.length} empresas...`);
      
      const empresasIds: number[] = [];
      
      for (const empresaData of empresasParaCriar) {
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
      }
      
      // Criar setores para cada empresa
      console.log(`\n📁 Criando setores...`);
      const setoresIds: { [empresaId: number]: number[] } = {};
      
      for (const empresaId of empresasIds) {
        setoresIds[empresaId] = [];
        const setoresParaEmpresa = setoresFicticios.slice(0, 5); // 5 setores por empresa
        
        for (const nomeSetor of setoresParaEmpresa) {
          const [result] = await connection.execute(
            `INSERT INTO setores (tenantId, empresaId, nomeSetor, descricao, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [tenantId, empresaId, nomeSetor, `Setor ${nomeSetor} da empresa`]
          );
          
          const insertId = (result as any).insertId;
          setoresIds[empresaId].push(insertId);
        }
        console.log(`  ✅ ${setoresParaEmpresa.length} setores criados para empresa ID ${empresaId}`);
      }
      
      // Criar cargos para cada empresa
      console.log(`\n💼 Criando cargos...`);
      const cargosIds: { [empresaId: number]: number[] } = {};
      
      for (const empresaId of empresasIds) {
        cargosIds[empresaId] = [];
        const cargosParaEmpresa = cargosFicticios.slice(0, 10); // 10 cargos por empresa
        
        for (const nomeCargo of cargosParaEmpresa) {
          const [result] = await connection.execute(
            `INSERT INTO cargos (tenantId, empresaId, nomeCargo, descricao, codigoCbo, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [tenantId, empresaId, nomeCargo, `Cargo de ${nomeCargo}`, "000000"]
          );
          
          const insertId = (result as any).insertId;
          cargosIds[empresaId].push(insertId);
        }
        console.log(`  ✅ ${cargosParaEmpresa.length} cargos criados para empresa ID ${empresaId}`);
      }
      
      // Criar tipos de treinamentos
      console.log(`\n📚 Criando tipos de treinamentos...`);
      const tiposTreinamentosIds: number[] = [];
      
      for (const tipoTreinamento of tiposTreinamentosFicticios) {
        const [result] = await connection.execute(
          `INSERT INTO tiposTreinamentos (tenantId, nomeTipoTreinamento, tipoNr, descricao, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [tenantId, tipoTreinamento.nome, tipoTreinamento.tipoNr, `Treinamento ${tipoTreinamento.nome}`]
        );
        
        const insertId = (result as any).insertId;
        tiposTreinamentosIds.push(insertId);
      }
      console.log(`  ✅ ${tiposTreinamentosIds.length} tipos de treinamentos criados`);
      
      // Criar EPIs
      console.log(`\n🛡️  Criando EPIs...`);
      const episIds: number[] = [];
      
      for (const epi of episFicticios) {
        const [result] = await connection.execute(
          `INSERT INTO epis (tenantId, nomeEpi, ca, validade, descricao, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [tenantId, epi.nome, epi.ca, epi.validade, `EPI: ${epi.nome}`]
        );
        
        const insertId = (result as any).insertId;
        episIds.push(insertId);
      }
      console.log(`  ✅ ${episIds.length} EPIs criados`);
      
      // Criar responsáveis técnicos
      console.log(`\n👤 Criando responsáveis técnicos...`);
      const responsaveisIds: { [empresaId: number]: number[] } = {};
      
      for (const empresaId of empresasIds) {
        responsaveisIds[empresaId] = [];
        
        for (let i = 0; i < 2; i++) {
          const [result] = await connection.execute(
            `INSERT INTO responsaveis (tenantId, empresaId, nome, registroCrea, cargo, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              tenantId,
              empresaId,
              `Responsável Técnico ${i + 1}`,
              `CREA-${empresaId}-${i + 1}`,
              "Engenheiro de Segurança"
            ]
          );
          
          const insertId = (result as any).insertId;
          responsaveisIds[empresaId].push(insertId);
        }
      }
      console.log(`  ✅ Responsáveis técnicos criados`);
      
      // Criar colaboradores (máximo 20 por empresa)
      console.log(`\n👥 Criando colaboradores (máximo 20 por empresa)...`);
      let totalColaboradores = 0;
      
      for (const empresaId of empresasIds) {
        // Verificar quantos colaboradores já existem para esta empresa
        const [colabExistentes] = await connection.execute(
          "SELECT COUNT(*) as total FROM colaboradores WHERE empresaId = ? AND tenantId = ?",
          [empresaId, tenantId]
        );
        const totalColabEmpresa = (colabExistentes as any[])[0].total;
        
        const colaboradoresParaCriar = Math.min(20 - totalColabEmpresa, nomesFicticios.length);
        
        if (colaboradoresParaCriar <= 0) {
          console.log(`  ⚠️  Limite de colaboradores atingido para empresa ID ${empresaId}`);
          continue;
        }
        
        const cargosEmpresa = cargosIds[empresaId] || [];
        const setoresEmpresa = setoresIds[empresaId] || [];
        
        for (let i = 0; i < colaboradoresParaCriar; i++) {
          const nome = nomesFicticios[i % nomesFicticios.length];
          const cpf = `${String(10000000000 + totalColaboradores + i).padStart(11, '0')}`;
          const cargoId = cargosEmpresa[i % cargosEmpresa.length] || null;
          const setorId = setoresEmpresa[i % setoresEmpresa.length] || null;
          
          const dataAdmissao = new Date();
          dataAdmissao.setMonth(dataAdmissao.getMonth() - Math.floor(Math.random() * 12));
          
          const [result] = await connection.execute(
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
              new Date(dataAdmissao.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
            ]
          );
          
          totalColaboradores++;
        }
        
        console.log(`  ✅ ${colaboradoresParaCriar} colaboradores criados para empresa ID ${empresaId}`);
      }
      
      console.log(`\n✅ Total de colaboradores criados: ${totalColaboradores}`);
      
      // Criar alguns treinamentos
      console.log(`\n📖 Criando treinamentos...`);
      let totalTreinamentos = 0;
      
      for (const empresaId of empresasIds) {
        // Buscar colaboradores da empresa
        const [colabs] = await connection.execute(
          "SELECT id FROM colaboradores WHERE empresaId = ? AND tenantId = ? LIMIT 10",
          [empresaId, tenantId]
        );
        
        if (Array.isArray(colabs) && colabs.length > 0) {
          const tipoTreinamentoId = tiposTreinamentosIds[Math.floor(Math.random() * tiposTreinamentosIds.length)];
          const colaboradorId = (colabs[0] as any).id;
          
          const dataRealizacao = new Date();
          dataRealizacao.setMonth(dataRealizacao.getMonth() - Math.floor(Math.random() * 6));
          
          const dataValidade = new Date(dataRealizacao);
          dataValidade.setMonth(dataValidade.getMonth() + 6);
          
          await connection.execute(
            `INSERT INTO treinamentos (
              tenantId, empresaId, colaboradorId, nomeTreinamento, tipoNr,
              dataRealizacao, dataValidade, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'valido', NOW(), NOW())`,
            [
              tenantId,
              empresaId,
              colaboradorId,
              tiposTreinamentosFicticios[tiposTreinamentosIds.indexOf(tipoTreinamentoId)].nome,
              tiposTreinamentosFicticios[tiposTreinamentosIds.indexOf(tipoTreinamentoId)].tipoNr,
              dataRealizacao.toISOString().split('T')[0],
              dataValidade.toISOString().split('T')[0],
            ]
          );
          
          totalTreinamentos++;
        }
      }
      
      console.log(`  ✅ ${totalTreinamentos} treinamentos criados`);
      
      console.log(`\n🎉 Dados fictícios criados com sucesso!`);
      console.log(`\n📊 Resumo:`);
      console.log(`   - Empresas: ${empresasIds.length}`);
      console.log(`   - Colaboradores: ${totalColaboradores}`);
      console.log(`   - Cargos: ${Object.values(cargosIds).flat().length}`);
      console.log(`   - Setores: ${Object.values(setoresIds).flat().length}`);
      console.log(`   - Tipos de Treinamentos: ${tiposTreinamentosIds.length}`);
      console.log(`   - EPIs: ${episIds.length}`);
      console.log(`   - Treinamentos: ${totalTreinamentos}`);
    }
    
    await connection.end();
    console.log("\n✅ Script finalizado com sucesso!");
    
  } catch (error: any) {
    console.error("❌ Erro ao criar dados:", error.message);
    console.error(error);
    process.exit(1);
  }
}

criarDadosFilipi();

