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
  permissoesUsuarios, InsertPermissoesUsuario,
  asos, InsertAso
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

// === USUÁRIOS ===

/**
 * Busca usuário por email, CPF ou CNPJ
 */
export async function getUserByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log(`[DB] Buscando usuário com identificador: "${identifier}"`);
    
    // Tenta buscar por email (case-insensitive)
    const emailLower = identifier.toLowerCase();
    let user = await db.select().from(users).where(eq(users.email, emailLower)).limit(1);
    if (user.length > 0) {
      console.log(`[DB] Usuário encontrado por email: ID=${user[0].id}`);
      return user[0];
    }

    // Verifica se é CPF (11 dígitos)
    const isCPF = /^\d{11}$/.test(identifier);
    if (isCPF) {
      console.log(`[DB] Buscando por CPF: ${identifier}`);
      user = await db.select().from(users).where(eq(users.cpf, identifier)).limit(1);
      if (user.length > 0) {
        console.log(`[DB] Usuário encontrado por CPF: ID=${user[0].id}`);
        return user[0];
      }
    }

    // Verifica se é CNPJ (14 dígitos)
    const isCNPJ = /^\d{14}$/.test(identifier);
    if (isCNPJ) {
      console.log(`[DB] Buscando por CNPJ: ${identifier}`);
      user = await db.select().from(users).where(eq(users.cnpj, identifier)).limit(1);
      if (user.length > 0) {
        console.log(`[DB] Usuário encontrado por CNPJ: ID=${user[0].id}`);
        return user[0];
      }
    }

    // Tenta normalizar e buscar novamente
    const cleanCPF = normalizeCPF(identifier);
    if (cleanCPF.length === 11 && cleanCPF !== identifier) {
      console.log(`[DB] Tentando CPF normalizado: ${cleanCPF}`);
      user = await db.select().from(users).where(eq(users.cpf, cleanCPF)).limit(1);
      if (user.length > 0) {
        console.log(`[DB] Usuário encontrado por CPF normalizado: ID=${user[0].id}`);
        return user[0];
      }
    }

    const cleanCNPJ = normalizeCNPJ(identifier);
    if (cleanCNPJ.length === 14 && cleanCNPJ !== identifier) {
      console.log(`[DB] Tentando CNPJ normalizado: ${cleanCNPJ}`);
      user = await db.select().from(users).where(eq(users.cnpj, cleanCNPJ)).limit(1);
      if (user.length > 0) {
        console.log(`[DB] Usuário encontrado por CNPJ normalizado: ID=${user[0].id}`);
        return user[0];
      }
    }

    console.log(`[DB] Nenhum usuário encontrado para: "${identifier}"`);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao buscar usuário:", error);
    throw error;
  }
}

/**
 * Busca usuário por openId
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar usuário por openId:", error);
    throw error;
  }
}

/**
 * Cria ou atualiza usuário
 */
export async function upsertUser(userData: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Se tem ID, atualiza pelo ID
    if (userData.id) {
      const existing = await getUserById(userData.id);
      if (existing) {
        await db.update(users).set({
          ...userData,
          updatedAt: new Date(),
        }).where(eq(users.id, userData.id));
        return await getUserById(userData.id);
      }
    }
    
    // Se tem openId, tenta atualizar pelo openId
    if (userData.openId) {
      const existing = await getUserByOpenId(userData.openId);
      if (existing) {
        await db.update(users).set({
          ...userData,
          updatedAt: new Date(),
        }).where(eq(users.id, existing.id));
        return await getUserByOpenId(userData.openId);
      }
    }

    // Se não existe, cria novo (só se tiver dados mínimos)
    if (userData.email || userData.cpf || userData.cnpj) {
      const result = await db.insert(users).values(userData as InsertUser);
      const insertId = (result as any)[0]?.insertId;
      if (insertId) {
        return await getUserById(insertId);
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar/atualizar usuário:", error);
    throw error;
  }
}

// === EMPRESAS ===

export async function getAllEmpresas(filters?: { searchTerm?: string; dataInicio?: string; dataFim?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    let query = db.select().from(empresas);
    
    if (filters?.searchTerm) {
      query = query.where(
        or(
          sql`${empresas.razaoSocial} LIKE ${`%${filters.searchTerm}%`}`,
          sql`${empresas.cnpj} LIKE ${`%${filters.searchTerm}%`}`
        )
      ) as any;
    }
    
    return await query.orderBy(desc(empresas.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar empresas:", error);
    throw error;
  }
}

export async function getEmpresaById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar empresa:", error);
    throw error;
  }
}

export async function createEmpresa(data: InsertEmpresa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(empresas).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) {
      return await getEmpresaById(insertId);
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar empresa:", error);
    throw error;
  }
}

export async function updateEmpresa(id: number, data: Partial<InsertEmpresa>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(empresas).set({ ...data, updatedAt: new Date() }).where(eq(empresas.id, id));
    return await getEmpresaById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar empresa:", error);
    throw error;
  }
}

