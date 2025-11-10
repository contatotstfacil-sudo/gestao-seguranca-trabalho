import { eq, and, gte, lte, desc, sql, asc, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, users,
  empresas, InsertEmpresa,
  colaboradores, InsertColaborador,
  obras, InsertObra,
  treinamentos, InsertTreinamento,
  epis, InsertEpi,
  tiposEpis, InsertTipoEpi,
  cargos, InsertCargo,
  cargoTreinamentos, InsertCargoTreinamento,
  cargoSetores, InsertCargoSetor,
  tiposTreinamentos, InsertTipoTreinamento,
  setores, InsertSetor,
  modelosCertificados, InsertModeloCertificado,
  responsaveis, InsertResponsavel,
  certificadosEmitidos, InsertCertificadoEmitido,
  fichasEpiEmitidas, InsertFichaEpiEmitida,
  ordensServico, InsertOrdemServico,
  riscosOcupacionais, InsertRiscoOcupacional,
  cargoRiscos, InsertCargoRisco,
  modelosOrdemServico, InsertModeloOrdemServico,
  permissoes, InsertPermissao,
  userPermissoes, InsertUserPermissao,
  permissoesUsuarios, InsertPermissoesUsuario
} from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from "bcryptjs";
import { normalizeCPF, normalizeCNPJ, isValidCPF, isValidCNPJ } from "./utils/validation";

let _db: any = null;
let _connection: mysql.Connection | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _connection = await mysql.createConnection(process.env.DATABASE_URL);
      _db = drizzle(_connection);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _connection = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {};
    const updateSet: Record<string, unknown> = {};

    // Se openId não foi fornecido mas temos email, CPF ou CNPJ, tentamos encontrar o usuário
    if (!user.openId) {
      let existingUser;
      if (user.email) {
        existingUser = await getUserByEmail(user.email);
      } else if (user.cpf) {
        existingUser = await getUserByCPF(user.cpf);
      } else if (user.cnpj) {
        existingUser = await getUserByCNPJ(user.cnpj);
      }
      
      if (existingUser) {
        values.openId = existingUser.openId || `local-${existingUser.id}`;
      } else {
        // Se não encontramos o usuário e não temos openId, geramos um baseado no identificador
        if (user.email) {
          values.openId = `local-email-${user.email}`;
        } else if (user.cpf) {
          values.openId = `local-cpf-${user.cpf}`;
        } else if (user.cnpj) {
          values.openId = `local-cnpj-${user.cnpj}`;
        }
      }
    } else {
      values.openId = user.openId;
    }

    const textFields = ["name", "email", "cpf", "cnpj", "passwordHash", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.empresaId !== undefined) {
      values.empresaId = user.empresaId;
      updateSet.empresaId = user.empresaId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Se não temos openId nem identificadores, não podemos fazer upsert
    if (!values.openId && !user.email && !user.cpf && !user.cnpj) {
      throw new Error("User openId, email, CPF or CNPJ is required for upsert");
    }

    // Se temos openId, fazemos upsert normalmente
    if (values.openId) {
      await db.insert(users).values(values as InsertUser).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } else {
      // Caso contrário, tentamos atualizar pelo identificador
      let whereClause;
      if (user.email) {
        whereClause = eq(users.email, user.email);
      } else if (user.cpf) {
        whereClause = eq(users.cpf, user.cpf);
      } else if (user.cnpj) {
        whereClause = eq(users.cnpj, user.cnpj);
      } else {
        throw new Error("Cannot upsert user without identifier");
      }
      
      await db.update(users).set(updateSet).where(whereClause);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCPF(cpf: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.cpf, cpf)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCNPJ(cnpj: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.cnpj, cnpj)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // Tenta encontrar por email, CPF ou CNPJ
  const result = await db.select().from(users).where(
    or(
      eq(users.email, identifier),
      eq(users.cpf, identifier),
      eq(users.cnpj, identifier)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// === USUÁRIOS DO SISTEMA ===
export async function getAllUsers(filters?: { searchTerm?: string; role?: string; empresaId?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    cpf: users.cpf,
    cnpj: users.cnpj,
    role: users.role,
    empresaId: users.empresaId,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    lastSignedIn: users.lastSignedIn,
    razaoSocial: empresas.razaoSocial,
  })
    .from(users)
    .leftJoin(empresas, eq(users.empresaId, empresas.id));

  const conditions = [];

  if (filters?.searchTerm) {
    conditions.push(
      or(
        sql`${users.name} LIKE ${`%${filters.searchTerm}%`}`,
        sql`${users.email} LIKE ${`%${filters.searchTerm}%`}`,
        sql`${users.cpf} LIKE ${`%${filters.searchTerm}%`}`,
        sql`${users.cnpj} LIKE ${`%${filters.searchTerm}%`}`
      )
    );
  }

  if (filters?.role) {
    conditions.push(eq(users.role, filters.role as any));
  }

  if (filters?.empresaId !== undefined) {
    conditions.push(eq(users.empresaId, filters.empresaId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    cpf: users.cpf,
    cnpj: users.cnpj,
    role: users.role,
    empresaId: users.empresaId,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    lastSignedIn: users.lastSignedIn,
    razaoSocial: empresas.razaoSocial,
  })
    .from(users)
    .leftJoin(empresas, eq(users.empresaId, empresas.id))
    .where(eq(users.id, id))
    .limit(1);
  
  return result[0];
}

export async function createUser(userData: {
  name: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  password: string;
  role: "user" | "admin" | "gestor" | "tecnico";
  empresaId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Valida que pelo menos um identificador foi fornecido
  if (!userData.email && !userData.cpf && !userData.cnpj) {
    throw new Error("É necessário fornecer email, CPF ou CNPJ");
  }

  // Verifica se já existe usuário com o mesmo identificador
  if (userData.email) {
    const existing = await getUserByEmail(userData.email);
    if (existing) {
      throw new Error("Já existe um usuário com este email");
    }
  }
  if (userData.cpf) {
    const normalizedCPF = normalizeCPF(userData.cpf);
    if (!isValidCPF(normalizedCPF)) {
      throw new Error("CPF inválido");
    }
    const existing = await getUserByCPF(normalizedCPF);
    if (existing) {
      throw new Error("Já existe um usuário com este CPF");
    }
    userData.cpf = normalizedCPF;
  }
  if (userData.cnpj) {
    const normalizedCNPJ = normalizeCNPJ(userData.cnpj);
    if (!isValidCNPJ(normalizedCNPJ)) {
      throw new Error("CNPJ inválido");
    }
    const existing = await getUserByCNPJ(normalizedCNPJ);
    if (existing) {
      throw new Error("Já existe um usuário com este CNPJ");
    }
    userData.cnpj = normalizedCNPJ;
  }

  // Gera hash da senha
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Gera openId baseado no identificador
  let openId: string;
  if (userData.email) {
    openId = `local-email-${userData.email}`;
  } else if (userData.cpf) {
    openId = `local-cpf-${userData.cpf}`;
  } else {
    openId = `local-cnpj-${userData.cnpj}`;
  }

  const newUser: InsertUser = {
    openId,
    name: userData.name,
    email: userData.email || null,
    cpf: userData.cpf || null,
    cnpj: userData.cnpj || null,
    passwordHash,
    role: userData.role,
    empresaId: userData.empresaId || null,
    loginMethod: "local",
  };

  const result = await db.insert(users).values(newUser);
  
  // Retorna o usuário criado
  const userId = (result as any)[0]?.insertId;
  if (userId) {
    return await getUserById(userId);
  }
  
  throw new Error("Falha ao criar usuário");
}

export async function updateUser(id: number, userData: {
  name?: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  password?: string;
  role?: "user" | "admin" | "gestor" | "tecnico";
  empresaId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingUser = await getUserById(id);
  if (!existingUser) {
    throw new Error("Usuário não encontrado");
  }

  const updateSet: Record<string, unknown> = {};

  if (userData.name !== undefined) {
    updateSet.name = userData.name;
  }

  if (userData.email !== undefined) {
    // Verifica se outro usuário já usa este email
    if (userData.email !== existingUser.email) {
      const existing = await getUserByEmail(userData.email);
      if (existing && existing.id !== id) {
        throw new Error("Já existe um usuário com este email");
      }
    }
    updateSet.email = userData.email || null;
  }

  if (userData.cpf !== undefined) {
    if (userData.cpf) {
      const normalizedCPF = normalizeCPF(userData.cpf);
      if (!isValidCPF(normalizedCPF)) {
        throw new Error("CPF inválido");
      }
      // Verifica se outro usuário já usa este CPF
      if (normalizedCPF !== existingUser.cpf) {
        const existing = await getUserByCPF(normalizedCPF);
        if (existing && existing.id !== id) {
          throw new Error("Já existe um usuário com este CPF");
        }
      }
      updateSet.cpf = normalizedCPF;
    } else {
      updateSet.cpf = null;
    }
  }

  if (userData.cnpj !== undefined) {
    if (userData.cnpj) {
      const normalizedCNPJ = normalizeCNPJ(userData.cnpj);
      if (!isValidCNPJ(normalizedCNPJ)) {
        throw new Error("CNPJ inválido");
      }
      // Verifica se outro usuário já usa este CNPJ
      if (normalizedCNPJ !== existingUser.cnpj) {
        const existing = await getUserByCNPJ(normalizedCNPJ);
        if (existing && existing.id !== id) {
          throw new Error("Já existe um usuário com este CNPJ");
        }
      }
      updateSet.cnpj = normalizedCNPJ;
    } else {
      updateSet.cnpj = null;
    }
  }

  if (userData.password !== undefined && userData.password.length > 0) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    updateSet.passwordHash = passwordHash;
  }

  if (userData.role !== undefined) {
    updateSet.role = userData.role;
  }

  if (userData.empresaId !== undefined) {
    updateSet.empresaId = userData.empresaId;
  }

  await db.update(users).set(updateSet).where(eq(users.id, id));

  return await getUserById(id);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, id));
}

// === EMPRESAS ===
export async function getAllEmpresas(filters?: { searchTerm?: string; dataInicio?: string; dataFim?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query: any = db.select().from(empresas);
  
  if (filters?.searchTerm) {
    query = query.where(
      sql`${empresas.razaoSocial} LIKE ${`%${filters.searchTerm}%`}`
    );
  }
  
  if (filters?.dataInicio) {
    query = query.where(gte(empresas.createdAt, new Date(filters.dataInicio)));
  }
  
  if (filters?.dataFim) {
    query = query.where(lte(empresas.createdAt, new Date(filters.dataFim)));
  }
  
  return query.orderBy(desc(empresas.createdAt));
}

export async function getEmpresaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1);
  return result[0];
}

export async function createEmpresa(data: InsertEmpresa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(empresas).values(data);
  return result;
}

export async function updateEmpresa(id: number, data: Partial<InsertEmpresa>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(empresas).set(data).where(eq(empresas.id, id));
}

export async function deleteEmpresa(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(empresas).where(eq(empresas.id, id));
}

// === COLABORADORES ===
export async function getAllColaboradores(empresaId?: number, filters?: { searchTerm?: string; dataAdmissaoInicio?: string; dataAdmissaoFim?: string; funcao?: string; empresaId?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  // Se empresaId foi passado como parâmetro ou nos filtros, usar ele
  const empresaIdFinal = filters?.empresaId || empresaId;
  if (empresaIdFinal) {
    conditions.push(eq(colaboradores.empresaId, empresaIdFinal));
  }
  
  if (filters?.searchTerm) {
    conditions.push(
      sql`LOWER(${colaboradores.nomeCompleto}) LIKE LOWER(${`%${filters.searchTerm}%`})`
    );
  }
  
  if (filters?.dataAdmissaoInicio) {
    conditions.push(gte(colaboradores.dataAdmissao, new Date(filters.dataAdmissaoInicio)));
  }
  
  if (filters?.dataAdmissaoFim) {
    conditions.push(lte(colaboradores.dataAdmissao, new Date(filters.dataAdmissaoFim)));
  }
  
  if (filters?.funcao) {
    conditions.push(
      sql`LOWER(${colaboradores.funcao}) LIKE LOWER(${`%${filters.funcao}%`})`
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db.select({
    ...colaboradores,
    nomeSetor: setores.nomeSetor,
    nomeCargo: cargos.nomeCargo,
  })
    .from(colaboradores)
    .leftJoin(setores, eq(colaboradores.setorId, setores.id))
    .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
    .where(whereClause)
    .orderBy(desc(colaboradores.createdAt));
}

export async function getColaboradorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(colaboradores).where(eq(colaboradores.id, id)).limit(1);
  return result[0];
}

export async function createColaborador(data: InsertColaborador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(colaboradores).values(data);
}

export async function updateColaborador(id: number, data: Partial<InsertColaborador>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(colaboradores).set(data).where(eq(colaboradores.id, id));
}

export async function deleteColaborador(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(colaboradores).where(eq(colaboradores.id, id));
}

export async function deleteColaboradores(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { success: true, deleted: 0 };

  await db.delete(colaboradores).where(inArray(colaboradores.id, ids));
  return { success: true, deleted: ids.length };
}

// === OBRAS ===
export async function getAllObras(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (empresaId) {
    return db.select().from(obras).where(eq(obras.empresaId, empresaId)).orderBy(desc(obras.createdAt));
  }
  return db.select().from(obras).orderBy(desc(obras.createdAt));
}

export async function getObraById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(obras).where(eq(obras.id, id)).limit(1);
  return result[0];
}

export async function createObra(data: InsertObra) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(obras).values(data);
}

export async function updateObra(id: number, data: Partial<InsertObra>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(obras).set(data).where(eq(obras.id, id));
}

export async function deleteObra(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(obras).where(eq(obras.id, id));
}

// === TREINAMENTOS ===
export async function getAllTreinamentos(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (empresaId) {
    return db.select().from(treinamentos).where(eq(treinamentos.empresaId, empresaId)).orderBy(desc(treinamentos.createdAt));
  }
  return db.select().from(treinamentos).orderBy(desc(treinamentos.createdAt));
}

export async function getTreinamentoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(treinamentos).where(eq(treinamentos.id, id)).limit(1);
  return result[0];
}

export async function createTreinamento(data: InsertTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(treinamentos).values(data);
}

export async function updateTreinamento(id: number, data: Partial<InsertTreinamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(treinamentos).set(data).where(eq(treinamentos.id, id));
}

export async function deleteTreinamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(treinamentos).where(eq(treinamentos.id, id));
}

