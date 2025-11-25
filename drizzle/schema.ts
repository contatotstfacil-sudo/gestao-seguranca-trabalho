import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date } from "drizzle-orm/mysql-core";

/**
 * Tenants (Workspaces) - Isolamento de dados por cliente
 * Cada cliente que compra o sistema recebe um tenant único
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  plano: mysqlEnum("plano", ["basico", "profissional"]).notNull(),
  status: mysqlEnum("status", ["ativo", "suspenso", "cancelado"]).default("ativo").notNull(),
  dataInicio: date("dataInicio").notNull(),
  dataFim: date("dataFim"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Core user table backing auth flow.
 * Agora vinculado a um tenant para isolamento completo
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"), // NULL apenas para super_admin
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["super_admin", "tenant_admin", "user", "admin", "gestor", "tecnico"]).default("user").notNull(),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Empresas - Cadastro de empresas clientes
 */
export const empresas = mysqlTable("empresas", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull(), // Removido unique global, agora único por tenant
  grauRisco: varchar("grauRisco", { length: 50 }),
  cnae: varchar("cnae", { length: 20 }),
  responsavelTecnico: varchar("responsavelTecnico", { length: 255 }),
  emailContato: varchar("emailContato", { length: 320 }),
  tipoLogradouro: varchar("tipoLogradouro", { length: 50 }),
  nomeLogradouro: varchar("nomeLogradouro", { length: 255 }),
  numeroEndereco: varchar("numeroEndereco", { length: 20 }),
  complementoEndereco: varchar("complementoEndereco", { length: 255 }),
  cidadeEndereco: varchar("cidadeEndereco", { length: 255 }),
  estadoEndereco: varchar("estadoEndereco", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  descricaoAtividade: text("descricaoAtividade"),
  status: mysqlEnum("status", ["ativa", "inativa"]).default("ativa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = typeof empresas.$inferInsert;

/**
 * Colaboradores - Cadastro de funcionários
 */
export const colaboradores = mysqlTable("colaboradores", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  cargoId: int("cargoId"),
  setorId: int("setorId"),
  empresaId: int("empresaId").notNull(),
  obraId: int("obraId"),
  dataAdmissao: date("dataAdmissao"),
  dataPrimeiroAso: date("dataPrimeiroAso"),
  validadeAso: date("validadeAso"),
  rg: varchar("rg", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  pis: varchar("pis", { length: 20 }),
  dataNascimento: date("dataNascimento"),
  cidadeNascimento: varchar("cidadeNascimento", { length: 255 }),
  estadoNascimento: varchar("estadoNascimento", { length: 2 }),
  sexo: mysqlEnum("sexo", ["masculino", "feminino", "outro"]),
  setor: varchar("setor", { length: 255 }),
  tipoLogradouro: varchar("tipoLogradouro", { length: 50 }),
  nomeLogradouro: varchar("nomeLogradouro", { length: 255 }),
  numeroEndereco: varchar("numeroEndereco", { length: 20 }),
  complementoEndereco: varchar("complementoEndereco", { length: 255 }),
  cidadeEndereco: varchar("cidadeEndereco", { length: 255 }),
  estadoEndereco: varchar("estadoEndereco", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  fotoUrl: text("fotoUrl"),
  telefonePrincipal: varchar("telefonePrincipal", { length: 20 }),
  telefoneRecado: varchar("telefoneRecado", { length: 20 }),
  nomePessoaRecado: varchar("nomePessoaRecado", { length: 255 }),
  grauParentesco: varchar("grauParentesco", { length: 50 }),
  observacoes: text("observacoes"),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertColaborador = typeof colaboradores.$inferInsert;

/**
 * ASOs - Gestão de Atestados de Saúde Ocupacional
 */
export const asos = mysqlTable("asos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  colaboradorId: int("colaboradorId").notNull(),
  empresaId: int("empresaId").notNull(),
  numeroAso: varchar("numeroAso", { length: 100 }),
  tipoAso: mysqlEnum("tipoAso", ["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional"]).notNull(),
  dataEmissao: date("dataEmissao").notNull(),
  dataValidade: date("dataValidade").notNull(),
  medicoResponsavel: varchar("medicoResponsavel", { length: 255 }),
  clinicaMedica: varchar("clinicaMedica", { length: 255 }),
  crmMedico: varchar("crmMedico", { length: 50 }),
  apto: mysqlEnum("apto", ["sim", "nao", "apto_com_restricoes"]).notNull(),
  restricoes: text("restricoes"),
  observacoes: text("observacoes"),
  anexoUrl: varchar("anexoUrl", { length: 500 }),
  status: mysqlEnum("status", ["ativo", "vencido"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aso = typeof asos.$inferSelect;
export type InsertAso = typeof asos.$inferInsert;

/**
 * Obras - Cadastro de obras por empresa
 */
export const obras = mysqlTable("obras", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeObra: varchar("nomeObra", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  cno: varchar("cno", { length: 20 }),
  cnae: varchar("cnae", { length: 20 }),
  descricaoAtividade: text("descricaoAtividade"),
  grauRisco: varchar("grauRisco", { length: 50 }),
  quantidadePrevistoColaboradores: int("quantidadePrevistoColaboradores"),
  tipoLogradouro: varchar("tipoLogradouro", { length: 50 }),
  nomeLogradouro: varchar("nomeLogradouro", { length: 255 }),
  numeroEndereco: varchar("numeroEndereco", { length: 20 }),
  complementoEndereco: varchar("complementoEndereco", { length: 255 }),
  bairroEndereco: varchar("bairroEndereco", { length: 255 }),
  cidadeEndereco: varchar("cidadeEndereco", { length: 255 }),
  estadoEndereco: varchar("estadoEndereco", { length: 2 }),
  cepEndereco: varchar("cepEndereco", { length: 10 }),
  endereco: text("endereco"),
  empresaId: int("empresaId").notNull(),
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  status: mysqlEnum("status", ["ativa", "concluida"]).default("ativa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Obra = typeof obras.$inferSelect;
export type InsertObra = typeof obras.$inferInsert;

/**
 * Treinamentos - Gestão de treinamentos obrigatórios por NR
 */
export const treinamentos = mysqlTable("treinamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeTreinamento: varchar("nomeTreinamento", { length: 255 }).notNull(),
  tipoNr: varchar("tipoNr", { length: 50 }),
  colaboradorId: int("colaboradorId").notNull(),
  empresaId: int("empresaId").notNull(),
  dataRealizacao: date("dataRealizacao"),
  dataValidade: date("dataValidade"),
  status: mysqlEnum("status", ["valido", "vencido", "a_vencer"]).default("valido").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Treinamento = typeof treinamentos.$inferSelect;
export type InsertTreinamento = typeof treinamentos.$inferInsert;

/**
 * Tipos de EPIs - Cadastro de tipos de equipamentos de proteção individual
 */
export const tiposEpis = mysqlTable("tiposEpis", {
  id: int("id").autoincrement().primaryKey(),
  tipoEpi: varchar("tipoEpi", { length: 255 }).notNull(),
  caNumero: varchar("caNumero", { length: 50 }),
  fabricante: varchar("fabricante", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TipoEpi = typeof tiposEpis.$inferSelect;
export type InsertTipoEpi = typeof tiposEpis.$inferInsert;

/**
 * EPIs - Controle de entrega e validade de equipamentos de proteção
 */
export const epis = mysqlTable("epis", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeEquipamento: varchar("nomeEquipamento", { length: 255 }).notNull(),
  tipoEpiId: int("tipoEpiId"),
  colaboradorId: int("colaboradorId").notNull(),
  empresaId: int("empresaId").notNull(),
  dataEntrega: date("dataEntrega"),
  dataValidade: date("dataValidade"),
  status: mysqlEnum("status", ["em_uso", "vencido", "devolvido"]).default("em_uso").notNull(),
  quantidade: int("quantidade").default(1),
  caNumero: varchar("caNumero", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Epi = typeof epis.$inferSelect;
export type InsertEpi = typeof epis.$inferInsert;

/**
 * Fichas EPI Emitidas - Registro das fichas de EPI geradas
 */
export const fichasEpiEmitidas = mysqlTable("fichasEpiEmitidas", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  empresaId: int("empresaId").notNull(),
  colaboradorId: int("colaboradorId").notNull(),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
  caminhoArquivo: varchar("caminhoArquivo", { length: 500 }),
  urlArquivo: varchar("urlArquivo", { length: 500 }),
  dataEmissao: timestamp("dataEmissao").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FichaEpiEmitida = typeof fichasEpiEmitidas.$inferSelect;
export type InsertFichaEpiEmitida = typeof fichasEpiEmitidas.$inferInsert;

/**
 * Cargos - Cadastro de funções/cargos
 */
export const cargos = mysqlTable("cargos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeCargo: varchar("nomeCargo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  codigoCbo: varchar("codigoCbo", { length: 20 }),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cargo = typeof cargos.$inferSelect;
export type InsertCargo = typeof cargos.$inferInsert;

/**
 * Cargos CBO - Banco de dados de cargos conforme Classificação Brasileira de Ocupações
 * Tabela de referência para preenchimento automático no cadastro de cargos
 */
export const cargosCbo = mysqlTable("cargosCbo", {
  id: int("id").autoincrement().primaryKey(),
  codigoCbo: varchar("codigoCbo", { length: 20 }).notNull().unique(),
  nomeCargo: varchar("nomeCargo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  familiaOcupacional: varchar("familiaOcupacional", { length: 255 }),
  sinonimia: text("sinonimia"), // Nomes alternativos/variantes do cargo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CargoCbo = typeof cargosCbo.$inferSelect;
export type InsertCargoCbo = typeof cargosCbo.$inferInsert;

/**
 * Setores - Cadastro de setores/departamentos
 */
export const setores = mysqlTable("setores", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeSetor: varchar("nomeSetor", { length: 255 }).notNull(),
  descricao: text("descricao"),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setor = typeof setores.$inferSelect;
export type InsertSetor = typeof setores.$inferInsert;

/**
 * TiposTreinamentos - Catálogo de tipos de treinamentos disponíveis
 */
export const tiposTreinamentos = mysqlTable("tiposTreinamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeTreinamento: varchar("nomeTreinamento", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipoNr: varchar("tipoNr", { length: 50 }),
  validadeEmMeses: int("validadeEmMeses"),
  empresaId: int("empresaId"),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TipoTreinamento = typeof tiposTreinamentos.$inferSelect;
export type InsertTipoTreinamento = typeof tiposTreinamentos.$inferInsert;

/**
 * CargoTreinamentos - Vínculo entre cargos e tipos de treinamentos obrigatórios
 */
export const cargoTreinamentos = mysqlTable("cargoTreinamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  cargoId: int("cargoId").notNull(),
  tipoTreinamentoId: int("tipoTreinamentoId").notNull(),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CargoTreinamento = typeof cargoTreinamentos.$inferSelect;
export type InsertCargoTreinamento = typeof cargoTreinamentos.$inferInsert;

/**
 * CargoSetores - Vínculo entre cargos e setores
 */
export const cargoSetores = mysqlTable("cargoSetores", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  cargoId: int("cargoId").notNull(),
  setorId: int("setorId").notNull(),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CargoSetor = typeof cargoSetores.$inferSelect;
export type InsertCargoSetor = typeof cargoSetores.$inferInsert;

/**
 * RiscosOcupacionais - Catálogo de riscos ocupacionais
 */
export const riscosOcupacionais = mysqlTable("riscosOcupacionais", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeRisco: varchar("nomeRisco", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipoRisco: mysqlEnum("tipoRisco", ["fisico", "quimico", "biologico", "ergonomico", "mecanico"]).notNull(),
  codigo: varchar("codigo", { length: 50 }),
  empresaId: int("empresaId"),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiscoOcupacional = typeof riscosOcupacionais.$inferSelect;
export type InsertRiscoOcupacional = typeof riscosOcupacionais.$inferInsert;

/**
 * CargoRiscos - Vínculo entre cargos e riscos ocupacionais
 */
export const cargoRiscos = mysqlTable("cargoRiscos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  cargoId: int("cargoId").notNull(),
  riscoOcupacionalId: int("riscoOcupacionalId").notNull(),
  tipoAgente: varchar("tipoAgente", { length: 255 }),
  descricaoRiscos: text("descricaoRiscos"),
  // Novos campos para tabela completa de riscos
  fonteGeradora: varchar("fonteGeradora", { length: 500 }),
  tipo: varchar("tipo", { length: 100 }),
  meioPropagacao: varchar("meioPropagacao", { length: 500 }),
  meioContato: varchar("meioContato", { length: 500 }),
  possiveisDanosSaude: text("possiveisDanosSaude"),
  tipoAnalise: varchar("tipoAnalise", { length: 100 }), // Qualitativa / Quantitativa
  valorAnaliseQuantitativa: varchar("valorAnaliseQuantitativa", { length: 200 }), // Ex: "88 (dB) Trabalhos esporádicos"
  gradacaoEfeitos: varchar("gradacaoEfeitos", { length: 50 }),
  gradacaoExposicao: varchar("gradacaoExposicao", { length: 50 }),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CargoRisco = typeof cargoRiscos.$inferSelect;
export type InsertCargoRisco = typeof cargoRiscos.$inferInsert;

/**
 * ModelosCertificados - Templates de certificados para impressão
 */
export const modelosCertificados = mysqlTable("modelosCertificados", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  // Layout do certificado em HTML (agora opcional, será gerado automaticamente)
  htmlTemplate: text("htmlTemplate"),
  // Configurações de estilo
  corFundo: varchar("corFundo", { length: 7 }).default("#ffffff"),
  corTexto: varchar("corTexto", { length: 7 }).default("#000000"),
  corPrimaria: varchar("corPrimaria", { length: 7 }).default("#1e40af"),
  orientacao: mysqlEnum("orientacao", ["portrait", "landscape"]).default("landscape").notNull(),
  // Campos personalizados
  textoCabecalho: text("textoCabecalho"),
  textoRodape: text("textoRodape"),
  conteudoProgramatico: text("conteudoProgramatico"), // JSON array de itens
  tipoTreinamentoId: int("tipoTreinamentoId"), // Referência ao tipo de treinamento
  descricaoCertificado: text("descricaoCertificado"), // Descrição completa do certificado (ex: "em conformidade com a portaria 3.214/78")
  cargaHoraria: varchar("cargaHoraria", { length: 20 }), // Carga horária (ex: "08:00")
  tipoNr: varchar("tipoNr", { length: 10 }), // Número da Norma Regulamentadora (ex: "35")
  datas: text("datas"), // JSON array com até 4 datas [{"label": "Data 1", "valor": "2025-01-01"}, ...]
  mostrarDataEmissao: boolean("mostrarDataEmissao").default(true),
  mostrarValidade: boolean("mostrarValidade").default(true),
  mostrarNR: boolean("mostrarNR").default(true),
  mostrarConteudoProgramatico: boolean("mostrarConteudoProgramatico").default(true),
  empresaId: int("empresaId"),
  padrao: boolean("padrao").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModeloCertificado = typeof modelosCertificados.$inferSelect;
export type InsertModeloCertificado = typeof modelosCertificados.$inferInsert;

/**
 * Responsaveis - Cadastro de responsáveis por assinar documentos e treinamentos
 */
export const responsaveis = mysqlTable("responsaveis", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  funcao: varchar("funcao", { length: 255 }),
  registroProfissional: varchar("registroProfissional", { length: 100 }),
  empresaId: int("empresaId"),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Responsavel = typeof responsaveis.$inferSelect;
export type InsertResponsavel = typeof responsaveis.$inferInsert;

/**
 * CertificadosEmitidos - Certificados emitidos para colaboradores
 */
export const certificadosEmitidos = mysqlTable("certificadosEmitidos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  modeloCertificadoId: int("modeloCertificadoId").notNull(),
  colaboradorId: int("colaboradorId").notNull(),
  responsavelId: int("responsavelId"),
  nomeColaborador: varchar("nomeColaborador", { length: 255 }).notNull(),
  rgColaborador: varchar("rgColaborador", { length: 50 }),
  nomeEmpresa: varchar("nomeEmpresa", { length: 255 }),
  cnpjEmpresa: varchar("cnpjEmpresa", { length: 20 }),
  datasRealizacao: text("datasRealizacao"), // JSON array de datas
  htmlGerado: text("htmlGerado").notNull(), // HTML final do certificado
  dataEmissao: timestamp("dataEmissao").defaultNow().notNull(),
  empresaId: int("empresaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CertificadoEmitido = typeof certificadosEmitidos.$inferSelect;
export type InsertCertificadoEmitido = typeof certificadosEmitidos.$inferInsert;

/**
 * OrdensServico - Ordens de Serviço emitidas
 */
export const ordensServico = mysqlTable("ordensServico", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  numeroOrdem: varchar("numeroOrdem", { length: 50 }).notNull(), // Removido unique global, agora único por tenant
  empresaId: int("empresaId").notNull(),
  colaboradorId: int("colaboradorId"),
  obraId: int("obraId"),
  descricaoServico: text("descricaoServico").notNull(),
  tipoServico: varchar("tipoServico", { length: 255 }),
  prioridade: mysqlEnum("prioridade", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  status: mysqlEnum("status", ["aberta", "em_andamento", "concluida", "cancelada"]).default("aberta").notNull(),
  dataEmissao: date("dataEmissao").notNull(),
  dataPrevistaConclusao: date("dataPrevistaConclusao"),
  dataConclusao: date("dataConclusao"),
  observacoes: text("observacoes"),
  responsavelEmissao: varchar("responsavelEmissao", { length: 255 }),
  responsavelId: int("responsavelId"),
  valorServico: varchar("valorServico", { length: 50 }),
  tipoRisco: varchar("tipoRisco", { length: 255 }),
  nrRelacionada: varchar("nrRelacionada", { length: 50 }),
  acaoCorretiva: text("acaoCorretiva"),
  modeloId: int("modeloId"),
  cidade: varchar("cidade", { length: 255 }),
  uf: varchar("uf", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrdemServico = typeof ordensServico.$inferSelect;
export type InsertOrdemServico = typeof ordensServico.$inferInsert;

/**
 * ModelosOrdemServico - Modelos de ordem de serviço
 */
export const modelosOrdemServico = mysqlTable("modelosOrdemServico", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(), // Isolamento por tenant
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  htmlTemplate: text("htmlTemplate"),
  medidasPreventivasEPC: text("medidasPreventivasEPC"), // Medidas Preventivas para os Riscos de Ambientais - EPC
  orientacoesSeguranca: text("orientacoesSeguranca"), // Orientações de Segurança do Trabalho
  termoResponsabilidade: text("termoResponsabilidade"), // Termo de Responsabilidade
  empresaId: int("empresaId"),
  padrao: boolean("padrao").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModeloOrdemServico = typeof modelosOrdemServico.$inferSelect;
export type InsertModeloOrdemServico = typeof modelosOrdemServico.$inferInsert;

/**
 * Permissoes - Catálogo de permissões do sistema
 */
export const permissoes = mysqlTable("permissoes", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 100 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  modulo: varchar("modulo", { length: 100 }).notNull(), // Ex: "empresas", "colaboradores", "obras", etc.
  acao: varchar("acao", { length: 100 }).notNull(), // Ex: "create", "read", "update", "delete", "list"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Permissao = typeof permissoes.$inferSelect;
export type InsertPermissao = typeof permissoes.$inferInsert;

/**
 * UserPermissoes - Relacionamento entre usuários e permissões
 */
export const userPermissoes = mysqlTable("userPermissoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permissaoId: int("permissaoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserPermissao = typeof userPermissoes.$inferSelect;
export type InsertUserPermissao = typeof userPermissoes.$inferInsert;

/**
 * PermissoesUsuarios - Permissões de usuários com campos booleanos por módulo/ação
 */
export const permissoesUsuarios = mysqlTable("permissoes_usuarios", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  // Empresas
  empresasView: boolean("empresas_view").default(false).notNull(),
  empresasAdd: boolean("empresas_add").default(false).notNull(),
  empresasEdit: boolean("empresas_edit").default(false).notNull(),
  empresasDelete: boolean("empresas_delete").default(false).notNull(),
  // Empregados
  empregadosView: boolean("empregados_view").default(false).notNull(),
  empregadosAdd: boolean("empregados_add").default(false).notNull(),
  empregadosEdit: boolean("empregados_edit").default(false).notNull(),
  empregadosDelete: boolean("empregados_delete").default(false).notNull(),
  // Fichas de EPI
  fichasView: boolean("fichas_view").default(false).notNull(),
  fichasAdd: boolean("fichas_add").default(false).notNull(),
  fichasEdit: boolean("fichas_edit").default(false).notNull(),
  fichasDelete: boolean("fichas_delete").default(false).notNull(),
  // Ordens de Serviço
  osView: boolean("os_view").default(false).notNull(),
  osAdd: boolean("os_add").default(false).notNull(),
  osEdit: boolean("os_edit").default(false).notNull(),
  osDelete: boolean("os_delete").default(false).notNull(),
  // Treinamentos
  treinamentosView: boolean("treinamentos_view").default(false).notNull(),
  treinamentosAdd: boolean("treinamentos_add").default(false).notNull(),
  treinamentosEdit: boolean("treinamentos_edit").default(false).notNull(),
  treinamentosDelete: boolean("treinamentos_delete").default(false).notNull(),
  // Modelos de Certificados
  certificadosView: boolean("certificados_view").default(false).notNull(),
  certificadosAdd: boolean("certificados_add").default(false).notNull(),
  certificadosEdit: boolean("certificados_edit").default(false).notNull(),
  certificadosDelete: boolean("certificados_delete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PermissoesUsuario = typeof permissoesUsuarios.$inferSelect;
export type InsertPermissoesUsuario = typeof permissoesUsuarios.$inferInsert;