export async function deleteEmpresa(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(empresas).where(eq(empresas.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir empresa:", error);
    throw error;
  }
}

// === COLABORADORES ===

export async function getAllColaboradores(empresaId: number | null, filters?: { searchTerm?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    let query = db.select().from(colaboradores);
    
    if (empresaId) {
      query = query.where(eq(colaboradores.empresaId, empresaId)) as any;
    }
    
    if (filters?.searchTerm) {
      const conditions = [
        sql`${colaboradores.nomeCompleto} LIKE ${`%${filters.searchTerm}%`}`,
        sql`${colaboradores.cpf} LIKE ${`%${filters.searchTerm}%`}`,
        sql`${colaboradores.rg} LIKE ${`%${filters.searchTerm}%`}`
      ];
      query = query.where(and(
        empresaId ? eq(colaboradores.empresaId, empresaId) : undefined,
        or(...conditions)
      ) as any) as any;
    }
    
    return await query.orderBy(desc(colaboradores.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar colaboradores:", error);
    throw error;
  }
}

export async function getColaboradorById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.select().from(colaboradores).where(eq(colaboradores.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar colaborador:", error);
    throw error;
  }
}

export async function createColaborador(data: InsertColaborador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(colaboradores).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) {
      return await getColaboradorById(insertId);
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar colaborador:", error);
    throw error;
  }
}

export async function updateColaborador(id: number, data: Partial<InsertColaborador>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(colaboradores).set({ ...data, updatedAt: new Date() }).where(eq(colaboradores.id, id));
    return await getColaboradorById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar colaborador:", error);
    throw error;
  }
}

export async function deleteColaborador(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(colaboradores).where(eq(colaboradores.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir colaborador:", error);
    throw error;
  }
}

export async function deleteColaboradores(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(colaboradores).where(inArray(colaboradores.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir colaboradores:", error);
    throw error;
  }
}

export async function getColaboradorStats(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Estatísticas básicas
    let baseQuery = db.select({
      total: sql<number>`COUNT(*)`.as('total'),
      ativos: sql<number>`SUM(CASE WHEN ${colaboradores.status} = 'ativo' THEN 1 ELSE 0 END)`.as('ativos'),
      inativos: sql<number>`SUM(CASE WHEN ${colaboradores.status} = 'inativo' THEN 1 ELSE 0 END)`.as('inativos')
    }).from(colaboradores);
    
    if (empresaId) {
      baseQuery = baseQuery.where(eq(colaboradores.empresaId, empresaId)) as any;
    }
    
    const [baseStats] = await baseQuery;
    
    // Estatísticas por sexo
    let sexoQuery = db.select({
      sexo: colaboradores.sexo,
      count: sql<number>`COUNT(*)`.as('count')
    }).from(colaboradores)
      .groupBy(colaboradores.sexo);
    
    if (empresaId) {
      sexoQuery = sexoQuery.where(eq(colaboradores.empresaId, empresaId)) as any;
    }
    const sexoStats = await sexoQuery;
    
    // Estatísticas por setor (join com setores)
    let setorQuery = db.select({
      setor: setores.nomeSetor,
      count: sql<number>`COUNT(*)`.as('count')
    })
      .from(colaboradores)
      .leftJoin(setores, eq(colaboradores.setorId, setores.id))
      .groupBy(setores.nomeSetor);
    
    if (empresaId) {
      setorQuery = setorQuery.where(eq(colaboradores.empresaId, empresaId)) as any;
    }
    const setorStats = await setorQuery;
    
    // Estatísticas por função/cargo (join com cargos)
    let funcaoQuery = db.select({
      funcao: cargos.nomeCargo,
      count: sql<number>`COUNT(*)`.as('count')
    })
      .from(colaboradores)
      .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
      .groupBy(cargos.nomeCargo);
    
    if (empresaId) {
      funcaoQuery = funcaoQuery.where(eq(colaboradores.empresaId, empresaId)) as any;
    }
    const funcaoStats = await funcaoQuery;
    
    // Estatísticas por status
    let statusQuery = db.select({
      status: colaboradores.status,
      count: sql<number>`COUNT(*)`.as('count')
    }).from(colaboradores)
      .groupBy(colaboradores.status);
    
    if (empresaId) {
      statusQuery = statusQuery.where(eq(colaboradores.empresaId, empresaId)) as any;
    }
    const statusStats = await statusQuery;
    
    return {
      total: baseStats?.total || 0,
      ativos: baseStats?.ativos || 0,
      inativos: baseStats?.inativos || 0,
      sexo: sexoStats.map((s: any) => ({ sexo: s.sexo, count: Number(s.count) })),
      setor: setorStats.map((s: any) => ({ setor: s.setor || "Sem setor", count: Number(s.count) })),
      funcoes: funcaoStats.map((f: any) => ({ funcao: f.funcao || "Sem função", count: Number(f.count) })),
      status: statusStats.map((s: any) => ({ status: s.status, count: Number(s.count) })),
    };
  } catch (error) {
    console.error("[Database] Erro ao buscar estatísticas de colaboradores:", error);
    throw error;
  }
}

// === OBRAS ===

export async function getAllObras(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    let query = db.select().from(obras);
    
    if (empresaId) {
      query = query.where(eq(obras.empresaId, empresaId)) as any;
    }
    
    return await query.orderBy(desc(obras.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar obras:", error);
    throw error;
  }
}

export async function getObraById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.select().from(obras).where(eq(obras.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar obra:", error);
    throw error;
  }
}

export async function createObra(data: InsertObra) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(obras).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) {
      return await getObraById(insertId);
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar obra:", error);
    throw error;
  }
}

export async function updateObra(id: number, data: Partial<InsertObra>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(obras).set({ ...data, updatedAt: new Date() }).where(eq(obras.id, id));
    return await getObraById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar obra:", error);
    throw error;
  }
}