// === EPIs ===
export async function getAllEpis(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (empresaId) {
    return db.select().from(epis).where(eq(epis.empresaId, empresaId)).orderBy(desc(epis.createdAt));
  }
  return db.select().from(epis).orderBy(desc(epis.createdAt));
}

export async function getEpiById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(epis).where(eq(epis.id, id)).limit(1);
  return result[0];
}

export async function createEpi(data: InsertEpi) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(epis).values(data);
}

export async function createMultipleEpis(episData: Array<{
  nomeEquipamento: string;
  tipoEpiId?: number;
  colaboradorId: number;
  empresaId: number;
  dataEntrega?: string;
  quantidade?: number;
  caNumero?: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const dataToInsert = episData.map((epi) => {
    const data: any = {
      nomeEquipamento: epi.nomeEquipamento,
      colaboradorId: epi.colaboradorId,
      empresaId: epi.empresaId,
      quantidade: epi.quantidade || 1,
    };
    
    if (epi.tipoEpiId) {
      data.tipoEpiId = epi.tipoEpiId;
    }
    
    if (epi.caNumero) {
      data.caNumero = epi.caNumero;
    }
    
    if (epi.dataEntrega) {
      data.dataEntrega = new Date(epi.dataEntrega);
    }
    
    return data;
  });

  await db.insert(epis).values(dataToInsert);
  return episData.length;
}

export async function updateEpi(id: number, data: Partial<InsertEpi>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(epis).set(data).where(eq(epis.id, id));
}

export async function deleteEpi(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(epis).where(eq(epis.id, id));
}

export async function getDadosFichaEPI(empresaId: number, colaboradorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar empresa
  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
  if (!empresa) throw new Error("Empresa não encontrada");

  // Buscar colaborador com relacionamentos
  const [colaboradorResult] = await db
    .select({
      id: colaboradores.id,
      nomeCompleto: colaboradores.nomeCompleto,
      funcao: colaboradores.funcao,
      cargoId: colaboradores.cargoId,
      setorId: colaboradores.setorId,
      empresaId: colaboradores.empresaId,
      obraId: colaboradores.obraId,
      dataAdmissao: colaboradores.dataAdmissao,
      rg: colaboradores.rg,
      cpf: colaboradores.cpf,
      pis: colaboradores.pis,
      dataNascimento: colaboradores.dataNascimento,
      cidadeNascimento: colaboradores.cidadeNascimento,
      estadoNascimento: colaboradores.estadoNascimento,
      sexo: colaboradores.sexo,
      setor: colaboradores.setor,
      tipoLogradouro: colaboradores.tipoLogradouro,
      nomeLogradouro: colaboradores.nomeLogradouro,
      numeroEndereco: colaboradores.numeroEndereco,
      complementoEndereco: colaboradores.complementoEndereco,
      cidadeEndereco: colaboradores.cidadeEndereco,
      estadoEndereco: colaboradores.estadoEndereco,
      cep: colaboradores.cep,
      fotoUrl: colaboradores.fotoUrl,
      telefonePrincipal: colaboradores.telefonePrincipal,
      telefoneRecado: colaboradores.telefoneRecado,
      nomePessoaRecado: colaboradores.nomePessoaRecado,
      grauParentesco: colaboradores.grauParentesco,
      observacoes: colaboradores.observacoes,
      status: colaboradores.status,
      createdAt: colaboradores.createdAt,
      updatedAt: colaboradores.updatedAt,
      nomeSetor: setores.nomeSetor,
      nomeCargo: cargos.nomeCargo,
    })
    .from(colaboradores)
    .leftJoin(setores, eq(colaboradores.setorId, setores.id))
    .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
    .where(eq(colaboradores.id, colaboradorId))
    .limit(1);
  
  const colaborador = colaboradorResult;

  if (!colaborador) throw new Error("Colaborador não encontrado");

  // Buscar todos os EPIs do colaborador
  const episList = await db
    .select()
    .from(epis)
    .where(
      and(
        eq(epis.colaboradorId, colaboradorId),
        eq(epis.empresaId, empresaId)
      )
    )
    .orderBy(epis.dataEntrega);

  return {
    empresa,
    colaborador,
    epis: episList,
  };
}

// === FICHAS EPI EMITIDAS ===
export async function createFichaEpiEmitida(data: InsertFichaEpiEmitida) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(fichasEpiEmitidas).values(data);
  return { id: result[0].insertId, ...data };
}

