import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });

const PERMISSOES_PADRAO = [
  // Empresas
  { codigo: "empresas.list", nome: "Listar Empresas", descricao: "Visualizar lista de empresas", modulo: "empresas", acao: "list" },
  { codigo: "empresas.create", nome: "Criar Empresa", descricao: "Cadastrar novas empresas", modulo: "empresas", acao: "create" },
  { codigo: "empresas.update", nome: "Editar Empresa", descricao: "Editar empresas existentes", modulo: "empresas", acao: "update" },
  { codigo: "empresas.delete", nome: "Excluir Empresa", descricao: "Excluir empresas", modulo: "empresas", acao: "delete" },
  { codigo: "empresas.read", nome: "Visualizar Empresa", descricao: "Visualizar detalhes de uma empresa", modulo: "empresas", acao: "read" },

  // Colaboradores
  { codigo: "colaboradores.list", nome: "Listar Colaboradores", descricao: "Visualizar lista de colaboradores", modulo: "colaboradores", acao: "list" },
  { codigo: "colaboradores.create", nome: "Criar Colaborador", descricao: "Cadastrar novos colaboradores", modulo: "colaboradores", acao: "create" },
  { codigo: "colaboradores.update", nome: "Editar Colaborador", descricao: "Editar colaboradores existentes", modulo: "colaboradores", acao: "update" },
  { codigo: "colaboradores.delete", nome: "Excluir Colaborador", descricao: "Excluir colaboradores", modulo: "colaboradores", acao: "delete" },
  { codigo: "colaboradores.read", nome: "Visualizar Colaborador", descricao: "Visualizar detalhes de um colaborador", modulo: "colaboradores", acao: "read" },

  // Obras
  { codigo: "obras.list", nome: "Listar Obras", descricao: "Visualizar lista de obras", modulo: "obras", acao: "list" },
  { codigo: "obras.create", nome: "Criar Obra", descricao: "Cadastrar novas obras", modulo: "obras", acao: "create" },
  { codigo: "obras.update", nome: "Editar Obra", descricao: "Editar obras existentes", modulo: "obras", acao: "update" },
  { codigo: "obras.delete", nome: "Excluir Obra", descricao: "Excluir obras", modulo: "obras", acao: "delete" },
  { codigo: "obras.read", nome: "Visualizar Obra", descricao: "Visualizar detalhes de uma obra", modulo: "obras", acao: "read" },

  // Cargos
  { codigo: "cargos.list", nome: "Listar Cargos", descricao: "Visualizar lista de cargos", modulo: "cargos", acao: "list" },
  { codigo: "cargos.create", nome: "Criar Cargo", descricao: "Cadastrar novos cargos", modulo: "cargos", acao: "create" },
  { codigo: "cargos.update", nome: "Editar Cargo", descricao: "Editar cargos existentes", modulo: "cargos", acao: "update" },
  { codigo: "cargos.delete", nome: "Excluir Cargo", descricao: "Excluir cargos", modulo: "cargos", acao: "delete" },

  // Setores
  { codigo: "setores.list", nome: "Listar Setores", descricao: "Visualizar lista de setores", modulo: "setores", acao: "list" },
  { codigo: "setores.create", nome: "Criar Setor", descricao: "Cadastrar novos setores", modulo: "setores", acao: "create" },
  { codigo: "setores.update", nome: "Editar Setor", descricao: "Editar setores existentes", modulo: "setores", acao: "update" },
  { codigo: "setores.delete", nome: "Excluir Setor", descricao: "Excluir setores", modulo: "setores", acao: "delete" },

  // Treinamentos
  { codigo: "treinamentos.list", nome: "Listar Treinamentos", descricao: "Visualizar lista de treinamentos", modulo: "treinamentos", acao: "list" },
  { codigo: "treinamentos.create", nome: "Criar Treinamento", descricao: "Cadastrar novos treinamentos", modulo: "treinamentos", acao: "create" },
  { codigo: "treinamentos.update", nome: "Editar Treinamento", descricao: "Editar treinamentos existentes", modulo: "treinamentos", acao: "update" },
  { codigo: "treinamentos.delete", nome: "Excluir Treinamento", descricao: "Excluir treinamentos", modulo: "treinamentos", acao: "delete" },
  { codigo: "treinamentos.emitir_certificado", nome: "Emitir Certificado", descricao: "Emitir certificados de treinamento", modulo: "treinamentos", acao: "emitir_certificado" },

  // Tipos de Treinamentos
  { codigo: "tipos_treinamentos.list", nome: "Listar Tipos de Treinamentos", descricao: "Visualizar lista de tipos de treinamentos", modulo: "tipos_treinamentos", acao: "list" },
  { codigo: "tipos_treinamentos.create", nome: "Criar Tipo de Treinamento", descricao: "Cadastrar novos tipos de treinamentos", modulo: "tipos_treinamentos", acao: "create" },
  { codigo: "tipos_treinamentos.update", nome: "Editar Tipo de Treinamento", descricao: "Editar tipos de treinamentos existentes", modulo: "tipos_treinamentos", acao: "update" },
  { codigo: "tipos_treinamentos.delete", nome: "Excluir Tipo de Treinamento", descricao: "Excluir tipos de treinamentos", modulo: "tipos_treinamentos", acao: "delete" },

  // Fichas de EPI
  { codigo: "fichas_epi.list", nome: "Listar Fichas de EPI", descricao: "Visualizar lista de fichas de EPI", modulo: "fichas_epi", acao: "list" },
  { codigo: "fichas_epi.create", nome: "Criar Ficha de EPI", descricao: "Cadastrar novas fichas de EPI", modulo: "fichas_epi", acao: "create" },
  { codigo: "fichas_epi.update", nome: "Editar Ficha de EPI", descricao: "Editar fichas de EPI existentes", modulo: "fichas_epi", acao: "update" },
  { codigo: "fichas_epi.delete", nome: "Excluir Ficha de EPI", descricao: "Excluir fichas de EPI", modulo: "fichas_epi", acao: "delete" },
  
  // EPIs
  { codigo: "epis.list", nome: "Listar EPIs", descricao: "Visualizar lista de EPIs", modulo: "epis", acao: "list" },
  { codigo: "epis.create", nome: "Criar EPI", descricao: "Cadastrar novos EPIs", modulo: "epis", acao: "create" },
  { codigo: "epis.update", nome: "Editar EPI", descricao: "Editar EPIs existentes", modulo: "epis", acao: "update" },
  { codigo: "epis.delete", nome: "Excluir EPI", descricao: "Excluir EPIs", modulo: "epis", acao: "delete" },
  { codigo: "epis.emitir_ficha", nome: "Emitir Ficha de EPI", descricao: "Emitir fichas de EPI", modulo: "epis", acao: "emitir_ficha" },

  // Tipos de EPIs
  { codigo: "tipos_epis.list", nome: "Listar Tipos de EPIs", descricao: "Visualizar lista de tipos de EPIs", modulo: "tipos_epis", acao: "list" },
  { codigo: "tipos_epis.create", nome: "Criar Tipo de EPI", descricao: "Cadastrar novos tipos de EPIs", modulo: "tipos_epis", acao: "create" },
  { codigo: "tipos_epis.update", nome: "Editar Tipo de EPI", descricao: "Editar tipos de EPIs existentes", modulo: "tipos_epis", acao: "update" },
  { codigo: "tipos_epis.delete", nome: "Excluir Tipo de EPI", descricao: "Excluir tipos de EPIs", modulo: "tipos_epis", acao: "delete" },

  // Ordens de Serviço
  { codigo: "ordens_servico.list", nome: "Listar Ordens de Serviço", descricao: "Visualizar lista de ordens de serviço", modulo: "ordens_servico", acao: "list" },
  { codigo: "ordens_servico.create", nome: "Criar Ordem de Serviço", descricao: "Emitir novas ordens de serviço", modulo: "ordens_servico", acao: "create" },
  { codigo: "ordens_servico.update", nome: "Editar Ordem de Serviço", descricao: "Editar ordens de serviço existentes", modulo: "ordens_servico", acao: "update" },
  { codigo: "ordens_servico.delete", nome: "Excluir Ordem de Serviço", descricao: "Excluir ordens de serviço", modulo: "ordens_servico", acao: "delete" },
  { codigo: "ordens_servico.download", nome: "Baixar Ordem de Serviço", descricao: "Baixar ordens de serviço em PDF", modulo: "ordens_servico", acao: "download" },

  // Modelos de Ordem de Serviço
  { codigo: "modelos_os.list", nome: "Listar Modelos de OS", descricao: "Visualizar lista de modelos de ordem de serviço", modulo: "modelos_os", acao: "list" },
  { codigo: "modelos_os.create", nome: "Criar Modelo de OS", descricao: "Criar novos modelos de ordem de serviço", modulo: "modelos_os", acao: "create" },
  { codigo: "modelos_os.update", nome: "Editar Modelo de OS", descricao: "Editar modelos de ordem de serviço existentes", modulo: "modelos_os", acao: "update" },
  { codigo: "modelos_os.delete", nome: "Excluir Modelo de OS", descricao: "Excluir modelos de ordem de serviço", modulo: "modelos_os", acao: "delete" },

  // Modelos de Certificados
  { codigo: "modelos_certificados.list", nome: "Listar Modelos de Certificados", descricao: "Visualizar lista de modelos de certificados", modulo: "modelos_certificados", acao: "list" },
  { codigo: "modelos_certificados.create", nome: "Criar Modelo de Certificado", descricao: "Criar novos modelos de certificados", modulo: "modelos_certificados", acao: "create" },
  { codigo: "modelos_certificados.update", nome: "Editar Modelo de Certificado", descricao: "Editar modelos de certificados existentes", modulo: "modelos_certificados", acao: "update" },
  { codigo: "modelos_certificados.delete", nome: "Excluir Modelo de Certificado", descricao: "Excluir modelos de certificados", modulo: "modelos_certificados", acao: "delete" },

  // Responsáveis
  { codigo: "responsaveis.list", nome: "Listar Responsáveis", descricao: "Visualizar lista de responsáveis", modulo: "responsaveis", acao: "list" },
  { codigo: "responsaveis.create", nome: "Criar Responsável", descricao: "Cadastrar novos responsáveis", modulo: "responsaveis", acao: "create" },
  { codigo: "responsaveis.update", nome: "Editar Responsável", descricao: "Editar responsáveis existentes", modulo: "responsaveis", acao: "update" },
  { codigo: "responsaveis.delete", nome: "Excluir Responsável", descricao: "Excluir responsáveis", modulo: "responsaveis", acao: "delete" },

  // Riscos Ocupacionais
  { codigo: "riscos_ocupacionais.list", nome: "Listar Riscos Ocupacionais", descricao: "Visualizar lista de riscos ocupacionais", modulo: "riscos_ocupacionais", acao: "list" },
  { codigo: "riscos_ocupacionais.create", nome: "Criar Risco Ocupacional", descricao: "Cadastrar novos riscos ocupacionais", modulo: "riscos_ocupacionais", acao: "create" },
  { codigo: "riscos_ocupacionais.update", nome: "Editar Risco Ocupacional", descricao: "Editar riscos ocupacionais existentes", modulo: "riscos_ocupacionais", acao: "update" },
  { codigo: "riscos_ocupacionais.delete", nome: "Excluir Risco Ocupacional", descricao: "Excluir riscos ocupacionais", modulo: "riscos_ocupacionais", acao: "delete" },

  // Usuários do Sistema
  { codigo: "usuarios.list", nome: "Listar Usuários", descricao: "Visualizar lista de usuários do sistema", modulo: "usuarios", acao: "list" },
  { codigo: "usuarios.create", nome: "Criar Usuário", descricao: "Cadastrar novos usuários", modulo: "usuarios", acao: "create" },
  { codigo: "usuarios.update", nome: "Editar Usuário", descricao: "Editar usuários existentes", modulo: "usuarios", acao: "update" },
  { codigo: "usuarios.delete", nome: "Excluir Usuário", descricao: "Excluir usuários", modulo: "usuarios", acao: "delete" },
  { codigo: "usuarios.gerenciar_permissoes", nome: "Gerenciar Permissões", descricao: "Gerenciar permissões de usuários", modulo: "usuarios", acao: "gerenciar_permissoes" },

  // Dashboard
  { codigo: "dashboard.view", nome: "Visualizar Dashboard", descricao: "Acessar o dashboard principal", modulo: "dashboard", acao: "view" },
  { codigo: "dashboard.create", nome: "Criar Dashboard", descricao: "Criar no dashboard", modulo: "dashboard", acao: "create" },
  { codigo: "dashboard.update", nome: "Editar Dashboard", descricao: "Editar no dashboard", modulo: "dashboard", acao: "update" },
  { codigo: "dashboard.delete", nome: "Excluir Dashboard", descricao: "Excluir no dashboard", modulo: "dashboard", acao: "delete" },

  // Relatórios
  { codigo: "relatorios.list", nome: "Listar Relatórios", descricao: "Visualizar lista de relatórios", modulo: "relatorios", acao: "list" },
  { codigo: "relatorios.create", nome: "Criar Relatório", descricao: "Criar novos relatórios", modulo: "relatorios", acao: "create" },
  { codigo: "relatorios.update", nome: "Editar Relatório", descricao: "Editar relatórios existentes", modulo: "relatorios", acao: "update" },
  { codigo: "relatorios.delete", nome: "Excluir Relatório", descricao: "Excluir relatórios", modulo: "relatorios", acao: "delete" },
];

async function seedPermissoes() {
  let connection;
  try {
    const databaseUrl = process.env.DATABASE_URL || "mysql://root:senha@localhost:3306/sst";
    console.log("Conectando ao banco de dados...");
    
    const url = new URL(databaseUrl);
    const dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log("Conectado ao banco de dados!");
    console.log("\nCriando permissões padrão...\n");
    
    let criadas = 0;
    let existentes = 0;
    
    for (const permissao of PERMISSOES_PADRAO) {
      try {
        await connection.execute(
          `INSERT INTO permissoes (codigo, nome, descricao, modulo, acao) 
           VALUES (?, ?, ?, ?, ?)`,
          [permissao.codigo, permissao.nome, permissao.descricao, permissao.modulo, permissao.acao]
        );
        console.log(`✓ Criada: ${permissao.codigo}`);
        criadas++;
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          console.log(`- Já existe: ${permissao.codigo}`);
          existentes++;
        } else {
          console.error(`✗ Erro ao criar ${permissao.codigo}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Processo concluído!`);
    console.log(`   Criadas: ${criadas}`);
    console.log(`   Já existentes: ${existentes}`);
    console.log(`   Total: ${PERMISSOES_PADRAO.length}`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar permissões:", error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

seedPermissoes();