export async function deleteObra(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(obras).where(eq(obras.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir obra:", error);
    throw error;
  }
}

// === DASHBOARD ===

export async function getDashboardStats(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Empresas ativas
    let empresasQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(empresas)
      .where(eq(empresas.status, "ativa"));
    if (empresaId) {
      empresasQuery = empresasQuery.where(and(eq(empresas.status, "ativa"), eq(empresas.id, empresaId)) as any) as any;
    }
    const [empresasCount] = await empresasQuery;
    
    // Colaboradores ativos
    let colaboradoresQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(colaboradores)
      .where(eq(colaboradores.status, "ativo"));
    if (empresaId) {
      colaboradoresQuery = colaboradoresQuery.where(and(eq(colaboradores.status, "ativo"), eq(colaboradores.empresaId, empresaId)) as any) as any;
    }
    const [colaboradoresCount] = await colaboradoresQuery;
    
    // Obras ativas (status = "ativa")
    let obrasQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(obras)
      .where(eq(obras.status, "ativa"));
    if (empresaId) {
      obrasQuery = obrasQuery.where(and(eq(obras.status, "ativa"), eq(obras.empresaId, empresaId)) as any) as any;
    }
    const [obrasCount] = await obrasQuery;
    
    // Treinamentos vencidos (dataValidade < hoje)
    let treinamentosQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(treinamentos)
      .where(sql`${treinamentos.dataValidade} < CURDATE()`);
    if (empresaId) {
      treinamentosQuery = treinamentosQuery.where(and(sql`${treinamentos.dataValidade} < CURDATE()`, eq(treinamentos.empresaId, empresaId)) as any) as any;
    }
    const [treinamentosVencidos] = await treinamentosQuery;
    
    // EPIs vencidos ou vencendo (dataValidade < hoje ou próximo de vencer)
    let episQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(epis)
      .where(sql`${epis.dataValidade} < CURDATE()`);
    if (empresaId) {
      episQuery = episQuery.where(and(sql`${epis.dataValidade} < CURDATE()`, eq(epis.empresaId, empresaId)) as any) as any;
    }
    const [episVencidos] = await episQuery;
    
    return {
      empresasAtivas: empresasCount?.count || 0,
      colaboradoresAtivos: colaboradoresCount?.count || 0,
      obrasAtivas: obrasCount?.count || 0,
      treinamentosVencidos: treinamentosVencidos?.count || 0,
      episVencendo: episVencidos?.count || 0,
    };
  } catch (error) {
    console.error("[Database] Erro ao buscar estatísticas do dashboard:", error);
    throw error;
  }
}

// === PLACEHOLDER FUNCTIONS (para evitar erros) ===

export async function getAllPermissoes() {
  return [];
}

export async function getUserPermissionsWithDetails(userId: number) {
  return [];
}

export async function assignPermissionsToUser(userId: number, permissaoIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Remove permissões existentes do usuário
    await db.delete(userPermissoes).where(eq(userPermissoes.userId, userId));
    
    // Adiciona novas permissões
    if (permissaoIds.length > 0) {
      const values = permissaoIds.map(permissaoId => ({
        userId,
        permissaoId,
      }));
      await db.insert(userPermissoes).values(values);
    }
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atribuir permissões ao usuário:", error);
    throw error;
  }
}

export async function getAllUsers(filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(users);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function createUser(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }
  const result = await db.insert(users).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    return await getUserById(insertId);
  }
  return null;
}

export async function updateUser(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
  return await getUserById(id);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
  return { success: true };
}

// === TREINAMENTOS ===

export async function getAllTreinamentos(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(treinamentos);
    if (empresaId) {
      query = query.where(eq(treinamentos.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(treinamentos.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar treinamentos:", error);
    throw error;
  }
}

export async function getTreinamentoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(treinamentos).where(eq(treinamentos.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar treinamento:", error);
    throw error;
  }
}

export async function createTreinamento(data: InsertTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(treinamentos).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getTreinamentoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar treinamento:", error);
    throw error;
  }
}

export async function updateTreinamento(id: number, data: Partial<InsertTreinamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(treinamentos).set({ ...data, updatedAt: new Date() }).where(eq(treinamentos.id, id));
    return await getTreinamentoById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar treinamento:", error);
    throw error;
  }
}

export async function deleteTreinamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(treinamentos).where(eq(treinamentos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir treinamento:", error);
    throw error;
  }
}

// === EPIs ===

export async function getAllEpis(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(epis);
    if (empresaId) {
      query = query.where(eq(epis.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(epis.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar EPIs:", error);
    throw error;
  }
}

export async function getEpiById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(epis).where(eq(epis.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar EPI:", error);
    throw error;
  }
}

export async function createEpi(data: InsertEpi) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(epis).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getEpiById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar EPI:", error);
    throw error;
  }
}

export async function createMultipleEpis(episData: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const results = [];
    for (const epiData of episData) {
      const result = await db.insert(epis).values(epiData);
      const insertId = (result as any)[0]?.insertId;
      if (insertId) {
        results.push(await getEpiById(insertId));
      }
    }
    return results;
  } catch (error) {
    console.error("[Database] Erro ao criar múltiplos EPIs:", error);
    throw error;
  }
}

export async function updateEpi(id: number, data: Partial<InsertEpi>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(epis).set({ ...data, updatedAt: new Date() }).where(eq(epis.id, id));
    return await getEpiById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar EPI:", error);
    throw error;
  }
}

export async function deleteEpi(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(epis).where(eq(epis.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir EPI:", error);
    throw error;
  }
}

export async function getDadosFichaEPI(empresaId: number, colaboradorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, colaboradorId)).limit(1);
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
    const episColaborador = await db.select().from(epis).where(eq(epis.colaboradorId, colaboradorId));
    return { colaborador, empresa, epis: episColaborador };
  } catch (error) {
    console.error("[Database] Erro ao buscar dados da ficha EPI:", error);
    throw error;
  }
}