export async function getAllFichasEpiEmitidas(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (empresaId) {
    return db
      .select({
        id: fichasEpiEmitidas.id,
        empresaId: fichasEpiEmitidas.empresaId,
        colaboradorId: fichasEpiEmitidas.colaboradorId,
        nomeArquivo: fichasEpiEmitidas.nomeArquivo,
        caminhoArquivo: fichasEpiEmitidas.caminhoArquivo,
        urlArquivo: fichasEpiEmitidas.urlArquivo,
        dataEmissao: fichasEpiEmitidas.dataEmissao,
        createdAt: fichasEpiEmitidas.createdAt,
        colaboradorNome: colaboradores.nomeCompleto,
        empresaNome: empresas.razaoSocial,
      })
      .from(fichasEpiEmitidas)
      .leftJoin(colaboradores, eq(fichasEpiEmitidas.colaboradorId, colaboradores.id))
      .leftJoin(empresas, eq(fichasEpiEmitidas.empresaId, empresas.id))
      .where(eq(fichasEpiEmitidas.empresaId, empresaId))
      .orderBy(desc(fichasEpiEmitidas.dataEmissao));
  }
  
  return db
    .select({
      id: fichasEpiEmitidas.id,
      empresaId: fichasEpiEmitidas.empresaId,
      colaboradorId: fichasEpiEmitidas.colaboradorId,
      nomeArquivo: fichasEpiEmitidas.nomeArquivo,
      caminhoArquivo: fichasEpiEmitidas.caminhoArquivo,
      urlArquivo: fichasEpiEmitidas.urlArquivo,
      dataEmissao: fichasEpiEmitidas.dataEmissao,
      createdAt: fichasEpiEmitidas.createdAt,
      colaboradorNome: colaboradores.nomeCompleto,
      empresaNome: empresas.razaoSocial,
    })
    .from(fichasEpiEmitidas)
    .leftJoin(colaboradores, eq(fichasEpiEmitidas.colaboradorId, colaboradores.id))
    .leftJoin(empresas, eq(fichasEpiEmitidas.empresaId, empresas.id))
    .orderBy(desc(fichasEpiEmitidas.dataEmissao));
}

export async function deleteFichaEpiEmitida(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(fichasEpiEmitidas).where(eq(fichasEpiEmitidas.id, id));
}

// === DASHBOARD STATS ===
export async function getDashboardStats(empresaId?: number) {
  const db = await getDb();
  if (!db) return null;

  const whereEmpresa = empresaId ? eq(empresas.id, empresaId) : undefined;
  const whereColaborador = empresaId ? eq(colaboradores.empresaId, empresaId) : undefined;
  const whereObra = empresaId ? eq(obras.empresaId, empresaId) : undefined;
  const whereTreinamento = empresaId ? eq(treinamentos.empresaId, empresaId) : undefined;
  const whereEpi = empresaId ? eq(epis.empresaId, empresaId) : undefined;

  const [empresasAtivas] = await db
    .select({ count: sql<number>`count(*)` })
    .from(empresas)
    .where(whereEmpresa ? and(whereEmpresa, eq(empresas.status, "ativa")) : eq(empresas.status, "ativa"));

  const [colaboradoresAtivos] = await db
    .select({ count: sql<number>`count(*)` })
    .from(colaboradores)
    .where(whereColaborador ? and(whereColaborador, eq(colaboradores.status, "ativo")) : eq(colaboradores.status, "ativo"));

  const [obrasAtivas] = await db
    .select({ count: sql<number>`count(*)` })
    .from(obras)
    .where(whereObra ? and(whereObra, eq(obras.status, "ativa")) : eq(obras.status, "ativa"));

  const [treinamentosVencidos] = await db
    .select({ count: sql<number>`count(*)` })
    .from(treinamentos)
    .where(whereTreinamento ? and(whereTreinamento, eq(treinamentos.status, "vencido")) : eq(treinamentos.status, "vencido"));

  const [episVencendo] = await db
    .select({ count: sql<number>`count(*)` })
    .from(epis)
    .where(whereEpi ? and(whereEpi, eq(epis.status, "vencido")) : eq(epis.status, "vencido"));

  return {
    empresasAtivas: empresasAtivas?.count || 0,
    colaboradoresAtivos: colaboradoresAtivos?.count || 0,
    obrasAtivas: obrasAtivas?.count || 0,
    treinamentosVencidos: treinamentosVencidos?.count || 0,
    episVencendo: episVencendo?.count || 0,
  };
}


// Cargos
export async function getAllCargos(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const whereClause = empresaId ? eq(cargos.empresaId, empresaId) : undefined;
  return db.select().from(cargos).where(whereClause).orderBy(asc(cargos.nomeCargo));
}

export async function getCargoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(cargos).where(eq(cargos.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCargo(data: InsertCargo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cargos).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateCargo(id: number, data: Partial<InsertCargo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cargos).set(data).where(eq(cargos.id, id));
  return getCargoById(id);
}

export async function deleteCargo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cargos).where(eq(cargos.id, id));
  return { success: true };
}

// Setores
export async function getAllSetores(input?: { searchTerm?: string }, empresaId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (empresaId) {
    conditions.push(eq(setores.empresaId, empresaId));
  }
  if (input?.searchTerm) {
    conditions.push(
      sql`LOWER(${setores.nomeSetor}) LIKE LOWER(${`%${input.searchTerm}%`})`
    );
  }
  
  if (conditions.length > 0) {
    return db.select().from(setores).where(and(...conditions)).orderBy(asc(setores.nomeSetor));
  }
  
  return db.select().from(setores).orderBy(asc(setores.nomeSetor));
}

export async function getSetorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(setores).where(eq(setores.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSetor(data: InsertSetor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(setores).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateSetor(id: number, data: Partial<InsertSetor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(setores).set(data).where(eq(setores.id, id));
  return getSetorById(id);
}

export async function deleteSetor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(setores).where(eq(setores.id, id));
  return { success: true };
}

export async function deleteSetores(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { success: true, deleted: 0 };

  await db.delete(setores).where(inArray(setores.id, ids));
  return { success: true, deleted: ids.length };
}

// Cargo Treinamentos
export async function getTreinamentosByCargo(cargoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: cargoTreinamentos.id,
    cargoId: cargoTreinamentos.cargoId,
    tipoTreinamentoId: cargoTreinamentos.tipoTreinamentoId,
    nomeTreinamento: tiposTreinamentos.nomeTreinamento,
    tipoNr: tiposTreinamentos.tipoNr,
  }).from(cargoTreinamentos)
    .leftJoin(tiposTreinamentos, eq(cargoTreinamentos.tipoTreinamentoId, tiposTreinamentos.id))
    .where(eq(cargoTreinamentos.cargoId, cargoId));
}