export async function getAllFichasEpiEmitidas(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(fichasEpiEmitidas);
    if (empresaId) {
      query = query.where(eq(fichasEpiEmitidas.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(fichasEpiEmitidas.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar fichas EPI emitidas:", error);
    throw error;
  }
}

export async function createFichaEpiEmitida(data: InsertFichaEpiEmitida) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(fichasEpiEmitidas).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) {
      const result2 = await db.select().from(fichasEpiEmitidas).where(eq(fichasEpiEmitidas.id, insertId)).limit(1);
      return result2[0] || null;
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar ficha EPI emitida:", error);
    throw error;
  }
}

export async function deleteFichaEpiEmitida(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(fichasEpiEmitidas).where(eq(fichasEpiEmitidas.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir ficha EPI emitida:", error);
    throw error;
  }
}

// === CARGOS ===

export async function getAllCargos(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(cargos);
    if (empresaId) {
      query = query.where(eq(cargos.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(cargos.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar cargos:", error);
    throw error;
  }
}

export async function getCargoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(cargos).where(eq(cargos.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar cargo:", error);
    throw error;
  }
}

export async function createCargo(data: InsertCargo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(cargos).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getCargoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar cargo:", error);
    throw error;
  }
}

export async function updateCargo(id: number, data: Partial<InsertCargo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(cargos).set({ ...data, updatedAt: new Date() }).where(eq(cargos.id, id));
    return await getCargoById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar cargo:", error);
    throw error;
  }
}

export async function deleteCargo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(cargos).where(eq(cargos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir cargo:", error);
    throw error;
  }
}

// === SETORES ===

export async function getAllSetores(filters?: any, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(setores);
    if (empresaId) {
      query = query.where(eq(setores.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(setores.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar setores:", error);
    throw error;
  }
}

export async function getSetorById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(setores).where(eq(setores.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar setor:", error);
    throw error;
  }
}

export async function createSetor(data: InsertSetor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(setores).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getSetorById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar setor:", error);
    throw error;
  }
}

export async function updateSetor(id: number, data: Partial<InsertSetor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(setores).set({ ...data, updatedAt: new Date() }).where(eq(setores.id, id));
    return await getSetorById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar setor:", error);
    throw error;
  }
}

export async function deleteSetor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(setores).where(eq(setores.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir setor:", error);
    throw error;
  }
}

export async function deleteSetores(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(setores).where(inArray(setores.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir setores:", error);
    throw error;
  }
}

// === CARGO TREINAMENTOS ===

export async function getTreinamentosByCargo(cargoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db.select().from(cargoTreinamentos).where(eq(cargoTreinamentos.cargoId, cargoId));
  } catch (error) {
    console.error("[Database] Erro ao buscar treinamentos do cargo:", error);
    throw error;
  }
}

export async function createCargoTreinamento(data: InsertCargoTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(cargoTreinamentos).values(data);
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao criar cargo treinamento:", error);
    throw error;
  }
}

export async function deleteCargoTreinamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(cargoTreinamentos).where(eq(cargoTreinamentos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir cargo treinamento:", error);
    throw error;
  }
}

// === CARGO SETORES ===

export async function getSetoresByCargo(cargoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db.select().from(cargoSetores).where(eq(cargoSetores.cargoId, cargoId));
  } catch (error) {
    console.error("[Database] Erro ao buscar setores do cargo:", error);
    throw error;
  }
}

export async function createCargoSetor(data: InsertCargoSetor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(cargoSetores).values(data);
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao criar cargo setor:", error);
    throw error;
  }
}

export async function deleteCargoSetor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(cargoSetores).where(eq(cargoSetores.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir cargo setor:", error);
    throw error;
  }
}

// === RISCOS OCUPACIONAIS ===

export async function getAllRiscosOcupacionais(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(riscosOcupacionais);
    if (empresaId) {
      query = query.where(eq(riscosOcupacionais.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(riscosOcupacionais.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar riscos ocupacionais:", error);
    throw error;
  }
}

export async function getRiscoOcupacionalById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(riscosOcupacionais).where(eq(riscosOcupacionais.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar risco ocupacional:", error);
    throw error;
  }
}

export async function createRiscoOcupacional(data: InsertRiscoOcupacional) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(riscosOcupacionais).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getRiscoOcupacionalById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar risco ocupacional:", error);
    throw error;
  }
}

export async function updateRiscoOcupacional(id: number, data: Partial<InsertRiscoOcupacional>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(riscosOcupacionais).set({ ...data, updatedAt: new Date() }).where(eq(riscosOcupacionais.id, id));
    return await getRiscoOcupacionalById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar risco ocupacional:", error);
    throw error;
  }
}

export async function deleteRiscoOcupacional(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(riscosOcupacionais).where(eq(riscosOcupacionais.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir risco ocupacional:", error);
    throw error;
  }
}

export async function getRiscosByCargo(cargoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db.select().from(cargoRiscos).where(eq(cargoRiscos.cargoId, cargoId));
  } catch (error) {
    console.error("[Database] Erro ao buscar riscos do cargo:", error);
    throw error;
  }
}

export async function createCargoRisco(data: InsertCargoRisco) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(cargoRiscos).values(data);
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao criar cargo risco:", error);
    throw error;
  }
}

export async function updateCargoRisco(id: number, data: Partial<InsertCargoRisco>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(cargoRiscos).set({ ...data, updatedAt: new Date() }).where(eq(cargoRiscos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atualizar cargo risco:", error);
    throw error;
  }
}

export async function deleteCargoRisco(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(cargoRiscos).where(eq(cargoRiscos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir cargo risco:", error);
    throw error;
  }
}

// === TIPOS TREINAMENTOS ===

export async function getAllTiposTreinamentos(filters?: any, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(tiposTreinamentos);
    if (empresaId) {
      query = query.where(eq(tiposTreinamentos.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(tiposTreinamentos.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar tipos de treinamentos:", error);
    throw error;
  }
}

export async function getTipoTreinamentoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(tiposTreinamentos).where(eq(tiposTreinamentos.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar tipo de treinamento:", error);
    throw error;
  }
}

export async function createTipoTreinamento(data: InsertTipoTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(tiposTreinamentos).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getTipoTreinamentoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar tipo de treinamento:", error);
    throw error;
  }
}

export async function updateTipoTreinamento(id: number, data: Partial<InsertTipoTreinamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(tiposTreinamentos).set({ ...data, updatedAt: new Date() }).where(eq(tiposTreinamentos.id, id));
    return await getTipoTreinamentoById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar tipo de treinamento:", error);
    throw error;
  }
}

export async function deleteTipoTreinamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(tiposTreinamentos).where(eq(tiposTreinamentos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir tipo de treinamento:", error);
    throw error;
  }
}

export async function deleteTiposTreinamentos(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(tiposTreinamentos).where(inArray(tiposTreinamentos.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir tipos de treinamentos:", error);
    throw error;
  }
}

// === MODELOS CERTIFICADOS ===

export async function getAllModelosCertificados(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(modelosCertificados);
    if (empresaId) {
      query = query.where(eq(modelosCertificados.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(modelosCertificados.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar modelos de certificados:", error);
    throw error;
  }
}

export async function getModeloCertificadoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(modelosCertificados).where(eq(modelosCertificados.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar modelo de certificado:", error);
    throw error;
  }
}

export async function getModeloCertificadoPadrao(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(modelosCertificados).where(eq(modelosCertificados.padrao, true));
    if (empresaId) {
      query = query.where(and(eq(modelosCertificados.padrao, true), eq(modelosCertificados.empresaId, empresaId)) as any) as any;
    }
    const result = await query.limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar modelo padrão:", error);
    throw error;
  }
}

export async function createModeloCertificado(data: InsertModeloCertificado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(modelosCertificados).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getModeloCertificadoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar modelo de certificado:", error);
    throw error;
  }
}

export async function updateModeloCertificado(id: number, data: Partial<InsertModeloCertificado>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(modelosCertificados).set({ ...data, updatedAt: new Date() }).where(eq(modelosCertificados.id, id));
    return await getModeloCertificadoById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar modelo de certificado:", error);
    throw error;
  }
}

export async function deleteModeloCertificado(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(modelosCertificados).where(eq(modelosCertificados.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir modelo de certificado:", error);
    throw error;
  }
}

export async function deleteManyModelosCertificados(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(modelosCertificados).where(inArray(modelosCertificados.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir modelos de certificados:", error);
    throw error;
  }
}

// === RESPONSÁVEIS ===

export async function getAllResponsaveis(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(responsaveis);
    if (empresaId) {
      query = query.where(eq(responsaveis.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(responsaveis.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar responsáveis:", error);
    throw error;
  }
}

export async function getResponsavelById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(responsaveis).where(eq(responsaveis.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar responsável:", error);
    throw error;
  }
}

export async function createResponsavel(data: InsertResponsavel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(responsaveis).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getResponsavelById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar responsável:", error);
    throw error;
  }
}

export async function updateResponsavel(id: number, data: Partial<InsertResponsavel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(responsaveis).set({ ...data, updatedAt: new Date() }).where(eq(responsaveis.id, id));
    return await getResponsavelById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar responsável:", error);
    throw error;
  }
}

export async function deleteResponsavel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(responsaveis).where(eq(responsaveis.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir responsável:", error);
    throw error;
  }
}

export async function deleteManyResponsaveis(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(responsaveis).where(inArray(responsaveis.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir responsáveis:", error);
    throw error;
  }
}

// === CERTIFICADOS EMITIDOS ===

export async function getAllCertificadosEmitidos(empresaId: number | null, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(certificadosEmitidos);
    if (empresaId) {
      query = query.where(eq(certificadosEmitidos.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(certificadosEmitidos.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar certificados emitidos:", error);
    throw error;
  }
}

export async function getCertificadoEmitidoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(certificadosEmitidos).where(eq(certificadosEmitidos.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar certificado emitido:", error);
    throw error;
  }
}

export async function createCertificadoEmitido(data: InsertCertificadoEmitido) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(certificadosEmitidos).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getCertificadoEmitidoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar certificado emitido:", error);
    throw error;
  }
}

export async function deleteCertificadoEmitido(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(certificadosEmitidos).where(eq(certificadosEmitidos.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir certificado emitido:", error);
    throw error;
  }
}

export async function deleteManyCertificadosEmitidos(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(certificadosEmitidos).where(inArray(certificadosEmitidos.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir certificados emitidos:", error);
    throw error;
  }
}

// === TIPOS EPIs ===

export async function getAllTiposEpis(searchTerm?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(tiposEpis);
    if (searchTerm) {
      query = query.where(sql`${tiposEpis.tipoEpi} LIKE ${`%${searchTerm}%`}` as any) as any;
    }
    return await query.orderBy(desc(tiposEpis.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar tipos de EPIs:", error);
    throw error;
  }
}

export async function getTipoEpiById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(tiposEpis).where(eq(tiposEpis.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar tipo de EPI:", error);
    throw error;
  }
}

export async function createTipoEpi(data: InsertTipoEpi) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(tiposEpis).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getTipoEpiById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar tipo de EPI:", error);
    throw error;
  }
}

export async function updateTipoEpi(id: number, data: Partial<InsertTipoEpi>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(tiposEpis).set({ ...data, updatedAt: new Date() }).where(eq(tiposEpis.id, id));
    return await getTipoEpiById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar tipo de EPI:", error);
    throw error;
  }
}

export async function deleteTipoEpi(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(tiposEpis).where(eq(tiposEpis.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir tipo de EPI:", error);
    throw error;
  }
}

export async function deleteManyTiposEpis(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(tiposEpis).where(inArray(tiposEpis.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir tipos de EPIs:", error);
    throw error;
  }
}

// === ORDENS DE SERVIÇO ===

export async function getAllOrdensServico(empresaId: number | null, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select({
      id: ordensServico.id,
      numeroOrdem: ordensServico.numeroOrdem,
      empresaId: ordensServico.empresaId,
      colaboradorId: ordensServico.colaboradorId,
      responsavelId: ordensServico.responsavelId,
      modeloId: ordensServico.modeloId,
      dataEmissao: ordensServico.dataEmissao,
      descricaoServico: ordensServico.descricaoServico,
      prioridade: ordensServico.prioridade,
      status: ordensServico.status,
      createdAt: ordensServico.createdAt,
      updatedAt: ordensServico.updatedAt,
    }).from(ordensServico);
    
    if (empresaId) {
      query = query.where(eq(ordensServico.empresaId, empresaId)) as any;
    }
    
    return await query.orderBy(desc(ordensServico.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar ordens de serviço:", error);
    throw error;
  }
}

export async function getOrdemServicoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(ordensServico).where(eq(ordensServico.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar ordem de serviço:", error);
    throw error;
  }
}

export async function getNextNumeroOrdem() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select({ max: sql<number>`MAX(CAST(${ordensServico.numeroOrdem} AS UNSIGNED))` }).from(ordensServico);
    const maxNum = result[0]?.max || 0;
    return String(maxNum + 1).padStart(6, '0');
  } catch (error) {
    console.error("[Database] Erro ao buscar próximo número de ordem:", error);
    return "000001";
  }
}

export async function createOrdemServico(data: InsertOrdemServico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(ordensServico).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getOrdemServicoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar ordem de serviço:", error);
    throw error;
  }
}

export async function updateOrdemServico(id: number, data: Partial<InsertOrdemServico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(ordensServico).set({ ...data, updatedAt: new Date() }).where(eq(ordensServico.id, id));
    return await getOrdemServicoById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar ordem de serviço:", error);
    throw error;
  }
}

export async function deleteOrdemServico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(ordensServico).where(eq(ordensServico.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir ordem de serviço:", error);
    throw error;
  }
}

export async function deleteManyOrdensServico(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(ordensServico).where(inArray(ordensServico.id, ids));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir ordens de serviço:", error);
    throw error;
  }
}

// === MODELOS ORDEM SERVIÇO ===

export async function getAllModelosOrdemServico(empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(modelosOrdemServico);
    if (empresaId) {
      query = query.where(eq(modelosOrdemServico.empresaId, empresaId)) as any;
    }
    return await query.orderBy(desc(modelosOrdemServico.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar modelos de ordem de serviço:", error);
    throw error;
  }
}

export async function getModeloOrdemServicoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(modelosOrdemServico).where(eq(modelosOrdemServico.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar modelo de ordem de serviço:", error);
    throw error;
  }
}

export async function createModeloOrdemServico(data: InsertModeloOrdemServico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(modelosOrdemServico).values(data);
    const insertId = (result as any)[0]?.insertId;
    if (insertId) return await getModeloOrdemServicoById(insertId);
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar modelo de ordem de serviço:", error);
    throw error;
  }
}

export async function updateModeloOrdemServico(id: number, data: Partial<InsertModeloOrdemServico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(modelosOrdemServico).set({ ...data, updatedAt: new Date() }).where(eq(modelosOrdemServico.id, id));
    return await getModeloOrdemServicoById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar modelo de ordem de serviço:", error);
    throw error;
  }
}

export async function deleteModeloOrdemServico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(modelosOrdemServico).where(eq(modelosOrdemServico.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir modelo de ordem de serviço:", error);
    throw error;
  }
}

// === PERMISSÕES USUÁRIOS ===

export async function getAllPermissoesUsuarios() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db.select({
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
    }).from(permissoesUsuarios).leftJoin(users, eq(permissoesUsuarios.usuarioId, users.id));
  } catch (error) {
    console.error("[Database] Erro ao buscar permissões de usuários:", error);
    throw error;
  }
}

export async function getPermissoesUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.select().from(permissoesUsuarios).where(eq(permissoesUsuarios.usuarioId, usuarioId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar permissões do usuário:", error);
    throw error;
  }
}

export async function upsertPermissoesUsuario(usuarioId: number, permissoesData: Omit<InsertPermissoesUsuario, "usuarioId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const existente = await getPermissoesUsuario(usuarioId);
    if (existente) {
      await db.update(permissoesUsuarios).set({
        ...permissoesData,
        updatedAt: new Date(),
      }).where(eq(permissoesUsuarios.usuarioId, usuarioId));
      return await getPermissoesUsuario(usuarioId);
    } else {
      const result = await db.insert(permissoesUsuarios).values({
        usuarioId,
        ...permissoesData,
      });
      const insertId = (result as any)[0]?.insertId;
      if (insertId) {
        return await db.select().from(permissoesUsuarios).where(eq(permissoesUsuarios.id, insertId)).limit(1);
      }
      return null;
    }
  } catch (error) {
    console.error("[Database] Erro ao salvar permissões do usuário:", error);
    throw error;
  }
}

// === ASOS ===

export async function createAso(data: InsertAso) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataValidade = new Date(data.dataValidade);
    dataValidade.setHours(0, 0, 0, 0);

    const asoData = {
      ...data,
      status: dataValidade < hoje ? ("vencido" as const) : ("ativo" as const),
    };

    const result: any = await db.insert(asos).values(asoData);
    const insertId = result?.insertId ?? (Array.isArray(result) ? result[0]?.insertId : undefined);
    if (insertId) {
      await refreshColaboradorAsoSnapshot(data.tenantId, data.colaboradorId);
      return await getAsoById(insertId);
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar ASO:", error);
    throw error;
  }
}

export async function getAsoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.select().from(asos).where(eq(asos.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar ASO:", error);
    throw error;
  }
}

export async function getAsoByColaborador(
  tenantId: number,
  colaboradorId: number,
  tipoAso?: "admissional" | "periodico" | "retorno_trabalho" | "mudanca_funcao" | "demissional"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    let whereClause: any = and(eq(asos.tenantId, tenantId), eq(asos.colaboradorId, colaboradorId));
    if (tipoAso) {
      whereClause = and(whereClause, eq(asos.tipoAso, tipoAso));
    }

    const result = await db
      .select()
      .from(asos)
      .where(whereClause)
      .orderBy(desc(asos.dataEmissao))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar ASO por colaborador:", error);
    throw error;
  }
}

export async function getAllAsos(filters?: {
  tenantId?: number;
  colaboradorId?: number;
  empresaId?: number;
  tipoAso?: string;
  status?: string;
  vencidos?: boolean;
  aVencerEmDias?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    let query = db.select().from(asos);
    const conditions: any[] = [];

    if (filters?.tenantId) {
      conditions.push(eq(asos.tenantId, filters.tenantId));
    }

    if (filters?.colaboradorId) {
      conditions.push(eq(asos.colaboradorId, filters.colaboradorId));
    }

    if (filters?.empresaId) {
      conditions.push(eq(asos.empresaId, filters.empresaId));
    }

    if (filters?.tipoAso) {
      conditions.push(eq(asos.tipoAso, filters.tipoAso as any));
    }

    if (filters?.status) {
      conditions.push(eq(asos.status, filters.status as any));
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (filters?.vencidos) {
      conditions.push(lte(asos.dataValidade, hoje));
    }

    if (filters?.aVencerEmDias) {
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + filters.aVencerEmDias);
      conditions.push(gte(asos.dataValidade, hoje));
      conditions.push(lte(asos.dataValidade, dataLimite));
    }

    if (conditions.length > 0) {
      const whereClause = conditions.reduce((acc: any, condition: any) => (acc ? and(acc, condition) : condition));
      query = query.where(whereClause);
    }

    return await query.orderBy(desc(asos.updatedAt), desc(asos.dataValidade));
  } catch (error) {
    console.error("[Database] Erro ao listar ASOs:", error);
    throw error;
  }
}

export async function updateAso(id: number, data: Partial<InsertAso>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = { ...data };
    if (data.dataValidade) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataValidade = new Date(data.dataValidade);
      dataValidade.setHours(0, 0, 0, 0);
      updateData.status = dataValidade < hoje ? ("vencido" as const) : ("ativo" as const);
    }

    await db.update(asos).set(updateData).where(eq(asos.id, id));
    const aso = await getAsoById(id);
    if (aso) {
      await refreshColaboradorAsoSnapshot(aso.tenantId, aso.colaboradorId);
    }
    return aso;
  } catch (error) {
    console.error("[Database] Erro ao atualizar ASO:", error);
    throw error;
  }
}