export async function createCargoTreinamento(data: InsertCargoTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cargoTreinamentos).values(data);
  return { id: result[0].insertId, ...data };
}

export async function deleteCargoTreinamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cargoTreinamentos).where(eq(cargoTreinamentos.id, id));
  return { success: true };
}

// Cargo Setores
export async function getSetoresByCargo(cargoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: cargoSetores.id,
    cargoId: cargoSetores.cargoId,
    setorId: cargoSetores.setorId,
    nomeSetor: setores.nomeSetor,
  }).from(cargoSetores)
    .leftJoin(setores, eq(cargoSetores.setorId, setores.id))
    .where(eq(cargoSetores.cargoId, cargoId))
    .orderBy(asc(setores.nomeSetor));
}

export async function createCargoSetor(data: InsertCargoSetor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cargoSetores).values(data);
  return { id: result[0].insertId, ...data };
}

export async function deleteCargoSetor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cargoSetores).where(eq(cargoSetores.id, id));
  return { success: true };
}

// ========== RISCOS OCUPACIONAIS ==========

export async function getAllRiscosOcupacionais(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (empresaId) {
    return db.select().from(riscosOcupacionais)
      .where(eq(riscosOcupacionais.empresaId, empresaId))
      .orderBy(asc(riscosOcupacionais.nomeRisco));
  }
  
  return db.select().from(riscosOcupacionais)
    .orderBy(asc(riscosOcupacionais.nomeRisco));
}

export async function getRiscoOcupacionalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(riscosOcupacionais)
    .where(eq(riscosOcupacionais.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createRiscoOcupacional(data: InsertRiscoOcupacional) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Usar SQL direto via conexão MySQL para evitar problemas com campos opcionais do Drizzle
  if (!_connection) throw new Error("Database connection not available");
  
  const nomeRisco = data.nomeRisco;
  const tipoRisco = data.tipoRisco;
  const status = data.status || "ativo";
  
  // Construir query SQL dinamicamente apenas com campos fornecidos
  const fields: string[] = ["nomeRisco", "tipoRisco", "status"];
  const values: any[] = [nomeRisco, tipoRisco, status];
  const placeholders: string[] = ["?", "?", "?"];
  
  if (data.descricao && typeof data.descricao === 'string' && data.descricao.trim() !== "") {
    fields.push("descricao");
    values.push(data.descricao.trim());
    placeholders.push("?");
  }
  
  if (data.codigo && typeof data.codigo === 'string' && data.codigo.trim() !== "") {
    fields.push("codigo");
    values.push(data.codigo.trim());
    placeholders.push("?");
  }
  
  if (data.empresaId && typeof data.empresaId === 'number') {
    fields.push("empresaId");
    values.push(data.empresaId);
    placeholders.push("?");
  }
  
  const sqlQuery = `INSERT INTO riscosOcupacionais (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`;
  
  const [result]: any = await _connection.execute(sqlQuery, values);
  const insertedId = result.insertId;
  
  // Buscar o registro inserido para retornar completo
  const inserted = await db.select().from(riscosOcupacionais).where(eq(riscosOcupacionais.id, insertedId)).limit(1);
  return inserted[0];
}

export async function updateRiscoOcupacional(id: number, data: Partial<InsertRiscoOcupacional>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(riscosOcupacionais).set(data).where(eq(riscosOcupacionais.id, id));
  return getRiscoOcupacionalById(id);
}

export async function deleteRiscoOcupacional(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(riscosOcupacionais).where(eq(riscosOcupacionais.id, id));
}

export async function getRiscosByCargo(cargoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: cargoRiscos.id,
    cargoId: cargoRiscos.cargoId,
    riscoOcupacionalId: cargoRiscos.riscoOcupacionalId,
    tipoAgente: cargoRiscos.tipoAgente,
    descricaoRiscos: cargoRiscos.descricaoRiscos,
    nomeRisco: riscosOcupacionais.nomeRisco,
    tipoRisco: riscosOcupacionais.tipoRisco,
    codigo: riscosOcupacionais.codigo,
  }).from(cargoRiscos)
    .leftJoin(riscosOcupacionais, eq(cargoRiscos.riscoOcupacionalId, riscosOcupacionais.id))
    .where(eq(cargoRiscos.cargoId, cargoId));
}

export async function createCargoRisco(data: InsertCargoRisco) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Limpar dados para evitar problemas na inserção
  const cleanData: any = {
    cargoId: data.cargoId,
    riscoOcupacionalId: data.riscoOcupacionalId,
  };
  
  if (data.tipoAgente && data.tipoAgente.trim()) {
    cleanData.tipoAgente = data.tipoAgente.trim();
  }
  if (data.descricaoRiscos && data.descricaoRiscos.trim()) {
    cleanData.descricaoRiscos = data.descricaoRiscos.trim();
  }
  if (data.empresaId) {
    cleanData.empresaId = data.empresaId;
  }
  
  const result = await db.insert(cargoRiscos).values(cleanData);
  return { id: result[0].insertId, ...cleanData };
}

export async function updateCargoRisco(id: number, data: Partial<InsertCargoRisco>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Limpar dados para evitar problemas na atualização
  const cleanData: any = {};
  
  if (data.tipoAgente !== undefined) {
    if (data.tipoAgente && data.tipoAgente.trim()) {
      cleanData.tipoAgente = data.tipoAgente.trim();
    } else {
      cleanData.tipoAgente = null;
    }
  }
  if (data.descricaoRiscos !== undefined) {
    if (data.descricaoRiscos && data.descricaoRiscos.trim()) {
      cleanData.descricaoRiscos = data.descricaoRiscos.trim();
    } else {
      cleanData.descricaoRiscos = null;
    }
  }
  if (data.riscoOcupacionalId !== undefined) {
    cleanData.riscoOcupacionalId = data.riscoOcupacionalId;
  }
  
  await db.update(cargoRiscos).set(cleanData).where(eq(cargoRiscos.id, id));
  return getRiscosByCargo(data.cargoId || 0);
}

export async function deleteCargoRisco(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cargoRiscos).where(eq(cargoRiscos.id, id));
}

// Tipos de Treinamentos
export async function getAllTiposTreinamentos(input?: { searchTerm?: string }, empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (empresaId) {
    conditions.push(eq(tiposTreinamentos.empresaId, empresaId));
  }
  if (input?.searchTerm) {
    conditions.push(
      sql`LOWER(${tiposTreinamentos.nomeTreinamento}) LIKE LOWER(${`%${input.searchTerm}%`})`
    );
  }
  
  if (conditions.length > 0) {
    return db.select().from(tiposTreinamentos).where(and(...conditions)).orderBy(desc(tiposTreinamentos.createdAt));
  }
  
  return db.select().from(tiposTreinamentos).orderBy(desc(tiposTreinamentos.createdAt));
}

export async function getTipoTreinamentoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tiposTreinamentos).where(eq(tiposTreinamentos.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createTipoTreinamento(data: InsertTipoTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tiposTreinamentos).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateTipoTreinamento(id: number, data: Partial<InsertTipoTreinamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tiposTreinamentos).set(data).where(eq(tiposTreinamentos.id, id));
  return getTipoTreinamentoById(id);
}

export async function deleteTipoTreinamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tiposTreinamentos).where(eq(tiposTreinamentos.id, id));
  return { success: true };
}

export async function deleteTiposTreinamentos(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { success: true, deleted: 0 };

  await db.delete(tiposTreinamentos).where(inArray(tiposTreinamentos.id, ids));
  return { success: true, deleted: ids.length };
}

// ========== MODELOS ORDEM SERVIÇO ==========

export async function getAllModelosOrdemServico(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (empresaId) {
    return db.select().from(modelosOrdemServico).where(eq(modelosOrdemServico.empresaId, empresaId)).orderBy(desc(modelosOrdemServico.padrao), desc(modelosOrdemServico.createdAt));
  }

  return db.select().from(modelosOrdemServico).orderBy(desc(modelosOrdemServico.padrao), desc(modelosOrdemServico.createdAt));
}

export async function getModeloOrdemServicoById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(modelosOrdemServico).where(eq(modelosOrdemServico.id, id)).limit(1);
  return result[0] || null;
}

export async function createModeloOrdemServico(data: InsertModeloOrdemServico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(modelosOrdemServico).values(data);
  return getModeloOrdemServicoById(Number(result[0].insertId));
}