export async function deleteAso(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const aso = await getAsoById(id);
    await db.delete(asos).where(eq(asos.id, id));
    if (aso) {
      await refreshColaboradorAsoSnapshot(aso.tenantId, aso.colaboradorId);
    }
    return true;
  } catch (error) {
    console.error("[Database] Erro ao deletar ASO:", error);
    throw error;
  }
}

export async function atualizarStatusAsosVencidos(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    await db
      .update(asos)
      .set({ status: "vencido", updatedAt: new Date() })
      .where(and(eq(asos.tenantId, tenantId), lte(asos.dataValidade, hoje), eq(asos.status, "ativo")));

    return true;
  } catch (error) {
    console.error("[Database] Erro ao atualizar status de ASOs vencidos:", error);
    throw error;
  }
}

export async function upsertAsoForColaborador(options: {
  tenantId: number;
  colaboradorId: number;
  empresaId: number;
  dataEmissao?: Date | null;
  dataValidade?: Date | null;
  tipoAso?: "admissional" | "periodico" | "retorno_trabalho" | "mudanca_funcao" | "demissional";
  apto?: "sim" | "nao" | "apto_com_restricoes";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const {
    tenantId,
    colaboradorId,
    empresaId,
    dataEmissao,
    dataValidade,
    tipoAso = "admissional",
    apto = "sim",
  } = options;

  if (!dataEmissao || !dataValidade) {
    return null;
  }

  try {
    const existente = await getAsoByColaborador(tenantId, colaboradorId, tipoAso);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validadeNormalizada = new Date(dataValidade);
    validadeNormalizada.setHours(0, 0, 0, 0);
    const status = validadeNormalizada < hoje ? ("vencido" as const) : ("ativo" as const);

    if (existente) {
      await db
        .update(asos)
        .set({
          empresaId,
          dataEmissao,
          dataValidade,
          status,
          apto,
          updatedAt: new Date(),
        })
        .where(eq(asos.id, existente.id));
      await refreshColaboradorAsoSnapshot(tenantId, colaboradorId);
      return await getAsoById(existente.id);
    }

    const asoCriado = await createAso({
      tenantId,
      colaboradorId,
      empresaId,
      numeroAso: null,
      tipoAso,
      dataEmissao,
      dataValidade,
      medicoResponsavel: null,
      clinicaMedica: null,
      crmMedico: null,
      apto,
      restricoes: null,
      observacoes: "ASO gerado automaticamente a partir do cadastro do colaborador.",
      anexoUrl: null,
      status,
    });

    await refreshColaboradorAsoSnapshot(tenantId, colaboradorId);
    return asoCriado;
  } catch (error) {
    console.error("[Database] Erro ao sincronizar ASO do colaborador:", error);
    throw error;
  }
}

export async function getAsoDashboard(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const registros = await db.select().from(asos).where(eq(asos.tenantId, tenantId));
    const colaboradoresRows = await db
      .select({ id: colaboradores.id })
      .from(colaboradores)
      .where(eq(colaboradores.tenantId, tenantId));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dayMs = 1000 * 60 * 60 * 24;
    type RegistroAso = typeof registros[number];

    const total = registros.length;
    const totalAtivos = registros.filter((item: RegistroAso) => item.status === "ativo").length;
    const totalVencidos = registros.filter((item: RegistroAso) => item.status === "vencido").length;

    const setCobertos = new Set<number>();
    registros.forEach((item: RegistroAso) => {
      if (item.dataValidade) {
        const validade = new Date(item.dataValidade);
        validade.setHours(0, 0, 0, 0);
        if (validade >= hoje) {
          setCobertos.add(item.colaboradorId);
        }
      }
    });

    const totalColaboradores = colaboradoresRows.length;
    const colaboradoresCobertos = setCobertos.size;
    const colaboradoresSemAso = Math.max(totalColaboradores - colaboradoresCobertos, 0);
    const coberturaPercentual = totalColaboradores
      ? Number(((colaboradoresCobertos / totalColaboradores) * 100).toFixed(1))
      : 0;

    const porTipoMap = new Map<string, number>();
    registros.forEach((item: RegistroAso) => {
      const chave = item.tipoAso || "outros";
      porTipoMap.set(chave, (porTipoMap.get(chave) || 0) + 1);
    });

    const porTipo = Array.from(porTipoMap.entries()).map(([tipo, total]) => ({ tipo, total }));

    const vencimentosPorMesMap = new Map<string, number>();
    registros.forEach((item: RegistroAso) => {
      if (!item.dataValidade) return;
      const validade = new Date(item.dataValidade);
      validade.setHours(0, 0, 0, 0);
      if (validade < hoje) return;
      const chave = `${validade.getFullYear()}-${String(validade.getMonth() + 1).padStart(2, "0")}`;
      vencimentosPorMesMap.set(chave, (vencimentosPorMesMap.get(chave) || 0) + 1);
    });
    const vencimentosPorMes = Array.from(vencimentosPorMesMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(0, 6)
      .map(([mes, total]) => ({ mes, total }));

    const topEmpresasVencidosMap = new Map<number, number>();
    registros.forEach((item: RegistroAso) => {
      if (!item.dataValidade || !item.empresaId) return;
      const validade = new Date(item.dataValidade);
      validade.setHours(0, 0, 0, 0);
      if (validade >= hoje) return;
      topEmpresasVencidosMap.set(item.empresaId, (topEmpresasVencidosMap.get(item.empresaId) || 0) + 1);
    });
    const topEmpresasVencidos = Array.from(topEmpresasVencidosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([empresaId, total]) => ({
        empresaId,
        empresaNome: null as string | null,
        total,
      }));

    const proximosVencimentos = registros
      .filter((item: RegistroAso) => {
        if (!item.dataValidade) return false;
        const validade = new Date(item.dataValidade);
        validade.setHours(0, 0, 0, 0);
        return validade >= hoje;
      })
      .sort((a: RegistroAso, b: RegistroAso) => {
        const av = new Date(a.dataValidade || 0).getTime();
        const bv = new Date(b.dataValidade || 0).getTime();
        return av - bv;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        numeroAso: item.numeroAso || null,
        dataValidade: item.dataValidade ? new Date(item.dataValidade).toISOString() : null,
        tipoAso: item.tipoAso,
        colaboradorId: item.colaboradorId,
        colaboradorNome: null as string | null,
        empresaId: item.empresaId,
        empresaNome: null as string | null,
      }));

    const asosVencidosRecentes = registros
      .filter((item: RegistroAso) => {
        if (!item.dataValidade) return false;
        const validade = new Date(item.dataValidade);
        validade.setHours(0, 0, 0, 0);
        return validade < hoje;
      })
      .sort((a: RegistroAso, b: RegistroAso) => {
        const av = new Date(a.dataValidade || 0).getTime();
        const bv = new Date(b.dataValidade || 0).getTime();
        return bv - av;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        numeroAso: item.numeroAso || null,
        dataValidade: item.dataValidade ? new Date(item.dataValidade).toISOString() : null,
        tipoAso: item.tipoAso,
        colaboradorId: item.colaboradorId,
        colaboradorNome: null as string | null,
        empresaId: item.empresaId,
        empresaNome: null as string | null,
      }));

    const totalAVencer30 = registros.filter((item: RegistroAso) => {
      if (!item.dataValidade) return false;
      const validade = new Date(item.dataValidade);
      validade.setHours(0, 0, 0, 0);
      const diff = Math.round((validade.getTime() - hoje.getTime()) / dayMs);
      return diff >= 0 && diff <= 30;
    }).length;

    const totalAVencer5 = registros.filter((item: RegistroAso) => {
      if (!item.dataValidade) return false;
      const validade = new Date(item.dataValidade);
      validade.setHours(0, 0, 0, 0);
      const diff = Math.round((validade.getTime() - hoje.getTime()) / dayMs);
      return diff >= 0 && diff <= 5;
    }).length;

    return {
      totalAsos: total,
      totalAtivos,
      totalVencidos,
      totalAVencer30,
      totalAVencer5,
      cobertura: {
        totalColaboradores,
        colaboradoresCobertos,
        colaboradoresSemAso,
        percentual: coberturaPercentual,
      },
      porTipo,
      vencimentosPorMes,
      topEmpresasVencidos,
      proximosVencimentos,
      asosVencidosRecentes,
      ultimaAtualizacao: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Database] Erro ao carregar dashboard de ASOs:", error);
    throw error;
  }
}

export async function refreshColaboradorAsoSnapshot(tenantId: number, colaboradorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [stats] = await db
      .select({
        primeiroAso: sql<Date | null>`MIN(${asos.dataEmissao})` as any,
        validadeMaisRecente: sql<Date | null>`MAX(${asos.dataValidade})` as any,
      })
      .from(asos)
      .where(and(eq(asos.tenantId, tenantId), eq(asos.colaboradorId, colaboradorId)));

    await db
      .update(colaboradores)
      .set({
        dataPrimeiroAso: stats?.primeiroAso ?? null,
        validadeAso: stats?.validadeMaisRecente ?? null,
        updatedAt: new Date(),
      })
      .where(eq(colaboradores.id, colaboradorId));
  } catch (error) {
    console.error("[Database] Erro ao atualizar snapshot de ASO do colaborador:", error);
  }
}