export async function updateModeloOrdemServico(id: number, data: Partial<InsertModeloOrdemServico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(modelosOrdemServico).set(data).where(eq(modelosOrdemServico.id, id));
  return getModeloOrdemServicoById(id);
}

export async function deleteModeloOrdemServico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(modelosOrdemServico).where(eq(modelosOrdemServico.id, id));
}



// Estatísticas de Colaboradores
export async function getColaboradorStats(empresaId?: number) {
  const db = await getDb();
  if (!db) return null;

  let conditions = [];
  if (empresaId) {
    conditions.push(eq(colaboradores.empresaId, empresaId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Total de colaboradores
  const totalResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(colaboradores)
    .where(whereClause);
  const total = Number(totalResult[0]?.count) || 0;

  // Colaboradores ativos
  const ativosResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(colaboradores)
    .where(whereClause ? and(whereClause, eq(colaboradores.status, 'ativo')) : eq(colaboradores.status, 'ativo'));
  const ativos = Number(ativosResult[0]?.count) || 0;

  // Distribuição por função/cargo (prioriza cargoId, depois funcao)
  const funcaoResult = await db
    .select({
      funcao: sql<string>`COALESCE(${cargos.nomeCargo}, ${colaboradores.funcao}, 'Sem função')`,
      count: sql`COUNT(*) as cnt`,
    })
    .from(colaboradores)
    .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
    .where(whereClause)
    .groupBy(sql`COALESCE(${cargos.nomeCargo}, ${colaboradores.funcao}, 'Sem função')`);

  // Distribuição por status
  const statusResult = await db
    .select({
      status: colaboradores.status,
      count: sql`COUNT(*) as cnt`,
    })
    .from(colaboradores)
    .where(whereClause)
    .groupBy(colaboradores.status);

  // Distribuição por sexo
  const sexoResult = await db
    .select({
      sexo: colaboradores.sexo,
      count: sql`COUNT(*) as cnt`,
    })
    .from(colaboradores)
    .where(whereClause)
    .groupBy(colaboradores.sexo);

  // Distribuição por setor (usa setorId com JOIN na tabela setores)
  const setorResult = await db
    .select({
      setor: sql<string>`COALESCE(${setores.nomeSetor}, 'Sem setor')`,
      count: sql`COUNT(*) as cnt`,
    })
    .from(colaboradores)
    .leftJoin(setores, eq(colaboradores.setorId, setores.id))
    .where(whereClause)
    .groupBy(sql`COALESCE(${setores.nomeSetor}, 'Sem setor')`);

  // Distribuição por faixas etárias será calculada no frontend
  const idadeResult = [];

  // Colaboradores com mais tempo de empresa
  const maisTempoResult = await db
    .select({
      id: colaboradores.id,
      nome: colaboradores.nomeCompleto,
      dataAdmissao: colaboradores.dataAdmissao,
      funcao: sql<string>`COALESCE(${cargos.nomeCargo}, ${colaboradores.funcao}, 'Sem função')`,
    })
    .from(colaboradores)
    .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
    .where(whereClause)
    .orderBy(asc(colaboradores.dataAdmissao))
    .limit(5);

  return {
    total,
    ativos,
    funcoes: funcaoResult,
    status: statusResult,
    sexo: sexoResult,
    setor: setorResult,
    maisAntigos: maisTempoResult,
  };
}

// === MODELOS DE CERTIFICADOS ===
export async function getAllModelosCertificados(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (empresaId) {
    return db.select().from(modelosCertificados).where(eq(modelosCertificados.empresaId, empresaId)).orderBy(desc(modelosCertificados.padrao), desc(modelosCertificados.createdAt));
  }

  return db.select().from(modelosCertificados).orderBy(desc(modelosCertificados.padrao), desc(modelosCertificados.createdAt));
}

export async function getModeloCertificadoById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [modelo] = await db.select().from(modelosCertificados).where(eq(modelosCertificados.id, id)).limit(1);
  return modelo || null;
}

export async function getModeloCertificadoPadrao(empresaId?: number) {
  const db = await getDb();
  if (!db) return null;

  const whereClause = empresaId 
    ? and(eq(modelosCertificados.padrao, true), eq(modelosCertificados.empresaId, empresaId))
    : eq(modelosCertificados.padrao, true);

  const [modelo] = await db.select().from(modelosCertificados).where(whereClause).limit(1);
  return modelo || null;
}

export async function createModeloCertificado(data: InsertModeloCertificado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se este modelo for padrão, remover padrão dos outros
  if (data.padrao) {
    const whereClause = data.empresaId 
      ? and(eq(modelosCertificados.padrao, true), eq(modelosCertificados.empresaId, data.empresaId))
      : eq(modelosCertificados.padrao, true);
    
    await db.update(modelosCertificados).set({ padrao: false }).where(whereClause);
  }

  const [result] = await db.insert(modelosCertificados).values(data);
  return getModeloCertificadoById(Number(result.insertId));
}

export async function getAllModelosCertificadosComTreinamento(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];

  const query = db.select({
    modelo: modelosCertificados,
    tipoTreinamento: tiposTreinamentos,
  })
    .from(modelosCertificados)
    .leftJoin(tiposTreinamentos, eq(modelosCertificados.tipoTreinamentoId, tiposTreinamentos.id));

  if (empresaId) {
    return query.where(eq(modelosCertificados.empresaId, empresaId)).orderBy(desc(modelosCertificados.padrao), desc(modelosCertificados.createdAt));
  }

  return query.orderBy(desc(modelosCertificados.padrao), desc(modelosCertificados.createdAt));
}

export async function updateModeloCertificado(id: number, data: Partial<InsertModeloCertificado>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se este modelo for padrão, remover padrão dos outros
  if (data.padrao) {
    const modeloAtual = await getModeloCertificadoById(id);
    if (modeloAtual) {
      const whereClause = modeloAtual.empresaId 
        ? and(eq(modelosCertificados.padrao, true), eq(modelosCertificados.empresaId, modeloAtual.empresaId), sql`${modelosCertificados.id} != ${id}`)
        : and(eq(modelosCertificados.padrao, true), sql`${modelosCertificados.id} != ${id}`);
      
      await db.update(modelosCertificados).set({ padrao: false }).where(whereClause);
    }
  }

  await db.update(modelosCertificados).set(data).where(eq(modelosCertificados.id, id));
  return getModeloCertificadoById(id);
}

export async function deleteModeloCertificado(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(modelosCertificados).where(eq(modelosCertificados.id, id));
  return { success: true };
}

export async function deleteManyModelosCertificados(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { deleted: 0 };
  await db.delete(modelosCertificados).where(inArray(modelosCertificados.id, ids));
  return { deleted: ids.length };
}

// === RESPONSÁVEIS ===
export async function getAllResponsaveis(empresaId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (empresaId) {
    return db.select().from(responsaveis).where(eq(responsaveis.empresaId, empresaId)).orderBy(desc(responsaveis.createdAt));
  }
  return db.select().from(responsaveis).orderBy(desc(responsaveis.createdAt));
}

export async function getResponsavelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(responsaveis).where(eq(responsaveis.id, id)).limit(1);
  return result[0];
}

export async function createResponsavel(data: InsertResponsavel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Construir objeto apenas com campos definidos (sem undefined)
  const values: Record<string, any> = {
    nomeCompleto: data.nomeCompleto,
  };
  
  // Adicionar campos opcionais apenas se existirem e não forem undefined
  if (data.status !== undefined) {
    values.status = data.status;
  }
  if (data.funcao !== undefined && data.funcao !== null) {
    values.funcao = data.funcao;
  }
  if (data.registroProfissional !== undefined && data.registroProfissional !== null) {
    values.registroProfissional = data.registroProfissional;
  }
  if (data.empresaId !== undefined && data.empresaId !== null) {
    values.empresaId = data.empresaId;
  }
  
  return db.insert(responsaveis).values(values as InsertResponsavel);
}

export async function updateResponsavel(id: number, data: Partial<InsertResponsavel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(responsaveis).set(data).where(eq(responsaveis.id, id));
}

export async function deleteResponsavel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(responsaveis).where(eq(responsaveis.id, id));
}

export async function deleteManyResponsaveis(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return;
  return db.delete(responsaveis).where(inArray(responsaveis.id, ids));
}

// === CERTIFICADOS EMITIDOS ===
export async function getAllCertificadosEmitidos(empresaId?: number, filters?: { searchTerm?: string; colaboradorId?: number; modeloCertificadoId?: number; empresaId?: number; mes?: string; ano?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  // Se empresaId foi passado como parâmetro ou nos filtros, usar ele
  const empresaIdFinal = filters?.empresaId || empresaId;
  if (empresaIdFinal) {
    conditions.push(eq(certificadosEmitidos.empresaId, empresaIdFinal));
  }
  
  if (filters?.searchTerm) {
    conditions.push(
      sql`LOWER(${certificadosEmitidos.nomeColaborador}) LIKE LOWER(${`%${filters.searchTerm}%`})`
    );
  }
  
  if (filters?.colaboradorId) {
    conditions.push(eq(certificadosEmitidos.colaboradorId, filters.colaboradorId));
  }
  
  if (filters?.modeloCertificadoId) {
    conditions.push(eq(certificadosEmitidos.modeloCertificadoId, filters.modeloCertificadoId));
  }
  
  // Filtro por mês
  if (filters?.mes) {
    conditions.push(sql`MONTH(${certificadosEmitidos.dataEmissao}) = ${parseInt(filters.mes)}`);
  }
  
  // Filtro por ano
  if (filters?.ano) {
    conditions.push(sql`YEAR(${certificadosEmitidos.dataEmissao}) = ${parseInt(filters.ano)}`);
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db.select()
    .from(certificadosEmitidos)
    .where(whereClause)
    .orderBy(desc(certificadosEmitidos.dataEmissao));
}

export async function getCertificadoEmitidoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificadosEmitidos).where(eq(certificadosEmitidos.id, id)).limit(1);
  return result[0];
}

export async function createCertificadoEmitido(data: InsertCertificadoEmitido) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(certificadosEmitidos).values(data);
  return result;
}

export async function deleteCertificadoEmitido(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(certificadosEmitidos).where(eq(certificadosEmitidos.id, id));
}

export async function deleteManyCertificadosEmitidos(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { deleted: 0 };
  await db.delete(certificadosEmitidos).where(inArray(certificadosEmitidos.id, ids));
  return { deleted: ids.length };
}

// Tipos de EPIs
export async function getAllTiposEpis(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (searchTerm) {
    return db.select()
      .from(tiposEpis)
      .where(
        or(
          sql`LOWER(${tiposEpis.tipoEpi}) LIKE LOWER(${`%${searchTerm}%`})`,
          sql`LOWER(${tiposEpis.fabricante}) LIKE LOWER(${`%${searchTerm}%`})`,
          sql`LOWER(${tiposEpis.caNumero}) LIKE LOWER(${`%${searchTerm}%`})`
        )
      )
      .orderBy(asc(tiposEpis.tipoEpi));
  }
  
  return db.select()
    .from(tiposEpis)
    .orderBy(asc(tiposEpis.tipoEpi));
}

export async function getTipoEpiById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tiposEpis).where(eq(tiposEpis.id, id)).limit(1);
  return result[0];
}

export async function createTipoEpi(data: InsertTipoEpi) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tiposEpis).values(data);
  return result;
}

export async function updateTipoEpi(id: number, data: Partial<InsertTipoEpi>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tiposEpis).set(data).where(eq(tiposEpis.id, id));
}

export async function deleteTipoEpi(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(tiposEpis).where(eq(tiposEpis.id, id));
}

export async function deleteManyTiposEpis(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { deleted: 0 };
  await db.delete(tiposEpis).where(inArray(tiposEpis.id, ids));
  return { deleted: ids.length };
}

// ========== ORDENS DE SERVIÇO ==========

export async function createOrdemServico(data: InsertOrdemServico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (!_connection) {
    throw new Error("Database connection not available");
  }
  
  // Preparar dados para inserção
  const dataToInsert: any = { ...data };
  
  // Validar e formatar dataEmissao
  if (!dataToInsert.dataEmissao) {
    throw new Error("Data de emissão é obrigatória");
  }
  
  let dataEmissaoStr = "";
  if (typeof dataToInsert.dataEmissao === 'string') {
    dataEmissaoStr = dataToInsert.dataEmissao.trim();
  } else if (dataToInsert.dataEmissao instanceof Date) {
    // Converter Date para string YYYY-MM-DD usando métodos locais (não UTC)
    // para evitar problemas de timezone que podem mudar o dia
    const year = dataToInsert.dataEmissao.getFullYear();
    const month = String(dataToInsert.dataEmissao.getMonth() + 1).padStart(2, '0');
    const day = String(dataToInsert.dataEmissao.getDate()).padStart(2, '0');
    dataEmissaoStr = `${year}-${month}-${day}`;
  } else {
    throw new Error(`Formato de data inválido: ${typeof dataToInsert.dataEmissao}`);
  }
  
  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dataEmissaoStr)) {
    throw new Error(`Formato de data inválido: ${dataEmissaoStr}. Use YYYY-MM-DD`);
  }
  
  // Validar que a data é válida (usar data local, não UTC)
  const [year, month, day] = dataEmissaoStr.split('-').map(Number);
  const testDate = new Date(year, month - 1, day);
  if (testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
    throw new Error(`Data inválida: ${dataEmissaoStr}`);
  }
  
  // Log para debug - verificar se a data está correta antes de salvar
  console.log("=== VALIDAÇÃO DE DATA ===");
  console.log("Data recebida do frontend:", data.dataEmissao);
  console.log("Data formatada para salvar:", dataEmissaoStr);
  console.log("Ano:", year, "Mês:", month, "Dia:", day);
  console.log("Data de teste:", testDate.toISOString());
  
  // Garantir que não seja uma data padrão suspeita
  if (dataEmissaoStr === '2024-12-31') {
    console.warn("ATENÇÃO: Tentando salvar data padrão 2024-12-31. Verificar se é intencional.");
  }
  
  // Garantir que cidade e uf sejam strings ou null
  if (dataToInsert.cidade !== undefined && dataToInsert.cidade !== null) {
    dataToInsert.cidade = String(dataToInsert.cidade).trim() || null;
  }
  if (dataToInsert.uf !== undefined && dataToInsert.uf !== null) {
    dataToInsert.uf = String(dataToInsert.uf).trim() || null;
  }
  
  // Usar SQL direto para garantir que a data seja salva corretamente
  const sqlQuery = `
    INSERT INTO ordensServico (
      numeroOrdem, empresaId, colaboradorId, obraId, descricaoServico,
      tipoServico, prioridade, status, dataEmissao, dataPrevistaConclusao,
      dataConclusao, observacoes, responsavelEmissao, responsavelId, valorServico,
      tipoRisco, nrRelacionada, acaoCorretiva, modeloId, cidade, uf
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    dataToInsert.numeroOrdem,
    dataToInsert.empresaId,
    dataToInsert.colaboradorId || null,
    dataToInsert.obraId || null,
    dataToInsert.descricaoServico || "",
    dataToInsert.tipoServico || null,
    dataToInsert.prioridade || "media",
    dataToInsert.status || "aberta",
    dataEmissaoStr, // Usar string diretamente no formato YYYY-MM-DD
    dataToInsert.dataPrevistaConclusao || null,
    dataToInsert.dataConclusao || null,
    dataToInsert.observacoes || null,
    dataToInsert.responsavelEmissao || null,
    dataToInsert.responsavelId || null,
    dataToInsert.valorServico || null,
    dataToInsert.tipoRisco || null,
    dataToInsert.nrRelacionada || null,
    dataToInsert.acaoCorretiva || null,
    dataToInsert.modeloId || null,
    dataToInsert.cidade || null,
    dataToInsert.uf || null,
  ];
  
  // Log para debug
  console.log("=== DEBUG CREATE ORDEM SERVICO ===");
  console.log("Data recebida do frontend:", data.dataEmissao);
  console.log("Data formatada para SQL:", dataEmissaoStr);
  console.log("Valores completos:", values);
  console.log("SQL Query:", sqlQuery);
  
  // Garantir que a data seja passada como string literal no SQL
  const [result]: any = await _connection.execute(sqlQuery, values);
  const insertedId = Number(result.insertId);
  
  // Verificar o que foi salvo usando DATE_FORMAT para garantir formato correto
  const [verificacao]: any = await _connection.execute(
    "SELECT DATE_FORMAT(dataEmissao, '%Y-%m-%d') as dataEmissao FROM ordensServico WHERE id = ?",
    [insertedId]
  );
  const dataSalva = verificacao[0]?.dataEmissao;
  console.log("Data salva no banco:", dataSalva);
  console.log("Data que foi enviada:", dataEmissaoStr);
  console.log("São iguais?", dataSalva === dataEmissaoStr);
  
  if (dataSalva !== dataEmissaoStr) {
    console.error("ERRO: Data salva não corresponde à data enviada!");
    console.error("Enviada:", dataEmissaoStr);
    console.error("Salva:", dataSalva);
  }
  
  console.log("=== FIM DEBUG ===");
  
  return getOrdemServicoById(insertedId);
}

export async function getAllOrdensServico(empresaId?: number, filters?: { status?: string; prioridade?: string; searchTerm?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  if (!_connection) {
    throw new Error("Database connection not available");
  }
  
  // Usar SQL direto para garantir que dataEmissao seja retornada como string YYYY-MM-DD
  let sqlQuery = `
    SELECT 
      os.id, os.numeroOrdem, os.empresaId, os.colaboradorId, os.obraId,
      os.descricaoServico, os.tipoServico, os.prioridade, os.status,
      DATE_FORMAT(os.dataEmissao, '%Y-%m-%d') as dataEmissao,
      DATE_FORMAT(os.dataPrevistaConclusao, '%Y-%m-%d') as dataPrevistaConclusao,
      DATE_FORMAT(os.dataConclusao, '%Y-%m-%d') as dataConclusao,
      os.observacoes, os.responsavelEmissao, os.responsavelId, os.valorServico,
      os.tipoRisco, os.nrRelacionada, os.acaoCorretiva, os.createdAt,
      os.modeloId, os.cidade, os.uf,
      e.razaoSocial as empresaNome, e.cnpj as empresaCnpj,
      c.nomeCompleto as colaboradorNome, c.funcao as colaboradorFuncao,
      c.cargoId as colaboradorCargoId,
      DATE_FORMAT(c.dataAdmissao, '%Y-%m-%d') as colaboradorDataAdmissao,
      car.descricao as colaboradorDescricaoCargo,
      o.nomeObra as obraNome,
      r.nomeCompleto as responsavelNome, r.funcao as responsavelFuncao, r.registroProfissional as responsavelRegistroProfissional
    FROM ordensServico os
    LEFT JOIN empresas e ON os.empresaId = e.id
    LEFT JOIN colaboradores c ON os.colaboradorId = c.id
    LEFT JOIN cargos car ON c.cargoId = car.id
    LEFT JOIN obras o ON os.obraId = o.id
    LEFT JOIN responsaveis r ON os.responsavelId = r.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (empresaId) {
    sqlQuery += ` AND os.empresaId = ?`;
    params.push(empresaId);
  }
  
  if (filters?.status) {
    sqlQuery += ` AND os.status = ?`;
    params.push(filters.status);
  }
  
  if (filters?.prioridade) {
    sqlQuery += ` AND os.prioridade = ?`;
    params.push(filters.prioridade);
  }
  
  if (filters?.searchTerm) {
    sqlQuery += ` AND (
      os.numeroOrdem LIKE ? OR
      os.descricaoServico LIKE ? OR
      e.razaoSocial LIKE ?
    )`;
    const searchPattern = `%${filters.searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  sqlQuery += ` ORDER BY os.dataEmissao DESC`;
  
  const [rows]: any = await _connection.execute(sqlQuery, params);
  
  // Retornar diretamente - já vem como string YYYY-MM-DD do DATE_FORMAT
  return rows;
}

export async function getOrdemServicoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  if (!_connection) {
    throw new Error("Database connection not available");
  }
  
  // Usar SQL direto para garantir que a data seja retornada corretamente
  const [rows]: any = await _connection.execute(
    `SELECT 
      os.id, os.numeroOrdem, os.empresaId, os.colaboradorId, os.obraId,
      os.descricaoServico, os.tipoServico, os.prioridade, os.status,
      DATE_FORMAT(os.dataEmissao, '%Y-%m-%d') as dataEmissao,
      DATE(os.dataPrevistaConclusao) as dataPrevistaConclusao,
      DATE(os.dataConclusao) as dataConclusao,
      os.observacoes, os.responsavelEmissao, os.responsavelId, os.valorServico,
      os.tipoRisco, os.nrRelacionada, os.acaoCorretiva, os.createdAt,
      os.modeloId, os.cidade, os.uf,
      e.razaoSocial as empresaNome, e.cnpj as empresaCnpj,
      c.nomeCompleto as colaboradorNome, c.funcao as colaboradorFuncao,
      c.cargoId as colaboradorCargoId,
      DATE_FORMAT(c.dataAdmissao, '%Y-%m-%d') as colaboradorDataAdmissao,
      car.descricao as colaboradorDescricaoCargo,
      o.nomeObra as obraNome,
      r.nomeCompleto as responsavelNome, r.funcao as responsavelFuncao, r.registroProfissional as responsavelRegistroProfissional
    FROM ordensServico os
    LEFT JOIN empresas e ON os.empresaId = e.id
    LEFT JOIN colaboradores c ON os.colaboradorId = c.id
    LEFT JOIN cargos car ON c.cargoId = car.id
    LEFT JOIN obras o ON os.obraId = o.id
    LEFT JOIN responsaveis r ON os.responsavelId = r.id
    WHERE os.id = ?`,
    [id]
  );
  
  if (!rows || rows.length === 0) {
    return null;
  }
  
  const ordem = rows[0];
  
  // Garantir que dataEmissao seja retornada como string YYYY-MM-DD
  if (ordem.dataEmissao) {
    if (ordem.dataEmissao instanceof Date) {
      const year = ordem.dataEmissao.getFullYear();
      const month = String(ordem.dataEmissao.getMonth() + 1).padStart(2, '0');
      const day = String(ordem.dataEmissao.getDate()).padStart(2, '0');
      ordem.dataEmissao = `${year}-${month}-${day}`;
    } else if (typeof ordem.dataEmissao === 'string' && ordem.dataEmissao.includes('T')) {
      // Se vier como ISO string, extrair apenas a data
      ordem.dataEmissao = ordem.dataEmissao.split('T')[0];
    }
  }
  
  return ordem;
}

export async function updateOrdemServico(id: number, data: Partial<InsertOrdemServico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (!_connection) {
    throw new Error("Database connection not available");
  }
  
  // Preparar dados para atualização
  const dataToUpdate: any = { ...data };
  
  // Validar e formatar dataEmissao se fornecida
  if (dataToUpdate.dataEmissao !== undefined) {
    let dataEmissaoStr = "";
    if (typeof dataToUpdate.dataEmissao === 'string') {
      dataEmissaoStr = dataToUpdate.dataEmissao.trim();
    } else if (dataToUpdate.dataEmissao instanceof Date) {
      // Converter Date para string YYYY-MM-DD
      const year = dataToUpdate.dataEmissao.getFullYear();
      const month = String(dataToUpdate.dataEmissao.getMonth() + 1).padStart(2, '0');
      const day = String(dataToUpdate.dataEmissao.getDate()).padStart(2, '0');
      dataEmissaoStr = `${year}-${month}-${day}`;
    } else {
      throw new Error(`Formato de data inválido: ${typeof dataToUpdate.dataEmissao}`);
    }
    
    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataEmissaoStr)) {
      throw new Error(`Formato de data inválido: ${dataEmissaoStr}. Use YYYY-MM-DD`);
    }
    
    // Validar que a data é válida
    const [year, month, day] = dataEmissaoStr.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    if (testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
      throw new Error(`Data inválida: ${dataEmissaoStr}`);
    }
    
    dataToUpdate.dataEmissao = dataEmissaoStr; // Usar string diretamente
  }
  
  // Garantir que cidade e uf sejam strings ou null
  if (dataToUpdate.cidade !== undefined) {
    dataToUpdate.cidade = dataToUpdate.cidade ? String(dataToUpdate.cidade).trim() : null;
  }
  if (dataToUpdate.uf !== undefined) {
    dataToUpdate.uf = dataToUpdate.uf ? String(dataToUpdate.uf).trim() : null;
  }
  
  // Remover campos undefined para evitar problemas
  const cleanData: any = {};
  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] !== undefined) {
      cleanData[key] = dataToUpdate[key];
    }
  });
  
  if (Object.keys(cleanData).length === 0) {
    // Nenhum campo para atualizar, retornar dados atuais
    return getOrdemServicoById(id);
  }
  
  // Construir query SQL dinamicamente
  const setClauses: string[] = [];
  const values: any[] = [];
  
  Object.keys(cleanData).forEach(key => {
    setClauses.push(`${key} = ?`);
    values.push(cleanData[key]);
  });
  
  values.push(id); // Para o WHERE
  
  const sqlQuery = `UPDATE ordensServico SET ${setClauses.join(', ')} WHERE id = ?`;
  
  await _connection.execute(sqlQuery, values);
  const updated = await getOrdemServicoById(id);
  
  if (!updated) {
    throw new Error(`Ordem de serviço com ID ${id} não encontrada após atualização`);
  }
  
  return updated;
}

export async function deleteOrdemServico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(ordensServico).where(eq(ordensServico.id, id));
}

export async function deleteManyOrdensServico(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { deleted: 0 };
  await db.delete(ordensServico).where(inArray(ordensServico.id, ids));
  return { deleted: ids.length };
}

export async function getNextNumeroOrdem() {
  const db = await getDb();
  if (!db) return "OS-0001";
  
  try {
    const result = await db
      .select({ numeroOrdem: ordensServico.numeroOrdem })
      .from(ordensServico)
      .orderBy(desc(ordensServico.numeroOrdem))
      .limit(1);
    
    if (result.length === 0 || !result[0].numeroOrdem) {
      return "OS-0001";
    }
    
    const lastNumero = result[0].numeroOrdem;
    const match = lastNumero.match(/OS-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `OS-${nextNum.toString().padStart(4, "0")}`;
    }
    
    return "OS-0001";
  } catch (error) {
    console.error("Erro ao buscar próximo número de ordem:", error);
    return "OS-0001";
  }
}

// === PERMISSÕES ===

/**
 * Verifica se um usuário tem uma permissão específica
 * Admins sempre têm todas as permissões
 */
export async function userHasPermission(userId: number, codigoPermissao: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Verifica se o usuário é admin
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length > 0 && user[0].role === "admin") {
      return true; // Admins têm todas as permissões
    }

    // Busca a permissão pelo código
    const permissao = await db.select().from(permissoes).where(eq(permissoes.codigo, codigoPermissao)).limit(1);
    if (permissao.length === 0) {
      return false; // Permissão não existe
    }

    // Verifica se o usuário tem a permissão
    const userPerm = await db.select()
      .from(userPermissoes)
      .where(and(
        eq(userPermissoes.userId, userId),
        eq(userPermissoes.permissaoId, permissao[0].id)
      ))
      .limit(1);

    return userPerm.length > 0;
  } catch (error) {
    console.error("[Database] Erro ao verificar permissão:", error);
    return false;
  }
}

/**
 * Obtém todas as permissões de um usuário
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length > 0 && user[0].role === "admin") {
      // Admin tem todas as permissões
      const allPerms = await db.select({ codigo: permissoes.codigo }).from(permissoes);
      return allPerms.map(p => p.codigo);
    }

    const result = await db.select({ codigo: permissoes.codigo })
      .from(userPermissoes)
      .innerJoin(permissoes, eq(userPermissoes.permissaoId, permissoes.id))
      .where(eq(userPermissoes.userId, userId));

    return result.map(r => r.codigo);
  } catch (error) {
    console.error("[Database] Erro ao buscar permissões do usuário:", error);
    return [];
  }
}

/**
 * Lista todas as permissões disponíveis
 */
export async function getAllPermissoes() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(permissoes).orderBy(asc(permissoes.modulo), asc(permissoes.nome));
  } catch (error) {
    console.error("[Database] Erro ao listar permissões:", error);
    return [];
  }
}

/**
 * Obtém permissões de um usuário com detalhes
 */
export async function getUserPermissionsWithDetails(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length > 0 && user[0].role === "admin") {
      // Admin tem todas as permissões
      return await db.select().from(permissoes).orderBy(asc(permissoes.modulo), asc(permissoes.nome));
    }

    return await db.select({
      id: permissoes.id,
      codigo: permissoes.codigo,
      nome: permissoes.nome,
      descricao: permissoes.descricao,
      modulo: permissoes.modulo,
      acao: permissoes.acao,
    })
      .from(userPermissoes)
      .innerJoin(permissoes, eq(userPermissoes.permissaoId, permissoes.id))
      .where(eq(userPermissoes.userId, userId))
      .orderBy(asc(permissoes.modulo), asc(permissoes.nome));
  } catch (error) {
    console.error("[Database] Erro ao buscar permissões detalhadas:", error);
    return [];
  }
}

/**
 * Atribui permissões a um usuário
 */
export async function assignPermissionsToUser(userId: number, permissaoIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Remove permissões existentes
    await db.delete(userPermissoes).where(eq(userPermissoes.userId, userId));

    // Adiciona novas permissões
    if (permissaoIds.length > 0) {
      const inserts: InsertUserPermissao[] = permissaoIds.map(permissaoId => ({
        userId,
        permissaoId,
      }));
      await db.insert(userPermissoes).values(inserts);
    }
  } catch (error) {
    console.error("[Database] Erro ao atribuir permissões:", error);
    throw error;
  }
}

/**
 * Cria uma permissão
 */
export async function createPermissao(permissaoData: InsertPermissao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(permissoes).values(permissaoData);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) {
      return await db.select().from(permissoes).where(eq(permissoes.id, insertId)).limit(1);
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar permissão:", error);
    throw error;
  }
}

// === PERMISSÕES USUÁRIOS (Nova estrutura com campos booleanos) ===

/**
 * Obtém permissões de um usuário
 */
export async function getPermissoesUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(permissoesUsuarios)
      .where(eq(permissoesUsuarios.usuarioId, usuarioId))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao obter permissões do usuário:", error);
    throw error;
  }
}

/**
 * Cria ou atualiza permissões de um usuário
 */
export async function upsertPermissoesUsuario(usuarioId: number, permissoesData: Omit<InsertPermissoesUsuario, "usuarioId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Verifica se já existe
    const existente = await getPermissoesUsuario(usuarioId);
    
    if (existente) {
      // Atualiza
      await db
        .update(permissoesUsuarios)
        .set({
          ...permissoesData,
          updatedAt: new Date(),
        })
        .where(eq(permissoesUsuarios.usuarioId, usuarioId));
      
      return await getPermissoesUsuario(usuarioId);
    } else {
      // Cria novo
      const result = await db.insert(permissoesUsuarios).values({
        usuarioId,
        ...permissoesData,
      });
      
      const insertId = (result as any)[0]?.insertId;
      if (insertId) {
        return await db
          .select()
          .from(permissoesUsuarios)
          .where(eq(permissoesUsuarios.id, insertId))
          .limit(1);
      }
      return null;
    }
  } catch (error) {
    console.error("[Database] Erro ao salvar permissões do usuário:", error);
    throw error;
  }
}

/**
 * Lista todas as permissões de usuários com informações dos usuários
 */
export async function getAllPermissoesUsuarios() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select({
        id: permissoesUsuarios.id,
        usuarioId: permissoesUsuarios.usuarioId,
        nome: users.name,
        email: users.email,
        role: users.role,
        empresasView: permissoesUsuarios.empresasView,
        empresasAdd: permissoesUsuarios.empresasAdd,
        empresasEdit: permissoesUsuarios.empresasEdit,
        empresasDelete: permissoesUsuarios.empresasDelete,
        empregadosView: permissoesUsuarios.empregadosView,
        empregadosAdd: permissoesUsuarios.empregadosAdd,
        empregadosEdit: permissoesUsuarios.empregadosEdit,
        empregadosDelete: permissoesUsuarios.empregadosDelete,
        fichasView: permissoesUsuarios.fichasView,
        fichasAdd: permissoesUsuarios.fichasAdd,
        fichasEdit: permissoesUsuarios.fichasEdit,
        fichasDelete: permissoesUsuarios.fichasDelete,
        osView: permissoesUsuarios.osView,
        osAdd: permissoesUsuarios.osAdd,
        osEdit: permissoesUsuarios.osEdit,
        osDelete: permissoesUsuarios.osDelete,
        treinamentosView: permissoesUsuarios.treinamentosView,
        treinamentosAdd: permissoesUsuarios.treinamentosAdd,
        treinamentosEdit: permissoesUsuarios.treinamentosEdit,
        treinamentosDelete: permissoesUsuarios.treinamentosDelete,
        certificadosView: permissoesUsuarios.certificadosView,
        certificadosAdd: permissoesUsuarios.certificadosAdd,
        certificadosEdit: permissoesUsuarios.certificadosEdit,
        certificadosDelete: permissoesUsuarios.certificadosDelete,
        createdAt: permissoesUsuarios.createdAt,
        updatedAt: permissoesUsuarios.updatedAt,
      })
      .from(permissoesUsuarios)
      .leftJoin(users, eq(permissoesUsuarios.usuarioId, users.id));
    
    return result;
  } catch (error) {
    console.error("[Database] Erro ao listar permissões de usuários:", error);
    throw error;
  }
}
