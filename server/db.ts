import { eq, and, gte, lte, desc, sql, asc, or, inArray, like } from "drizzle-orm";
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
  asos, InsertAso,
  cargosCbo, InsertCargoCbo,
  tenants, InsertTenant
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

export async function getAllEmpresas(filters?: { searchTerm?: string; dataInicio?: string; dataFim?: string }, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Usar SQL direto para garantir que bairroEndereco seja retornado
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    let sqlQuery = "SELECT * FROM empresas";
    const params: any[] = [];
    const whereConditions: string[] = [];
    
    // ISOLAMENTO DE TENANT: Filtrar por tenantId se fornecido
    if (tenantId !== null && tenantId !== undefined) {
      whereConditions.push("tenantId = ?");
      params.push(tenantId);
    }
    
    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.trim();
      whereConditions.push("(LOWER(razaoSocial) LIKE ? OR LOWER(cnpj) LIKE ?)");
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      params.push(searchPattern, searchPattern);
    }
    
    if (whereConditions.length > 0) {
      sqlQuery += " WHERE " + whereConditions.join(" AND ");
    }
    
    sqlQuery += " ORDER BY razaoSocial ASC";
    
    const [rows] = await connection.execute(sqlQuery, params);
    await connection.end();
    
    return rows as any[];
  } catch (error) {
    console.error("[Database] Erro ao buscar empresas:", error);
    throw error;
  }
}

export async function getEmpresaById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Usar SQL direto para garantir que todos os campos sejam retornados
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // ISOLAMENTO DE TENANT: Filtrar por tenantId se fornecido
    let sqlQuery = "SELECT * FROM empresas WHERE id = ?";
    const params: any[] = [id];
    
    if (tenantId !== null && tenantId !== undefined) {
      sqlQuery += " AND tenantId = ?";
      params.push(tenantId);
    }
    
    const [rows] = await connection.execute(sqlQuery, params);
    await connection.end();
    
    const result = (rows as any[])[0] || null;
    console.log("📥 Empresa retornada. Bairro:", result?.bairroEndereco);
    return result;
  } catch (error) {
    console.error("[Database] Erro ao buscar empresa:", error);
    throw error;
  }
}

// Lista de bairros fictícios para preenchimento automático
const bairrosFicticios = [
  "Centro",
  "Jardim das Flores",
  "Vila Nova",
  "Bela Vista",
  "Parque Industrial",
  "Jardim América",
  "Vila Esperança",
  "Centro Comercial",
  "Jardim Primavera",
  "Vila São Paulo",
  "Parque das Árvores",
  "Jardim dos Estados",
  "Vila Progresso",
  "Centro Empresarial",
  "Jardim Europa",
  "Vila Mariana",
  "Parque Residencial",
  "Jardim Paulista",
  "Vila Madalena",
  "Centro Histórico",
  "Jardim Botânico",
  "Vila Olímpia",
  "Parque Verde",
  "Jardim das Acácias",
  "Vila Formosa",
  "Centro Cívico",
  "Jardim das Rosas",
  "Vila Nova Conceição",
  "Parque dos Pássaros",
  "Jardim das Palmeiras",
];

export async function createEmpresa(data: InsertEmpresa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log("[createEmpresa] 🏢 Criando empresa com tenantId:", data.tenantId);
    
    // Preencher bairro fictício se não fornecido
    const dataComBairro = {
      ...data,
      bairroEndereco: data.bairroEndereco || bairrosFicticios[Math.floor(Math.random() * bairrosFicticios.length)],
    };

    // Garantir que tenantId está presente
    if (!dataComBairro.tenantId) {
      throw new Error("tenantId é obrigatório para criar empresa");
    }

    const result = await db.insert(empresas).values(dataComBairro);
    const insertId = (result as any)[0]?.insertId || (result as any).insertId;
    
    console.log("[createEmpresa] ✅ Empresa criada com ID:", insertId);
    
    if (insertId) {
      // IMPORTANTE: Passar tenantId ao buscar a empresa criada para garantir isolamento
      const empresaCriada = await getEmpresaById(insertId, dataComBairro.tenantId);
      
      if (!empresaCriada) {
        throw new Error("Empresa criada mas não foi possível recuperá-la");
      }
      
      console.log("[createEmpresa] ✅ Empresa recuperada:", empresaCriada.razaoSocial);
      return empresaCriada;
    }
    
    throw new Error("Não foi possível obter o ID da empresa criada");
  } catch (error: any) {
    console.error("[Database] Erro ao criar empresa:", error);
    console.error("[Database] Stack:", error?.stack);
    throw error;
  }
}

export async function updateEmpresa(id: number, data: Partial<InsertEmpresa>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Usar SQL direto para garantir que o bairro seja salvo
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Preparar dados para update
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.razaoSocial !== undefined) {
      updates.push("razaoSocial = ?");
      values.push(data.razaoSocial);
    }
    if (data.cnpj !== undefined) {
      updates.push("cnpj = ?");
      values.push(data.cnpj);
    }
    if (data.grauRisco !== undefined) {
      updates.push("grauRisco = ?");
      values.push(data.grauRisco);
    }
    if (data.cnae !== undefined) {
      updates.push("cnae = ?");
      values.push(data.cnae);
    }
    if (data.descricaoAtividade !== undefined) {
      updates.push("descricaoAtividade = ?");
      values.push(data.descricaoAtividade);
    }
    if (data.responsavelTecnico !== undefined) {
      updates.push("responsavelTecnico = ?");
      values.push(data.responsavelTecnico);
    }
    if (data.emailContato !== undefined) {
      updates.push("emailContato = ?");
      values.push(data.emailContato);
    }
    if (data.tipoLogradouro !== undefined) {
      updates.push("tipoLogradouro = ?");
      values.push(data.tipoLogradouro);
    }
    if (data.nomeLogradouro !== undefined) {
      updates.push("nomeLogradouro = ?");
      values.push(data.nomeLogradouro);
    }
    if (data.numeroEndereco !== undefined) {
      updates.push("numeroEndereco = ?");
      values.push(data.numeroEndereco);
    }
    if (data.complementoEndereco !== undefined) {
      updates.push("complementoEndereco = ?");
      values.push(data.complementoEndereco);
    }
    // GARANTIR que bairroEndereco seja sempre atualizado se fornecido
    if ('bairroEndereco' in data) {
      updates.push("bairroEndereco = ?");
      values.push(data.bairroEndereco || null);
    }
    if (data.cidadeEndereco !== undefined) {
      updates.push("cidadeEndereco = ?");
      values.push(data.cidadeEndereco);
    }
    if (data.estadoEndereco !== undefined) {
      updates.push("estadoEndereco = ?");
      values.push(data.estadoEndereco);
    }
    if (data.cep !== undefined) {
      updates.push("cep = ?");
      values.push(data.cep);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }
    
    updates.push("updatedAt = NOW()");
    values.push(id);
    
    const sql = `UPDATE empresas SET ${updates.join(", ")} WHERE id = ?`;
    console.log("💾 SQL:", sql);
    console.log("💾 Valores:", values);
    console.log("💾 Bairro sendo salvo:", data.bairroEndereco);
    
    await connection.execute(sql, values);
    await connection.end();
    
    return await getEmpresaById(id);
  } catch (error) {
    console.error("[Database] Erro ao atualizar empresa:", error);
    throw error;
  }
}

export async function deleteEmpresa(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ISOLAMENTO DE TENANT: Verificar se a empresa pertence ao tenant antes de deletar
    if (tenantId !== undefined && tenantId !== null) {
      const existing = await getEmpresaById(id, tenantId);
      if (!existing) {
        throw new Error("Empresa não encontrada ou não pertence ao seu sistema");
      }
    }
    
    const conditions: any[] = [eq(empresas.id, id)];
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(empresas.tenantId, tenantId));
    }
    
    await db.delete(empresas).where(and(...conditions));
    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao excluir empresa:", error);
    throw error;
  }
}

// === COLABORADORES ===

export async function getAllColaboradores(
  tenantId: number | null,
  empresaId: number | null, 
  filters?: { 
    searchTerm?: string;
    dataAdmissaoInicio?: string;
    dataAdmissaoFim?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    // Construir WHERE clause
    let whereConditions: string[] = [];
    let params: any[] = [];
    
    // FILTRO POR TENANT (obrigatório para clientes)
    // Se tenantId for null, admin pode ver todos (não adiciona filtro)
    // Se tenantId for um número, filtra apenas esse tenant
    if (tenantId !== null && tenantId !== undefined) {
      whereConditions.push("c.tenantId = ?");
      params.push(tenantId);
    } else if (tenantId === null) {
      // Admin sem tenantId específico - não filtra (pode ver todos)
      console.log("[getAllColaboradores] ⚠️ tenantId é null - retornando todos os colaboradores (admin)");
    }
    
    if (empresaId) {
      whereConditions.push("c.empresaId = ?");
      params.push(empresaId);
    }
    
    if (filters?.searchTerm) {
      whereConditions.push("(c.nomeCompleto LIKE ? OR c.cpf LIKE ? OR c.rg LIKE ?)");
      const searchPattern = `%${filters.searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters?.dataAdmissaoInicio) {
      whereConditions.push("c.dataAdmissao >= ?");
      params.push(filters.dataAdmissaoInicio);
    }

    if (filters?.dataAdmissaoFim) {
      whereConditions.push("c.dataAdmissao <= ?");
      params.push(filters.dataAdmissaoFim);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}` 
      : "";

    // Query com JOIN para buscar nomes de cargos e setores
    const sqlQuery = `
      SELECT 
        c.*,
        car.nomeCargo,
        s.nomeSetor
      FROM colaboradores c
      LEFT JOIN cargos car ON c.cargoId = car.id
      LEFT JOIN setores s ON c.setorId = s.id
      ${whereClause}
      ORDER BY c.nomeCompleto ASC
    `;

    const [rows] = await connection.execute(sqlQuery, params);
    await connection.end();

    return rows as any[];
  } catch (error) {
    console.error("[Database] Erro ao buscar colaboradores:", error);
    throw error;
  }
}

export async function getColaboradorById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const conditions: any[] = [eq(colaboradores.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o colaborador pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(colaboradores.tenantId, tenantId));
    }
    
    const result = await db.select().from(colaboradores).where(and(...conditions)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar colaborador:", error);
    throw error;
  }
}

export async function getColaboradorComCargoESetor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar colaborador
    const colaborador = await getColaboradorById(id);
    if (!colaborador || !colaborador.cargoId) {
      return {
        colaborador,
        cargo: null,
        setor: null,
      };
    }

    // Buscar cargo
    const cargo = await getCargoById(colaborador.cargoId);
    
    // Buscar setor vinculado ao cargo (pegar o primeiro setor vinculado)
    let setor = null;
    if (cargo) {
      const setoresDoCargo = await getSetoresByCargo(cargo.id);
      if (setoresDoCargo.length > 0) {
        const setorId = setoresDoCargo[0].setorId;
        const setoresList = await db.select().from(setores).where(eq(setores.id, setorId)).limit(1);
        setor = setoresList[0] || null;
      }
    }

    return {
      colaborador,
      cargo,
      setor,
    };
  } catch (error) {
    console.error("[Database] Erro ao buscar colaborador com cargo e setor:", error);
    throw error;
  }
}

export async function createColaborador(data: InsertColaborador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log("[createColaborador] 🧑 Criando colaborador com tenantId:", data.tenantId);
    
    // Garantir que tenantId está presente (exceto para admin)
    if (!data.tenantId) {
      throw new Error("tenantId é obrigatório para criar colaborador");
    }
    
    const result = await db.insert(colaboradores).values(data);
    const insertId = (result as any)[0]?.insertId || (result as any).insertId;
    
    console.log("[createColaborador] ✅ Colaborador criado com ID:", insertId);
    
    if (insertId) {
      // IMPORTANTE: Passar tenantId ao buscar o colaborador criado para garantir isolamento
      const colaborador = await getColaboradorById(insertId, data.tenantId);
      
      // Se o colaborador tem dataPrimeiroAso e validadeAso, criar ASO automaticamente
      if (colaborador && colaborador.dataPrimeiroAso && colaborador.validadeAso) {
        try {
          // Verificar se já existe ASO para este colaborador
          const asosExistentes = await db
            .select()
            .from(asos)
            .where(eq(asos.colaboradorId, colaborador.id));

          // Se não existe, criar
          if (asosExistentes.length === 0) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataValidade = new Date(colaborador.validadeAso);
            dataValidade.setHours(0, 0, 0, 0);

            const asoData: InsertAso = {
              tenantId: colaborador.tenantId,
              colaboradorId: colaborador.id,
              empresaId: colaborador.empresaId,
              numeroAso: null,
              tipoAso: "admissional",
              dataEmissao: colaborador.dataPrimeiroAso,
              dataValidade: colaborador.validadeAso,
              medicoResponsavel: null,
              clinicaMedica: null,
              crmMedico: null,
              apto: "sim",
              restricoes: null,
              observacoes: "ASO criado automaticamente ao cadastrar colaborador",
              anexoUrl: null,
              status: dataValidade < hoje ? "vencido" : "ativo",
            };

            await db.insert(asos).values(asoData);
            console.log(`[Database] ASO criado automaticamente para colaborador ${colaborador.id}`);
          }
        } catch (asoError) {
          console.error("[Database] Erro ao criar ASO automaticamente:", asoError);
          // Não falhar a criação do colaborador se o ASO falhar
        }
      }
      
      return colaborador;
    }
    return null;
  } catch (error) {
    console.error("[Database] Erro ao criar colaborador:", error);
    throw error;
  }
}

export async function updateColaborador(id: number, data: Partial<InsertColaborador>, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ISOLAMENTO DE TENANT: Verificar se o colaborador pertence ao tenant antes de atualizar
    if (tenantId !== undefined && tenantId !== null) {
      const existing = await getColaboradorById(id, tenantId);
      if (!existing) {
        throw new Error("Colaborador não encontrado ou não pertence ao seu sistema");
      }
    }
    
    const conditions: any[] = [eq(colaboradores.id, id)];
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(colaboradores.tenantId, tenantId));
    }
    
    await db.update(colaboradores).set({ ...data, updatedAt: new Date() }).where(and(...conditions));
    const colaborador = await getColaboradorById(id, tenantId);
    
    // Se o colaborador tem dataPrimeiroAso e validadeAso, criar/atualizar ASO automaticamente
    if (colaborador && colaborador.dataPrimeiroAso && colaborador.validadeAso) {
      try {
        // Verificar se já existe ASO para este colaborador
        const asosExistentes = await db
          .select()
          .from(asos)
          .where(eq(asos.colaboradorId, colaborador.id));

        // Se não existe, criar
        if (asosExistentes.length === 0) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const dataValidade = new Date(colaborador.validadeAso);
          dataValidade.setHours(0, 0, 0, 0);

          const asoData: InsertAso = {
            tenantId: colaborador.tenantId,
            colaboradorId: colaborador.id,
            empresaId: colaborador.empresaId,
            numeroAso: null,
            tipoAso: "admissional",
            dataEmissao: colaborador.dataPrimeiroAso,
            dataValidade: colaborador.validadeAso,
            medicoResponsavel: null,
            clinicaMedica: null,
            crmMedico: null,
            apto: "sim",
            restricoes: null,
            observacoes: "ASO criado automaticamente ao atualizar colaborador",
            anexoUrl: null,
            status: dataValidade < hoje ? "vencido" : "ativo",
          };

          await db.insert(asos).values(asoData);
          console.log(`[Database] ASO criado automaticamente para colaborador ${colaborador.id}`);
        } else {
          // Se já existe, atualizar o status baseado na validade
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const dataValidade = new Date(colaborador.validadeAso);
          dataValidade.setHours(0, 0, 0, 0);
          
          const novoStatus = dataValidade < hoje ? "vencido" : "ativo";
          
          // Atualizar todos os ASOs do colaborador
          await db
            .update(asos)
            .set({ status: novoStatus as any, updatedAt: new Date() })
            .where(eq(asos.colaboradorId, colaborador.id));
        }
      } catch (asoError) {
        console.error("[Database] Erro ao criar/atualizar ASO automaticamente:", asoError);
        // Não falhar a atualização do colaborador se o ASO falhar
      }
    }
    
    return colaborador;
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

export async function getColaboradorStats(
  tenantId: number | null,
  empresaId: number | null | undefined,
  filters?: {
    status?: 'ativo' | 'inativo';
    setorId?: number;
    cargoId?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Log detalhado para debug
    console.log("═══════════════════════════════════════");
    console.log("[getColaboradorStats] 🗄️ INICIANDO QUERY NO BANCO");
    console.log("[getColaboradorStats] tenantId recebido:", tenantId);
    console.log("[getColaboradorStats] empresaId recebido:", empresaId, "Tipo:", typeof empresaId);
    console.log("[getColaboradorStats] filters recebido:", JSON.stringify(filters, null, 2));
    
    // Usar SQL direto para garantir que o filtro funcione
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada");
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Construir WHERE clause - ISOLAMENTO DE TENANT OBRIGATÓRIO
    let whereConditions: string[] = [];
    let params: any[] = [];
    
    // SEMPRE filtrar por tenantId (exceto se for null para admin)
    if (tenantId !== null && tenantId !== undefined) {
      whereConditions.push("tenantId = ?");
      params.push(tenantId);
      console.log("[getColaboradorStats] 🔒 Filtro tenantId ADICIONADO:", tenantId);
    }
    
    if (empresaId !== null && empresaId !== undefined && typeof empresaId === 'number' && empresaId > 0) {
      whereConditions.push("empresaId = ?");
      params.push(empresaId);
      console.log("[getColaboradorStats] ✅✅✅ Filtro empresaId ADICIONADO:", empresaId);
    } else {
      console.log("[getColaboradorStats] ⚠️⚠️⚠️ SEM filtro empresaId");
    }
    
    if (filters?.status) {
      whereConditions.push("status = ?");
      params.push(filters.status);
    }
    
    if (filters?.setorId) {
      whereConditions.push("setorId = ?");
      params.push(filters.setorId);
    }
    
    if (filters?.cargoId) {
      whereConditions.push("cargoId = ?");
      params.push(filters.cargoId);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    
    console.log("[getColaboradorStats] 📋 WHERE clause SQL:", whereClause);
    console.log("[getColaboradorStats] 📋 Parâmetros:", params);
    
    // Estatísticas básicas usando SQL direto
    // Total: COUNT(*) WHERE empresaId = ?
    // Ativos: SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) WHERE empresaId = ?
    // Inativos: SUM(CASE WHEN status = 'inativo' THEN 1 ELSE 0 END) WHERE empresaId = ?
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'inativo' THEN 1 ELSE 0 END) as inativos
      FROM colaboradores
      ${whereClause}
    `;
    
    console.log("[getColaboradorStats] 🔍 SQL Executado:", statsQuery.trim());
    console.log("[getColaboradorStats] 🔍 Parâmetros:", params);
    console.log("[getColaboradorStats] 🔍 empresaId sendo filtrado:", empresaId);
    console.log("[getColaboradorStats] 🔍 WHERE clause aplicado:", whereClause || "NENHUM (retornando todos)");
    
    const [statsRows] = await connection.execute(statsQuery, params);
    const baseStats = (statsRows as any[])[0] || {};
    
    // Converter BigInt para Number
    const total = Number(baseStats?.total || 0);
    const ativos = Number(baseStats?.ativos || 0);
    const inativos = Number(baseStats?.inativos || 0);
    
    // Taxa de atividade = (ativos / total) * 100
    const taxaAtividade = total > 0 ? Math.round((ativos / total) * 100) : 0;
    
    console.log("[getColaboradorStats] 📊 Resultado baseStats:", {
      total,
      ativos,
      inativos,
      taxaAtividade,
      empresaIdFiltrado: empresaId,
      whereClauseAplicado: whereClause
    });
    
    // Estatísticas por sexo usando SQL direto
    const sexoQuery = `
      SELECT sexo, COUNT(*) as count
      FROM colaboradores
      ${whereClause}
      GROUP BY sexo
    `;
    const [sexoRows] = await connection.execute(sexoQuery, params);
    const sexoStats = (sexoRows as any[]) || [];
    
    // Construir WHERE clause com alias c. para queries com JOIN
    const whereConditionsWithAlias = whereConditions.map(cond => {
      // Adicionar prefixo c. aos nomes de campos
      return cond.replace(/^(\w+)\s*=\s*\?$/, "c.$1 = ?");
    });
    const whereClauseWithAlias = whereConditionsWithAlias.length > 0 
      ? `WHERE ${whereConditionsWithAlias.join(" AND ")}` 
      : "";
    
    // Estatísticas por setor usando SQL direto
    // IMPORTANTE: Filtrar tenantId também na tabela setores
    let setorWhereConditions = [...whereConditions];
    let setorParams = [...params];
    
    // Adicionar filtro de tenantId na tabela setores também
    if (tenantId !== null && tenantId !== undefined) {
      setorWhereConditions.push("s.tenantId = ?");
      setorParams.push(tenantId);
    }
    
    const setorWhereClause = setorWhereConditions.length > 0 
      ? `WHERE ${setorWhereConditions.map(cond => cond.replace(/^(\w+)\s*=\s*\?$/, "c.$1 = ?").replace(/^s\.tenantId/, "s.tenantId")).join(" AND ")}` 
      : "";
    
    const setorQuery = `
      SELECT s.nomeSetor as setor, COUNT(*) as count
      FROM colaboradores c
      LEFT JOIN setores s ON c.setorId = s.id AND s.tenantId = ?
      ${setorWhereClause}
      GROUP BY s.nomeSetor
    `;
    const [setorRows] = await connection.execute(setorQuery, tenantId !== null && tenantId !== undefined ? [tenantId, ...setorParams] : setorParams);
    const setorStats = (setorRows as any[]) || [];
    
    // Estatísticas por função/cargo usando SQL direto
    // IMPORTANTE: Filtrar tenantId também na tabela cargos
    let funcaoWhereConditions: string[] = [];
    let funcaoParams: any[] = [];
    
    // Adicionar condições de WHERE para colaboradores
    whereConditions.forEach(cond => {
      funcaoWhereConditions.push(cond.replace(/^(\w+)\s*=\s*\?$/, "c.$1 = ?"));
    });
    funcaoParams.push(...params);
    
    // Adicionar filtro de tenantId na tabela cargos também
    if (tenantId !== null && tenantId !== undefined) {
      funcaoWhereConditions.push("(car.tenantId = ? OR car.tenantId IS NULL)");
      funcaoParams.push(tenantId);
    }
    
    const funcaoWhereClause = funcaoWhereConditions.length > 0 
      ? `WHERE ${funcaoWhereConditions.join(" AND ")}` 
      : "";
    
    // Definir condição de JOIN - sempre incluir tenantId no JOIN quando disponível
    const funcaoJoinCondition = tenantId !== null && tenantId !== undefined 
      ? `c.cargoId = car.id AND (car.tenantId = ? OR car.tenantId IS NULL)` 
      : `c.cargoId = car.id`;
    
    // Parâmetros para o JOIN (tenantId vem primeiro se existir)
    const funcaoJoinParams = tenantId !== null && tenantId !== undefined ? [tenantId] : [];
    const funcaoQueryParams = [...funcaoJoinParams, ...funcaoParams];
    
    const funcaoQuery = `
      SELECT COALESCE(car.nomeCargo, 'Sem função') as funcao, COUNT(*) as count
      FROM colaboradores c
      LEFT JOIN cargos car ON ${funcaoJoinCondition}
      ${funcaoWhereClause}
      GROUP BY car.nomeCargo
      HAVING COUNT(*) > 0
      ORDER BY count DESC
    `;
    
    console.log("[getColaboradorStats] 🔍 FUNÇÃO QUERY:", funcaoQuery);
    console.log("[getColaboradorStats] 🔍 FUNÇÃO PARAMS:", funcaoQueryParams);
    
    const [funcaoRows] = await connection.execute(funcaoQuery, funcaoQueryParams);
    const funcaoStats = (funcaoRows as any[]) || [];
    
    console.log("[getColaboradorStats] 📊 FUNÇÃO STATS:", funcaoStats.length, "resultados");
    
    // Estatísticas por status usando SQL direto
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM colaboradores
      ${whereClause}
      GROUP BY status
    `;
    const [statusRows] = await connection.execute(statusQuery, params);
    const statusStats = (statusRows as any[]) || [];
    
    // Colaboradores mais antigos usando SQL direto (top 5)
    // IMPORTANTE: Filtrar tenantId também na tabela cargos no JOIN
    const maisAntigosWhereConditions: string[] = [];
    const maisAntigosParams: any[] = [];
    
    // Adicionar condições de WHERE para colaboradores
    whereConditions.forEach(cond => {
      maisAntigosWhereConditions.push(cond.replace(/^(\w+)\s*=\s*\?$/, "c.$1 = ?"));
    });
    maisAntigosParams.push(...params);
    
    // Adicionar filtro de tenantId na tabela cargos também
    if (tenantId !== null && tenantId !== undefined) {
      maisAntigosWhereConditions.push("(car.tenantId = ? OR car.tenantId IS NULL)");
      maisAntigosParams.push(tenantId);
    }
    
    const maisAntigosWhereClause = maisAntigosWhereConditions.length > 0 
      ? `WHERE ${maisAntigosWhereConditions.join(" AND ")}` 
      : "";
    
    const maisAntigosJoinParams = tenantId !== null && tenantId !== undefined ? [tenantId] : [];
    const maisAntigosQueryParams = [...maisAntigosJoinParams, ...maisAntigosParams];
    
    const maisAntigosQuery = `
      SELECT c.id, c.nomeCompleto as nome, COALESCE(car.nomeCargo, 'Sem função') as funcao, c.dataAdmissao
      FROM colaboradores c
      LEFT JOIN cargos car ON ${funcaoJoinCondition}
      ${maisAntigosWhereClause}
      ORDER BY c.dataAdmissao ASC
      LIMIT 5
    `;
    
    console.log("[getColaboradorStats] 🔍 MAIS ANTIGOS QUERY:", maisAntigosQuery);
    console.log("[getColaboradorStats] 🔍 MAIS ANTIGOS PARAMS:", maisAntigosQueryParams);
    
    const [maisAntigosRows] = await connection.execute(maisAntigosQuery, maisAntigosQueryParams);
    const maisAntigos = (maisAntigosRows as any[]) || [];
    
    console.log("[getColaboradorStats] 📊 MAIS ANTIGOS:", maisAntigos.length, "resultados");
    
    // Colaboradores mais novos usando SQL direto (top 5)
    // IMPORTANTE: Filtrar tenantId também na tabela cargos no JOIN
    const maisNovosWhereConditions: string[] = [];
    const maisNovosParams: any[] = [];
    
    // Adicionar condições de WHERE para colaboradores
    whereConditions.forEach(cond => {
      maisNovosWhereConditions.push(cond.replace(/^(\w+)\s*=\s*\?$/, "c.$1 = ?"));
    });
    maisNovosParams.push(...params);
    
    // Adicionar filtro de tenantId na tabela cargos também
    if (tenantId !== null && tenantId !== undefined) {
      maisNovosWhereConditions.push("(car.tenantId = ? OR car.tenantId IS NULL)");
      maisNovosParams.push(tenantId);
    }
    
    const maisNovosWhereClause = maisNovosWhereConditions.length > 0 
      ? `WHERE ${maisNovosWhereConditions.join(" AND ")}` 
      : "";
    
    const maisNovosJoinParams = tenantId !== null && tenantId !== undefined ? [tenantId] : [];
    const maisNovosQueryParams = [...maisNovosJoinParams, ...maisNovosParams];
    
    const maisNovosQuery = `
      SELECT c.id, c.nomeCompleto as nome, COALESCE(car.nomeCargo, 'Sem função') as funcao, c.dataAdmissao
      FROM colaboradores c
      LEFT JOIN cargos car ON ${funcaoJoinCondition}
      ${maisNovosWhereClause}
      ORDER BY c.dataAdmissao DESC
      LIMIT 5
    `;
    
    console.log("[getColaboradorStats] 🔍 MAIS NOVOS QUERY:", maisNovosQuery);
    console.log("[getColaboradorStats] 🔍 MAIS NOVOS PARAMS:", maisNovosQueryParams);
    
    const [maisNovosRows] = await connection.execute(maisNovosQuery, maisNovosQueryParams);
    const maisNovos = (maisNovosRows as any[]) || [];
    
    console.log("[getColaboradorStats] 📊 MAIS NOVOS:", maisNovos.length, "resultados");
    
    await connection.end();
    
    // Calcular totais de homens e mulheres
    const totalHomens = sexoStats.find((s: any) => s.sexo === 'masculino')?.count || 0;
    const totalMulheres = sexoStats.find((s: any) => s.sexo === 'feminino')?.count || 0;
    const percentualHomens = total > 0 ? Math.round((Number(totalHomens) / total) * 100) : 0;
    const percentualMulheres = total > 0 ? Math.round((Number(totalMulheres) / total) * 100) : 0;
    
    // Ordenar e limitar top 10
    const topFuncoes = funcaoStats
      .map((f: any) => ({ funcao: f.funcao || "Sem função", count: Number(f.count) }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
    
    const topSetores = setorStats
      .map((s: any) => ({ setor: s.setor || "Sem setor", count: Number(s.count) }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
    
    const resultado = {
      total,
      ativos,
      inativos,
      taxa: taxaAtividade,
      totalHomens: Number(totalHomens),
      totalMulheres: Number(totalMulheres),
      percentualHomens,
      percentualMulheres,
      sexo: sexoStats.map((s: any) => ({ sexo: s.sexo, count: Number(s.count) })),
      setor: topSetores,
      funcoes: topFuncoes,
      status: statusStats.map((s: any) => ({ status: s.status, count: Number(s.count) })),
      maisAntigos: maisAntigos.map((m: any) => ({
        id: m.id,
        nome: m.nome,
        funcao: m.funcao || "Sem função",
        dataAdmissao: m.dataAdmissao,
      })),
      maisNovos: maisNovos.map((m: any) => ({
        id: m.id,
        nome: m.nome,
        funcao: m.funcao || "Sem função",
        dataAdmissao: m.dataAdmissao,
      })),
    };
    
    console.log("[getColaboradorStats] ✅ RESULTADO FINAL RETORNADO:", {
      total: resultado.total,
      ativos: resultado.ativos,
      inativos: resultado.inativos,
      taxa: resultado.taxa,
      empresaIdFiltrado: empresaId,
      filtroAplicado: empresaId !== null && empresaId !== undefined ? `SIM (empresaId=${empresaId})` : "NÃO (todos)"
    });
    console.log("═══════════════════════════════════════");
    
    return resultado;
  } catch (error) {
    console.error("[Database] Erro ao buscar estatísticas de colaboradores:", error);
    throw error;
  }
}

// === OBRAS ===

export async function getAllObras(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(obras.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(obras.empresaId, empresaId));
    }
    
    let query = db.select().from(obras);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(asc(obras.nomeObra));
  } catch (error) {
    console.error("[Database] Erro ao buscar obras:", error);
    throw error;
  }
}

export async function getObraById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const conditions: any[] = [eq(obras.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se a obra pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(obras.tenantId, tenantId));
    }
    
    const result = await db.select().from(obras).where(and(...conditions)).limit(1);
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

export async function updateObra(id: number, data: Partial<InsertObra>, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ISOLAMENTO DE TENANT: Verificar se a obra pertence ao tenant antes de atualizar
    if (tenantId !== undefined && tenantId !== null) {
      const existing = await getObraById(id, tenantId);
      if (!existing) {
        throw new Error("Obra não encontrada ou não pertence ao seu sistema");
      }
    }
    
    const conditions: any[] = [eq(obras.id, id)];
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(obras.tenantId, tenantId));
    }
    
    await db.update(obras).set({ ...data, updatedAt: new Date() }).where(and(...conditions));
    return await getObraById(id, tenantId);
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

export async function getDashboardStats(tenantId: number | null, empresaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // ISOLAMENTO DE TENANT: Filtrar TODAS as queries por tenantId
    const tenantConditions: any[] = [];
    if (tenantId !== null && tenantId !== undefined) {
      tenantConditions.push(eq(empresas.tenantId, tenantId));
    }
    
    // Empresas ativas - SEMPRE filtrar por tenantId
    let empresasQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(empresas)
      .where(and(eq(empresas.status, "ativa"), ...tenantConditions));
    if (empresaId) {
      empresasQuery = empresasQuery.where(and(eq(empresas.status, "ativa"), eq(empresas.id, empresaId), ...tenantConditions) as any) as any;
    }
    const [empresasCount] = await empresasQuery;
    
    // Colaboradores ativos - SEMPRE filtrar por tenantId
    const colaboradorTenantConditions: any[] = [];
    if (tenantId !== null && tenantId !== undefined) {
      colaboradorTenantConditions.push(eq(colaboradores.tenantId, tenantId));
    }
    let colaboradoresQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(colaboradores)
      .where(and(eq(colaboradores.status, "ativo"), ...colaboradorTenantConditions));
    if (empresaId) {
      colaboradoresQuery = colaboradoresQuery.where(and(eq(colaboradores.status, "ativo"), eq(colaboradores.empresaId, empresaId), ...colaboradorTenantConditions) as any) as any;
    }
    const [colaboradoresCount] = await colaboradoresQuery;
    
    // Obras ativas - SEMPRE filtrar por tenantId
    const obraTenantConditions: any[] = [];
    if (tenantId !== null && tenantId !== undefined) {
      obraTenantConditions.push(eq(obras.tenantId, tenantId));
    }
    let obrasQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(obras)
      .where(and(eq(obras.status, "ativa"), ...obraTenantConditions));
    if (empresaId) {
      obrasQuery = obrasQuery.where(and(eq(obras.status, "ativa"), eq(obras.empresaId, empresaId), ...obraTenantConditions) as any) as any;
    }
    const [obrasCount] = await obrasQuery;
    
    // Treinamentos vencidos - SEMPRE filtrar por tenantId
    const treinamentoTenantConditions: any[] = [];
    if (tenantId !== null && tenantId !== undefined) {
      treinamentoTenantConditions.push(eq(treinamentos.tenantId, tenantId));
    }
    let treinamentosQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(treinamentos)
      .where(and(sql`${treinamentos.dataValidade} < CURDATE()`, ...treinamentoTenantConditions));
    if (empresaId) {
      treinamentosQuery = treinamentosQuery.where(and(sql`${treinamentos.dataValidade} < CURDATE()`, eq(treinamentos.empresaId, empresaId), ...treinamentoTenantConditions) as any) as any;
    }
    const [treinamentosVencidos] = await treinamentosQuery;
    
    // EPIs vencidos - SEMPRE filtrar por tenantId
    const epiTenantConditions: any[] = [];
    if (tenantId !== null && tenantId !== undefined) {
      epiTenantConditions.push(eq(epis.tenantId, tenantId));
    }
    let episQuery = db.select({ count: sql<number>`COUNT(*)` })
      .from(epis)
      .where(and(sql`${epis.dataValidade} < CURDATE()`, ...epiTenantConditions));
    if (empresaId) {
      episQuery = episQuery.where(and(sql`${epis.dataValidade} < CURDATE()`, eq(epis.empresaId, empresaId), ...epiTenantConditions) as any) as any;
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

export async function getAllTreinamentos(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(treinamentos.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(treinamentos.empresaId, empresaId));
    }
    
    let query = db.select().from(treinamentos);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(treinamentos.nomeTreinamento));
  } catch (error) {
    console.error("[Database] Erro ao buscar treinamentos:", error);
    throw error;
  }
}

export async function getTreinamentoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(treinamentos.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o treinamento pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(treinamentos.tenantId, tenantId));
    }
    
    const result = await db.select().from(treinamentos).where(and(...conditions)).limit(1);
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

export async function getAllEpis(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(epis.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(epis.empresaId, empresaId));
    }
    
    let query = db.select().from(epis);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(epis.nomeEpi));
  } catch (error) {
    console.error("[Database] Erro ao buscar EPIs:", error);
    throw error;
  }
}

export async function getEpiById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(epis.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o EPI pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(epis.tenantId, tenantId));
    }
    
    const result = await db.select().from(epis).where(and(...conditions)).limit(1);
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

export async function getDadosFichaEPI(empresaId: number, colaboradorId: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    // ISOLAMENTO DE TENANT: Filtrar todos os dados pelo tenant
    const colaboradorConditions: any[] = [eq(colaboradores.id, colaboradorId)];
    const empresaConditions: any[] = [eq(empresas.id, empresaId)];
    const episConditions: any[] = [eq(epis.colaboradorId, colaboradorId)];
    
    if (tenantId !== undefined && tenantId !== null) {
      colaboradorConditions.push(eq(colaboradores.tenantId, tenantId));
      empresaConditions.push(eq(empresas.tenantId, tenantId));
      episConditions.push(eq(epis.tenantId, tenantId));
    }
    
    const [colaborador] = await db.select().from(colaboradores).where(and(...colaboradorConditions)).limit(1);
    const [empresa] = await db.select().from(empresas).where(and(...empresaConditions)).limit(1);
    const episColaborador = await db.select().from(epis).where(and(...episConditions));
    return { colaborador, empresa, epis: episColaborador };
  } catch (error) {
    console.error("[Database] Erro ao buscar dados da ficha EPI:", error);
    throw error;
  }
}

export async function getAllFichasEpiEmitidas(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(fichasEpiEmitidas.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(fichasEpiEmitidas.empresaId, empresaId));
    }
    
    let query = db.select().from(fichasEpiEmitidas);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(fichasEpiEmitidas.nomeArquivo));
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

export async function getAllCargos(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(cargos);
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    // Se tenantId for null, é admin/super_admin e pode ver TODOS os cargos (não filtra)
    if (tenantId !== null && tenantId !== undefined) {
      conditions.push(eq(cargos.tenantId, tenantId));
      console.log("[getAllCargos] 🔒 Filtrando por tenantId:", tenantId);
    } else {
      console.log("[getAllCargos] 👑 Admin - Sem filtro de tenant (vê todos os cargos)");
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(cargos.empresaId, empresaId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(asc(cargos.nomeCargo));
  } catch (error) {
    console.error("[Database] Erro ao buscar cargos:", error);
    throw error;
  }
}

// === RELATÓRIOS DE CARGOS ===

export async function getRelatorioCargosPorEmpresa(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório) - SEMPRE filtrar se tenantId não for null
    // Se tenantId for null, é admin e pode ver todos (não filtra)
    if (tenantId !== null && tenantId !== undefined) {
      conditions.push(eq(cargos.tenantId, tenantId));
      conditions.push(eq(empresas.tenantId, tenantId));
      console.log("[getRelatorioCargosPorEmpresa] 🔒 Filtrando por tenantId:", tenantId);
    } else {
      console.log("[getRelatorioCargosPorEmpresa] 👑 Admin - Sem filtro de tenant (vê todos)");
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(cargos.empresaId, empresaId));
    }
    
    let query = db
      .select({
        empresaId: empresas.id,
        razaoSocial: empresas.razaoSocial,
        nomeFantasia: empresas.nomeFantasia,
        quantidade: sql<number>`COUNT(${cargos.id})`.as('quantidade'),
      })
      .from(cargos)
      .leftJoin(empresas, eq(cargos.empresaId, empresas.id));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.groupBy(empresas.id, empresas.razaoSocial, empresas.nomeFantasia) as any;
    
    return await query;
  } catch (error) {
    console.error("[Database] Erro ao buscar relatório de cargos por empresa:", error);
    throw error;
  }
}

export async function getRelatorioCargosPorSetor(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório) - SEMPRE filtrar se tenantId não for null
    if (tenantId !== null && tenantId !== undefined) {
      conditions.push(eq(cargos.tenantId, tenantId));
      conditions.push(eq(setores.tenantId, tenantId));
      console.log("[getRelatorioCargosPorSetor] 🔒 Filtrando por tenantId:", tenantId);
    } else {
      console.log("[getRelatorioCargosPorSetor] 👑 Admin - Sem filtro de tenant (vê todos)");
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(cargos.empresaId, empresaId));
    }
    
    let baseQuery = db
      .select({
        setorId: setores.id,
        nomeSetor: setores.nomeSetor,
        quantidade: sql<number>`COUNT(DISTINCT ${cargoSetores.cargoId})`.as('quantidade'),
      })
      .from(cargoSetores)
      .leftJoin(setores, eq(cargoSetores.setorId, setores.id))
      .leftJoin(cargos, eq(cargoSetores.cargoId, cargos.id));
    
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }
    
    baseQuery = baseQuery.groupBy(setores.id, setores.nomeSetor) as any;
    
    return await baseQuery;
  } catch (error) {
    console.error("[Database] Erro ao buscar relatório de cargos por setor:", error);
    throw error;
  }
}

export async function getRelatorioCargosPorEmpresaESetor(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório) - SEMPRE filtrar se tenantId não for null
    if (tenantId !== null && tenantId !== undefined) {
      conditions.push(eq(cargos.tenantId, tenantId));
      conditions.push(eq(empresas.tenantId, tenantId));
      conditions.push(eq(setores.tenantId, tenantId));
      console.log("[getRelatorioCargosPorEmpresaESetor] 🔒 Filtrando por tenantId:", tenantId);
    } else {
      console.log("[getRelatorioCargosPorEmpresaESetor] 👑 Admin - Sem filtro de tenant (vê todos)");
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(cargos.empresaId, empresaId));
    }
    
    let baseQuery = db
      .select({
        empresaId: empresas.id,
        razaoSocial: empresas.razaoSocial,
        nomeFantasia: empresas.nomeFantasia,
        setorId: setores.id,
        nomeSetor: setores.nomeSetor,
        quantidade: sql<number>`COUNT(DISTINCT ${cargoSetores.cargoId})`.as('quantidade'),
      })
      .from(cargoSetores)
      .leftJoin(cargos, eq(cargoSetores.cargoId, cargos.id))
      .leftJoin(empresas, eq(cargos.empresaId, empresas.id))
      .leftJoin(setores, eq(cargoSetores.setorId, setores.id));
    
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }
    
    baseQuery = baseQuery.groupBy(empresas.id, empresas.razaoSocial, empresas.nomeFantasia, setores.id, setores.nomeSetor) as any;
    
    return await baseQuery;
  } catch (error) {
    console.error("[Database] Erro ao buscar relatório de cargos por empresa e setor:", error);
    throw error;
  }
}

export async function getCargoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(cargos.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o cargo pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(cargos.tenantId, tenantId));
    }
    
    const result = await db.select().from(cargos).where(and(...conditions)).limit(1);
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

export async function getAllSetores(tenantId: number | null, filters?: any, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(setores);

    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(setores.tenantId, tenantId));
    }

    if (empresaId) {
      conditions.push(eq(setores.empresaId, empresaId));
    }

    if (filters?.searchTerm && typeof filters.searchTerm === "string" && filters.searchTerm.trim()) {
      const termo = `%${filters.searchTerm.trim()}%`;
      conditions.push(
        or(
          like(setores.nomeSetor, termo),
          like(setores.descricao, termo)
        )
      );
    }

    if (conditions.length) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(asc(setores.nomeSetor));
  } catch (error) {
    console.error("[Database] Erro ao buscar setores:", error);
    throw error;
  }
}

export async function getSetorById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(setores.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o setor pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(setores.tenantId, tenantId));
    }
    
    const result = await db.select().from(setores).where(and(...conditions)).limit(1);
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
    const result = await db.delete(setores).where(inArray(setores.id, ids));
    // Extrair o número de linhas afetadas
    const deletedCount = (result as any).affectedRows || (result as any)[0]?.affectedRows || ids.length;
    return { success: true, deleted: deletedCount };
  } catch (error) {
    console.error("[Database] Erro ao excluir setores:", error);
    throw error;
  }
}

// === CARGO TREINAMENTOS ===

export async function getTreinamentosByCargo(cargoId: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(cargoTreinamentos.cargoId, cargoId)];
    
    // ISOLAMENTO DE TENANT: Filtrar APENAS por cargoTreinamentos.tenantId
    // IMPORTANTE: NÃO filtrar por tiposTreinamentos.tenantId porque tipos de treinamento podem ser compartilhados
    // O que importa é que o VÍNCULO (cargoTreinamentos) pertence ao tenant correto
    if (tenantId !== undefined && tenantId !== null) {
      // FILTRAR APENAS por tenantId na tabela cargoTreinamentos (OBRIGATÓRIO)
      conditions.push(eq(cargoTreinamentos.tenantId, tenantId));
      console.log(`[Database] 🔍 Filtros aplicados: cargoId=${cargoId}, tenantId=${tenantId} (apenas cargoTreinamentos.tenantId)`);
    } else {
      // Para admin/super_admin, não filtrar por tenant
      console.log(`[Database] 🔍 Buscando sem filtro de tenant (admin/super_admin)`);
    }
    
    const result = await db
      .select({
        id: cargoTreinamentos.id,
        cargoId: cargoTreinamentos.cargoId,
        tipoTreinamentoId: cargoTreinamentos.tipoTreinamentoId,
        nomeTreinamento: tiposTreinamentos.nomeTreinamento,
        tipoNr: tiposTreinamentos.tipoNr,
        createdAt: cargoTreinamentos.createdAt,
        updatedAt: cargoTreinamentos.updatedAt,
        tenantId: cargoTreinamentos.tenantId, // Adicionar tenantId para debug
      })
      .from(cargoTreinamentos)
      .leftJoin(tiposTreinamentos, eq(cargoTreinamentos.tipoTreinamentoId, tiposTreinamentos.id))
      .where(and(...conditions))
      .orderBy(asc(tiposTreinamentos.nomeTreinamento));
    console.log(`[Database] 📊 Treinamentos encontrados para cargo ${cargoId} (tenantId: ${tenantId}):`, result.length);
    console.log(`[Database] 📊 Resultados completos:`, JSON.stringify(result, null, 2));
    
    // Debug: verificar se há treinamentos sem filtro de tenant
    if (result.length === 0 && tenantId) {
      const semFiltro = await db
        .select()
        .from(cargoTreinamentos)
        .where(eq(cargoTreinamentos.cargoId, cargoId))
        .limit(10);
      console.log(`[Database] 🔍 DEBUG: Treinamentos sem filtro de tenant:`, semFiltro.length);
      if (semFiltro.length > 0) {
        console.log(`[Database] 🔍 DEBUG: Primeiro resultado:`, semFiltro[0]);
        console.log(`[Database] 🔍 DEBUG: tenantId do vínculo:`, semFiltro[0].tenantId, `vs tenantId buscado:`, tenantId);
      }
    }
    
    return result;
  } catch (error) {
    console.error("[Database] Erro ao buscar treinamentos do cargo:", error);
    throw error;
  }
}

export async function createCargoTreinamento(data: InsertCargoTreinamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    console.log("[Database] 📝 Criando cargo treinamento:");
    console.log("[Database] 📝 Dados recebidos:", JSON.stringify(data, null, 2));
    
    // Validar dados obrigatórios
    if (!data.cargoId) {
      throw new Error("cargoId é obrigatório para criar vínculo de treinamento");
    }
    if (!data.tipoTreinamentoId) {
      throw new Error("tipoTreinamentoId é obrigatório para criar vínculo de treinamento");
    }
    
    // Se não tem tenantId, buscar do cargo
    if (!data.tenantId) {
      console.log("[Database] ⚠️ tenantId não fornecido, buscando do cargo...");
      const cargo = await getCargoById(data.cargoId, null);
      if (cargo && cargo.tenantId) {
        data.tenantId = cargo.tenantId;
        console.log("[Database] ✅ tenantId obtido do cargo:", data.tenantId);
      } else {
        throw new Error("Não foi possível determinar tenantId. Cargo não encontrado ou sem tenantId.");
      }
    }
    
    // Verificar se já existe vínculo (evitar duplicatas)
    const vínculoExistente = await db
      .select()
      .from(cargoTreinamentos)
      .where(
        and(
          eq(cargoTreinamentos.cargoId, data.cargoId),
          eq(cargoTreinamentos.tipoTreinamentoId, data.tipoTreinamentoId),
          eq(cargoTreinamentos.tenantId, data.tenantId)
        )
      )
      .limit(1);
    
    if (vínculoExistente.length > 0) {
      console.log("[Database] ⚠️ Vínculo já existe:", vínculoExistente[0]);
      return { success: true, id: vínculoExistente[0].id, alreadyExists: true };
    }
    
    console.log("[Database] 📤 Inserindo vínculo no banco...");
    const result = await db.insert(cargoTreinamentos).values(data);
    const insertId = (result as any)[0]?.insertId;
    console.log("[Database] ✅ Cargo treinamento criado com sucesso! ID:", insertId);
    
    // Verificar se foi realmente inserido
    const verificado = await db
      .select()
      .from(cargoTreinamentos)
      .where(eq(cargoTreinamentos.id, insertId))
      .limit(1);
    
    console.log("[Database] ✅ Vínculo verificado no banco:", verificado.length > 0 ? "SIM" : "NÃO");
    
    return { success: true, id: insertId };
  } catch (error: any) {
    console.error("[Database] ❌ Erro ao criar cargo treinamento:");
    console.error("[Database] ❌ Erro completo:", error);
    console.error("[Database] ❌ Mensagem:", error?.message);
    console.error("[Database] ❌ Stack:", error?.stack);
    console.error("[Database] ❌ Código SQL:", error?.code);
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

export async function deleteCargoTreinamentosBatch(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    if (ids.length === 0) {
      return { success: true, deleted: 0 };
    }
    await db.delete(cargoTreinamentos).where(inArray(cargoTreinamentos.id, ids));
    return { success: true, deleted: ids.length };
  } catch (error) {
    console.error("[Database] Erro ao excluir cargo treinamentos em massa:", error);
    throw error;
  }
}

// === CARGO SETORES ===

export async function getSetoresByCargo(cargoId: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(cargoSetores.cargoId, cargoId)];
    
    // ISOLAMENTO DE TENANT: Filtrar APENAS por cargoSetores.tenantId
    // IMPORTANTE: NÃO filtrar por setores.tenantId porque setores podem ser compartilhados
    // O que importa é que o VÍNCULO (cargoSetores) pertence ao tenant correto
    if (tenantId !== undefined && tenantId !== null) {
      // FILTRAR APENAS por tenantId na tabela cargoSetores (OBRIGATÓRIO)
      conditions.push(eq(cargoSetores.tenantId, tenantId));
      console.log(`[Database] 🔍 Filtros aplicados: cargoId=${cargoId}, tenantId=${tenantId} (apenas cargoSetores.tenantId)`);
    } else {
      console.log(`[Database] 🔍 Buscando sem filtro de tenant (admin/super_admin)`);
    }
    
    const result = await db
      .select({
        id: cargoSetores.id,
        cargoId: cargoSetores.cargoId,
        setorId: cargoSetores.setorId,
        nomeSetor: setores.nomeSetor,
        empresaId: cargoSetores.empresaId,
        createdAt: cargoSetores.createdAt,
        updatedAt: cargoSetores.updatedAt,
        tenantId: cargoSetores.tenantId, // Adicionar tenantId para debug
      })
      .from(cargoSetores)
      .leftJoin(setores, eq(cargoSetores.setorId, setores.id))
      .where(and(...conditions))
      .orderBy(asc(setores.nomeSetor));
    
    console.log(`[Database] 📊 Setores encontrados para cargo ${cargoId} (tenantId: ${tenantId}):`, result.length);
    console.log(`[Database] 📊 Resultados completos:`, JSON.stringify(result, null, 2));
    
    // Debug: verificar se há setores sem filtro de tenant
    if (result.length === 0 && tenantId) {
      const semFiltro = await db
        .select()
        .from(cargoSetores)
        .where(eq(cargoSetores.cargoId, cargoId))
        .limit(10);
      console.log(`[Database] 🔍 DEBUG: Setores sem filtro de tenant:`, semFiltro.length);
      if (semFiltro.length > 0) {
        console.log(`[Database] 🔍 DEBUG: Primeiro resultado:`, semFiltro[0]);
        console.log(`[Database] 🔍 DEBUG: tenantId do vínculo:`, semFiltro[0].tenantId, `vs tenantId buscado:`, tenantId);
      }
    }
    
    return result;
  } catch (error) {
    console.error("[Database] Erro ao buscar setores do cargo:", error);
    throw error;
  }
}

export async function createCargoSetor(data: InsertCargoSetor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    console.log("[Database] 📝 Criando cargo setor:");
    console.log("[Database] 📝 Dados recebidos:", JSON.stringify(data, null, 2));
    
    // Validar dados obrigatórios
    if (!data.cargoId) {
      throw new Error("cargoId é obrigatório para criar vínculo de setor");
    }
    if (!data.setorId) {
      throw new Error("setorId é obrigatório para criar vínculo de setor");
    }
    
    // Se não tem tenantId, buscar do cargo
    if (!data.tenantId) {
      console.log("[Database] ⚠️ tenantId não fornecido, buscando do cargo...");
      const cargo = await getCargoById(data.cargoId, null);
      if (cargo && cargo.tenantId) {
        data.tenantId = cargo.tenantId;
        console.log("[Database] ✅ tenantId obtido do cargo:", data.tenantId);
      } else {
        throw new Error("Não foi possível determinar tenantId. Cargo não encontrado ou sem tenantId.");
      }
    }
    
    // Verificar se já existe vínculo (evitar duplicatas)
    const vínculoExistente = await db
      .select()
      .from(cargoSetores)
      .where(
        and(
          eq(cargoSetores.cargoId, data.cargoId),
          eq(cargoSetores.setorId, data.setorId),
          eq(cargoSetores.tenantId, data.tenantId)
        )
      )
      .limit(1);
    
    if (vínculoExistente.length > 0) {
      console.log("[Database] ⚠️ Vínculo já existe:", vínculoExistente[0]);
      return { success: true, id: vínculoExistente[0].id, alreadyExists: true };
    }
    
    console.log("[Database] 📤 Inserindo vínculo no banco...");
    const result = await db.insert(cargoSetores).values(data);
    const insertId = (result as any)[0]?.insertId;
    console.log("[Database] ✅ Cargo setor criado com sucesso! ID:", insertId);
    
    // Verificar se foi realmente inserido
    const verificado = await db
      .select()
      .from(cargoSetores)
      .where(eq(cargoSetores.id, insertId))
      .limit(1);
    
    console.log("[Database] ✅ Vínculo verificado:", verificado.length > 0 ? "SIM" : "NÃO");
    
    return { success: true, id: insertId };
  } catch (error) {
    console.error("[Database] ❌ Erro ao criar cargo setor:", error);
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

export async function deleteCargoSetoresBatch(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    if (ids.length === 0) {
      return { success: true, deleted: 0 };
    }
    await db.delete(cargoSetores).where(inArray(cargoSetores.id, ids));
    return { success: true, deleted: ids.length };
  } catch (error) {
    console.error("[Database] Erro ao excluir cargo setores em massa:", error);
    throw error;
  }
}

// === RISCOS OCUPACIONAIS ===

export async function getAllRiscosOcupacionais(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(riscosOcupacionais.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(riscosOcupacionais.empresaId, empresaId));
    }
    
    let query = db.select().from(riscosOcupacionais);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(riscosOcupacionais.nomeRisco));
  } catch (error) {
    console.error("[Database] Erro ao buscar riscos ocupacionais:", error);
    throw error;
  }
}

export async function getRiscoOcupacionalById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(riscosOcupacionais.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o risco pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(riscosOcupacionais.tenantId, tenantId));
    }
    
    const result = await db.select().from(riscosOcupacionais).where(and(...conditions)).limit(1);
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
    console.log("[Database] Criando risco ocupacional:", JSON.stringify(data, null, 2));
    const result = await db.insert(riscosOcupacionais).values(data);
    console.log("[Database] Resultado do insert:", JSON.stringify(result, null, 2));
    
    // Tentar diferentes formatos de resposta do MySQL
    let insertId: number | undefined;
    
    // Formato 1: result[0].insertId
    if ((result as any)[0]?.insertId) {
      insertId = (result as any)[0].insertId;
    }
    // Formato 2: result.insertId
    else if ((result as any).insertId) {
      insertId = (result as any).insertId;
    }
    // Formato 3: result[0][0]?.insertId (alguns drivers)
    else if ((result as any)[0]?.[0]?.insertId) {
      insertId = (result as any)[0][0].insertId;
    }
    
    console.log("[Database] InsertId encontrado:", insertId);
    
    if (insertId) {
      const riscoCriado = await getRiscoOcupacionalById(insertId);
      console.log("[Database] Risco criado retornado:", JSON.stringify(riscoCriado, null, 2));
      
      // Garantir que o retorno seja serializável
      if (riscoCriado) {
        const response = {
          id: Number(riscoCriado.id),
          nomeRisco: riscoCriado.nomeRisco || "",
          tipoRisco: riscoCriado.tipoRisco || "fisico",
          descricao: riscoCriado.descricao || null,
          codigo: riscoCriado.codigo || null,
          status: riscoCriado.status || "ativo",
          empresaId: riscoCriado.empresaId || null,
        };
        
        // Validar serialização
        try {
          JSON.stringify(response);
          return response;
        } catch (serialError) {
          console.error("[Database] Erro ao serializar risco criado:", serialError);
          return riscoCriado;
        }
      }
      
      return riscoCriado;
    }
    
    console.error("[Database] Não foi possível obter o insertId do resultado:", result);
    throw new Error("Não foi possível obter o ID do risco criado");
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

export async function getRiscosByCargo(cargoId: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(cargoRiscos.cargoId, cargoId)];
    
    // ISOLAMENTO DE TENANT: Filtrar APENAS por cargoRiscos.tenantId
    // IMPORTANTE: NÃO filtrar por riscosOcupacionais.tenantId porque riscos podem ser compartilhados
    // O que importa é que o VÍNCULO (cargoRiscos) pertence ao tenant correto
    if (tenantId !== undefined && tenantId !== null) {
      // FILTRAR APENAS por tenantId na tabela cargoRiscos (OBRIGATÓRIO)
      conditions.push(eq(cargoRiscos.tenantId, tenantId));
      console.log(`[Database] 🔍 Filtros aplicados: cargoId=${cargoId}, tenantId=${tenantId} (apenas cargoRiscos.tenantId)`);
    } else {
      console.log(`[Database] 🔍 Buscando sem filtro de tenant (admin/super_admin)`);
    }
    
    const resultados = await db
      .select({
        id: cargoRiscos.id,
        cargoId: cargoRiscos.cargoId,
        riscoOcupacionalId: cargoRiscos.riscoOcupacionalId,
        tipoAgente: cargoRiscos.tipoAgente,
        descricaoRiscos: cargoRiscos.descricaoRiscos,
        fonteGeradora: cargoRiscos.fonteGeradora,
        tipo: cargoRiscos.tipo,
        meioPropagacao: cargoRiscos.meioPropagacao,
        meioContato: cargoRiscos.meioContato,
        possiveisDanosSaude: cargoRiscos.possiveisDanosSaude,
        tipoAnalise: cargoRiscos.tipoAnalise,
        valorAnaliseQuantitativa: cargoRiscos.valorAnaliseQuantitativa,
        gradacaoEfeitos: cargoRiscos.gradacaoEfeitos,
        gradacaoExposicao: cargoRiscos.gradacaoExposicao,
        empresaId: cargoRiscos.empresaId,
        nomeRisco: riscosOcupacionais.nomeRisco,
        tipoRisco: riscosOcupacionais.tipoRisco,
        createdAt: cargoRiscos.createdAt,
        updatedAt: cargoRiscos.updatedAt,
        tenantId: cargoRiscos.tenantId, // Adicionar tenantId para debug
      })
      .from(cargoRiscos)
      .leftJoin(riscosOcupacionais, eq(cargoRiscos.riscoOcupacionalId, riscosOcupacionais.id))
      .where(and(...conditions))
      .orderBy(asc(riscosOcupacionais.nomeRisco));
    
    console.log(`[Database] 📊 Riscos encontrados para cargo ${cargoId} (tenantId: ${tenantId}):`, resultados.length);
    console.log(`[Database] 📊 Resultados completos:`, JSON.stringify(resultados, null, 2));
    
    // Debug: verificar se há riscos sem filtro de tenant
    if (resultados.length === 0 && tenantId) {
      const semFiltro = await db
        .select()
        .from(cargoRiscos)
        .where(eq(cargoRiscos.cargoId, cargoId))
        .limit(10);
      console.log(`[Database] 🔍 DEBUG: Riscos sem filtro de tenant:`, semFiltro.length);
      if (semFiltro.length > 0) {
        console.log(`[Database] 🔍 DEBUG: Primeiro resultado:`, semFiltro[0]);
        console.log(`[Database] 🔍 DEBUG: tenantId do vínculo:`, semFiltro[0].tenantId, `vs tenantId buscado:`, tenantId);
      }
    }
    
    return resultados;
  } catch (error) {
    console.error("[Database] Erro ao buscar riscos do cargo:", error);
    throw error;
  }
}

export async function createCargoRisco(data: InsertCargoRisco) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    console.log("[Database] Criando cargo risco com dados:", JSON.stringify(data, null, 2));
    
    // Validar campos obrigatórios
    if (!data.cargoId || data.cargoId <= 0) {
      throw new Error("cargoId é obrigatório e deve ser maior que zero");
    }
    if (!data.riscoOcupacionalId || data.riscoOcupacionalId <= 0) {
      throw new Error("riscoOcupacionalId é obrigatório e deve ser maior que zero");
    }
    if (!data.tenantId || data.tenantId <= 0) {
      throw new Error("tenantId é obrigatório e deve ser maior que zero");
    }

    await db.insert(cargoRiscos).values(data);
    console.log("[Database] Cargo risco criado com sucesso");
    
    // Retornar objeto simples e garantidamente serializável
    return { 
      success: true,
      cargoId: Number(data.cargoId),
      riscoOcupacionalId: Number(data.riscoOcupacionalId)
    };
  } catch (error: any) {
    console.error("[Database] Erro ao criar cargo risco:", error);
    console.error("[Database] Dados recebidos:", JSON.stringify(data, null, 2));
    console.error("[Database] Stack trace:", error.stack);
    
    // Melhorar mensagem de erro
    if (error.message) {
      throw new Error(`Erro ao salvar risco: ${error.message}`);
    }
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

export async function getAllTiposTreinamentos(tenantId: number | null, filters?: any, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(tiposTreinamentos.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(tiposTreinamentos.empresaId, empresaId));
    }
    
    let query = db.select().from(tiposTreinamentos);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(tiposTreinamentos.nomeTreinamento));
  } catch (error) {
    console.error("[Database] Erro ao buscar tipos de treinamentos:", error);
    throw error;
  }
}

export async function getTipoTreinamentoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(tiposTreinamentos.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o tipo de treinamento pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(tiposTreinamentos.tenantId, tenantId));
    }
    
    const result = await db.select().from(tiposTreinamentos).where(and(...conditions)).limit(1);
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

export async function getAllModelosCertificados(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(modelosCertificados.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(modelosCertificados.empresaId, empresaId));
    }
    
    let query = db.select().from(modelosCertificados);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(modelosCertificados.nome));
  } catch (error) {
    console.error("[Database] Erro ao buscar modelos de certificados:", error);
    throw error;
  }
}

export async function getModeloCertificadoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(modelosCertificados.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o modelo pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(modelosCertificados.tenantId, tenantId));
    }
    
    const result = await db.select().from(modelosCertificados).where(and(...conditions)).limit(1);
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

export async function getAllResponsaveis(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    let query = db.select().from(responsaveis);
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório) - SEMPRE filtrar se tenantId não for null
    // Se tenantId for null, é admin e pode ver todos (não filtra)
    if (tenantId !== null && tenantId !== undefined) {
      conditions.push(eq(responsaveis.tenantId, tenantId));
      console.log("[getAllResponsaveis] 🔒 Filtrando por tenantId:", tenantId);
    } else {
      console.log("[getAllResponsaveis] 👑 Admin - Sem filtro de tenant (vê todos)");
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(responsaveis.empresaId, empresaId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(asc(responsaveis.nomeCompleto));
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

// === CARGOS CBO ===

export async function getAllCargosCbo(searchTerm?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Verificar se a tabela existe antes de buscar
    try {
      await db.select().from(cargosCbo).limit(1);
    } catch (tableError: any) {
      // Se a tabela não existir, retornar array vazio
      if (tableError.message?.includes("doesn't exist") || tableError.message?.includes("Unknown table")) {
        console.log("[CBO] Tabela cargosCbo não existe ainda. Execute a migração primeiro.");
        return [];
      }
      throw tableError;
    }
    
    let query = db.select().from(cargosCbo);
    
    // Buscar todos os cargos primeiro e filtrar no JavaScript para normalização de acentos
    const todosCargos = await query.orderBy(asc(cargosCbo.nomeCargo));
    
    // Se não houver dados no banco, retornar array vazio (não usar dados de exemplo aqui)
    if (todosCargos.length === 0) {
      console.log("[CBO] Nenhum CBO encontrado no banco de dados. Execute a importação: pnpm importar:cbo-completo");
      return [];
    }
    
    if (searchTerm && searchTerm.trim()) {
      const termoNormalizado = normalizarTexto(searchTerm.trim());
      return todosCargos.filter(cargo => {
        const codigoNorm = normalizarTexto(cargo.codigoCbo || "");
        const nomeNorm = normalizarTexto(cargo.nomeCargo || "");
        const descNorm = normalizarTexto(cargo.descricao || "");
        const sinonNorm = normalizarTexto(cargo.sinonimia || "");
        
        return codigoNorm.includes(termoNormalizado) ||
               nomeNorm.includes(termoNormalizado) ||
               descNorm.includes(termoNormalizado) ||
               sinonNorm.includes(termoNormalizado);
      });
    }
    
    return todosCargos;
  } catch (error: any) {
    // Se for erro de tabela não existir, retornar array vazio
    if (error.message?.includes("doesn't exist") || error.message?.includes("Unknown table")) {
      console.log("[CBO] Tabela cargosCbo não existe. Retornando array vazio.");
      return [];
    }
    console.error("[Database] Erro ao buscar cargos CBO:", error);
    return [];
  }
}

export async function getCargoCboByCodigo(codigoCbo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db
      .select()
      .from(cargosCbo)
      .where(eq(cargosCbo.codigoCbo, codigoCbo))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao buscar cargo CBO por código:", error);
    throw error;
  }
}

// Função para normalizar texto (remover acentos)
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Dados CBO de exemplo para quando a API não estiver disponível
const CARGOS_CBO_EXEMPLO = [
  { codigoCbo: "2251-05", nomeCargo: "Médico do trabalho", descricao: "Avaliam a capacidade do candidato ou empregado para o trabalho, realizam exames médicos periódicos e tratam doenças profissionais.", familiaOcupacional: "Médicos", sinonimia: "Médico do trabalho, Médico ocupacional" },
  { codigoCbo: "2251-10", nomeCargo: "Médico perito", descricao: "Avaliam a capacidade do candidato ou empregado para o trabalho, realizam exames médicos periódicos.", familiaOcupacional: "Médicos", sinonimia: "Médico perito, Perito médico" },
  { codigoCbo: "2253-05", nomeCargo: "Enfermeiro do trabalho", descricao: "Atuam na área de saúde ocupacional, desenvolvendo ações de promoção, proteção e recuperação da saúde dos trabalhadores.", familiaOcupacional: "Enfermeiros", sinonimia: "Enfermeiro do trabalho, Enfermeiro ocupacional" },
  { codigoCbo: "2515-05", nomeCargo: "Psicólogo do trabalho", descricao: "Avaliam o comportamento humano no trabalho, desenvolvem programas de seleção, treinamento e desenvolvimento de pessoal.", familiaOcupacional: "Psicólogos", sinonimia: "Psicólogo do trabalho, Psicólogo organizacional" },
  { codigoCbo: "3142-05", nomeCargo: "Técnico de segurança do trabalho", descricao: "Elaboram e implementam programas de prevenção de acidentes do trabalho, inspecionam locais de trabalho, identificam riscos.", familiaOcupacional: "Técnicos de segurança do trabalho", sinonimia: "Técnico de segurança do trabalho, TST" },
  { codigoCbo: "3142-10", nomeCargo: "Técnico em higiene ocupacional", descricao: "Avaliam e controlam os riscos ambientais nos locais de trabalho, realizam medições de agentes físicos, químicos e biológicos.", familiaOcupacional: "Técnicos de segurança do trabalho", sinonimia: "Técnico em higiene ocupacional" },
  { codigoCbo: "2141-05", nomeCargo: "Engenheiro de segurança do trabalho", descricao: "Elaboram e implementam programas de prevenção de acidentes do trabalho, inspecionam instalações e equipamentos.", familiaOcupacional: "Engenheiros de segurança do trabalho", sinonimia: "Engenheiro de segurança do trabalho, Engenheiro em segurança" },
  { codigoCbo: "6324-05", nomeCargo: "Eletricista", descricao: "Executam instalações e manutenção de sistemas elétricos, como fiação, quadros de distribuição e equipamentos elétricos.", familiaOcupacional: "Eletricistas", sinonimia: "Eletricista, Eletricista instalador" },
  { codigoCbo: "6322-05", nomeCargo: "Pedreiro", descricao: "Executam serviços de alvenaria, como construção de paredes, muros e estruturas. Aplicam revestimentos, assentam pisos e azulejos.", familiaOcupacional: "Pedreiros", sinonimia: "Pedreiro, Alvanel" },
  { codigoCbo: "6323-05", nomeCargo: "Carpinteiro", descricao: "Executam serviços de carpintaria, como construção de estruturas de madeira, confecção de portas, janelas e móveis.", familiaOcupacional: "Carpinteiros", sinonimia: "Carpinteiro, Marceneiro" },
  { codigoCbo: "6325-05", nomeCargo: "Soldador", descricao: "Executam serviços de solda em estruturas metálicas, utilizando diferentes processos de soldagem.", familiaOcupacional: "Soldadores", sinonimia: "Soldador, Soldador estrutural" },
  { codigoCbo: "7241-05", nomeCargo: "Eletricista de manutenção", descricao: "Realizam manutenção preventiva e corretiva em sistemas elétricos, equipamentos e máquinas.", familiaOcupacional: "Eletricistas de manutenção", sinonimia: "Eletricista de manutenção, Eletricista industrial" },
  { codigoCbo: "8414-28", nomeCargo: "Operador de produção", descricao: "Operam máquinas e equipamentos de produção industrial, controlando processos de fabricação.", familiaOcupacional: "Operadores de produção", sinonimia: "Operador de produção, Operador de máquinas industriais" },
  { codigoCbo: "4110-05", nomeCargo: "Auxiliar administrativo", descricao: "Executam atividades administrativas de rotina, como atendimento ao público, organização de documentos.", familiaOcupacional: "Auxiliares administrativos", sinonimia: "Auxiliar administrativo, Assistente administrativo" },
  { codigoCbo: "5151-10", nomeCargo: "Auxiliar de enfermagem do trabalho", descricao: "Auxiliam o enfermeiro do trabalho na execução de atividades de saúde ocupacional.", familiaOcupacional: "Auxiliares de enfermagem", sinonimia: "Auxiliar de enfermagem do trabalho" },
  { codigoCbo: "6321-20", nomeCargo: "Servente de obras", descricao: "Executam serviços auxiliares em obras de construção civil, como limpeza, transporte de materiais e apoio aos trabalhadores especializados.", familiaOcupacional: "Serventes de obras", sinonimia: "Servente de obras, Servente, Ajudante de obras, Servente de construção" },
  { codigoCbo: "6321-25", nomeCargo: "Ajudante de obras", descricao: "Auxiliam trabalhadores especializados em obras de construção civil, transportando materiais e ferramentas e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de obras", sinonimia: "Ajudante de obras, Ajudante de construção, Servente de obras" },
  { codigoCbo: "6321-30", nomeCargo: "Ajudante de pedreiro", descricao: "Auxiliam pedreiros em serviços de alvenaria, preparando materiais, transportando tijolos e argamassa e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de pedreiro", sinonimia: "Ajudante de pedreiro, Servente de pedreiro" },
  { codigoCbo: "6321-35", nomeCargo: "Ajudante de carpinteiro", descricao: "Auxiliam carpinteiros em serviços de carpintaria, preparando materiais, transportando madeira e ferramentas e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de carpinteiro", sinonimia: "Ajudante de carpinteiro, Servente de carpinteiro" },
  { codigoCbo: "6321-40", nomeCargo: "Ajudante de eletricista", descricao: "Auxiliam eletricistas em instalações e manutenção elétrica, preparando materiais, transportando ferramentas e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de eletricista", sinonimia: "Ajudante de eletricista, Servente de eletricista" },
  { codigoCbo: "6321-45", nomeCargo: "Ajudante de encanador", descricao: "Auxiliam encanadores em instalações e manutenção hidráulica, preparando materiais, transportando ferramentas e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de encanador", sinonimia: "Ajudante de encanador, Servente de encanador" },
  { codigoCbo: "6321-50", nomeCargo: "Ajudante de pintor", descricao: "Auxiliam pintores em serviços de pintura, preparando superfícies, misturando tintas, transportando materiais e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de pintor", sinonimia: "Ajudante de pintor, Servente de pintor" },
  { codigoCbo: "6321-55", nomeCargo: "Ajudante de soldador", descricao: "Auxiliam soldadores em serviços de soldagem, preparando materiais, transportando equipamentos e executando tarefas auxiliares.", familiaOcupacional: "Ajudantes de soldador", sinonimia: "Ajudante de soldador, Servente de soldador" },
  { codigoCbo: "6326-05", nomeCargo: "Encanador", descricao: "Executam instalações e manutenção de sistemas hidráulicos e sanitários, como tubulações, conexões e aparelhos sanitários.", familiaOcupacional: "Encanadores", sinonimia: "Encanador, Instalador hidráulico" },
  { codigoCbo: "6327-05", nomeCargo: "Pintor de obras", descricao: "Executam serviços de pintura em obras de construção civil, aplicando tintas, vernizes e outros revestimentos em superfícies.", familiaOcupacional: "Pintores", sinonimia: "Pintor de obras, Pintor de construção" },
  { codigoCbo: "6328-05", nomeCargo: "Gesseiro", descricao: "Executam serviços de aplicação de gesso em obras de construção civil, preparando e aplicando gesso em paredes e tetos.", familiaOcupacional: "Gesseiros", sinonimia: "Gesseiro, Aplicador de gesso" },
  { codigoCbo: "6329-05", nomeCargo: "Azulejista", descricao: "Executam serviços de assentamento de azulejos e revestimentos cerâmicos em obras de construção civil.", familiaOcupacional: "Azulejistas", sinonimia: "Azulejista, Ladrilheiro" },
  { codigoCbo: "6330-05", nomeCargo: "Armador", descricao: "Executam serviços de armação de estruturas de concreto armado, cortando, dobrando e posicionando barras de aço.", familiaOcupacional: "Armadores", sinonimia: "Armador, Armador de ferragens" },
  { codigoCbo: "6331-05", nomeCargo: "Cimenteiro", descricao: "Executam serviços de preparação e aplicação de concreto e argamassa em obras de construção civil.", familiaOcupacional: "Cimenteiros", sinonimia: "Cimenteiro, Concretista" },
  { codigoCbo: "6332-05", nomeCargo: "Operador de betoneira", descricao: "Operam betoneiras para preparação de concreto e argamassa em obras de construção civil.", familiaOcupacional: "Operadores de betoneira", sinonimia: "Operador de betoneira, Betoneiro" },
  { codigoCbo: "6333-05", nomeCargo: "Operador de guindaste", descricao: "Operam guindastes para movimentação de cargas e materiais em obras de construção civil.", familiaOcupacional: "Operadores de guindaste", sinonimia: "Operador de guindaste, Guindasteiro" },
  { codigoCbo: "6334-05", nomeCargo: "Operador de escavadeira", descricao: "Operam escavadeiras para movimentação de terra e escavação em obras de construção civil.", familiaOcupacional: "Operadores de escavadeira", sinonimia: "Operador de escavadeira, Escavadeirista" },
  { codigoCbo: "6335-05", nomeCargo: "Operador de trator", descricao: "Operam tratores para movimentação de terra e materiais em obras de construção civil.", familiaOcupacional: "Operadores de trator", sinonimia: "Operador de trator, Tratorista" },
  { codigoCbo: "6336-05", nomeCargo: "Operador de pá carregadeira", descricao: "Operam pá carregadeiras para movimentação de materiais e terra em obras de construção civil.", familiaOcupacional: "Operadores de pá carregadeira", sinonimia: "Operador de pá carregadeira, Pá carregadeirista" },
  { codigoCbo: "6337-05", nomeCargo: "Operador de rolo compactador", descricao: "Operam rolos compactadores para compactação de solo e asfalto em obras de construção civil.", familiaOcupacional: "Operadores de rolo compactador", sinonimia: "Operador de rolo compactador, Compactadorista" },
  { codigoCbo: "6338-05", nomeCargo: "Operador de motoniveladora", descricao: "Operam motoniveladoras para nivelamento de terreno em obras de construção civil.", familiaOcupacional: "Operadores de motoniveladora", sinonimia: "Operador de motoniveladora, Motoniveladorista" },
  { codigoCbo: "6339-05", nomeCargo: "Operador de retroescavadeira", descricao: "Operam retroescavadeiras para escavação e movimentação de terra em obras de construção civil.", familiaOcupacional: "Operadores de retroescavadeira", sinonimia: "Operador de retroescavadeira, Retroescavadeirista" },
  { codigoCbo: "6340-05", nomeCargo: "Operador de caminhão basculante", descricao: "Operam caminhões basculantes para transporte de materiais e terra em obras de construção civil.", familiaOcupacional: "Operadores de caminhão basculante", sinonimia: "Operador de caminhão basculante, Caminhoneiro de obra" },
  { codigoCbo: "6341-05", nomeCargo: "Operador de empilhadeira", descricao: "Operam empilhadeiras para movimentação e armazenagem de materiais em obras e depósitos.", familiaOcupacional: "Operadores de empilhadeira", sinonimia: "Operador de empilhadeira, Empilhadeirista" },
  { codigoCbo: "6342-05", nomeCargo: "Operador de grua", descricao: "Operam gruas para movimentação de cargas e materiais em obras de construção civil.", familiaOcupacional: "Operadores de grua", sinonimia: "Operador de grua, Gruista" },
  { codigoCbo: "6343-05", nomeCargo: "Operador de ponte rolante", descricao: "Operam pontes rolantes para movimentação de cargas em indústrias e obras.", familiaOcupacional: "Operadores de ponte rolante", sinonimia: "Operador de ponte rolante, Ponte rolantista" },
  { codigoCbo: "6344-05", nomeCargo: "Operador de talha elétrica", descricao: "Operam talhas elétricas para movimentação de cargas em obras e indústrias.", familiaOcupacional: "Operadores de talha elétrica", sinonimia: "Operador de talha elétrica, Talhista" },
  { codigoCbo: "6345-05", nomeCargo: "Operador de plataforma elevatória", descricao: "Operam plataformas elevatórias para elevação de trabalhadores e materiais em obras de construção civil.", familiaOcupacional: "Operadores de plataforma elevatória", sinonimia: "Operador de plataforma elevatória, Plataformista" },
  { codigoCbo: "6346-05", nomeCargo: "Operador de andaime", descricao: "Montam e operam andaimes para acesso a alturas em obras de construção civil.", familiaOcupacional: "Operadores de andaime", sinonimia: "Operador de andaime, Andaimeiro" },
  { codigoCbo: "6347-05", nomeCargo: "Operador de bomba de concreto", descricao: "Operam bombas de concreto para lançamento de concreto em obras de construção civil.", familiaOcupacional: "Operadores de bomba de concreto", sinonimia: "Operador de bomba de concreto, Bombista" },
  { codigoCbo: "6348-05", nomeCargo: "Operador de cortadora de concreto", descricao: "Operam cortadoras de concreto para corte de estruturas de concreto em obras de construção civil.", familiaOcupacional: "Operadores de cortadora de concreto", sinonimia: "Operador de cortadora de concreto, Cortadorista" },
  { codigoCbo: "6349-05", nomeCargo: "Operador de furadeira de concreto", descricao: "Operam furadeiras de concreto para perfuração de estruturas de concreto em obras de construção civil.", familiaOcupacional: "Operadores de furadeira de concreto", sinonimia: "Operador de furadeira de concreto, Furadeirista" },
  { codigoCbo: "6350-05", nomeCargo: "Operador de serra de concreto", descricao: "Operam serras de concreto para corte de estruturas de concreto em obras de construção civil.", familiaOcupacional: "Operadores de serra de concreto", sinonimia: "Operador de serra de concreto, Serrista" },
];

export async function buscarCboNaApi(codigoOuNome?: string): Promise<any[]> {
  try {
    // Tentar Brasil API primeiro (API brasileira oficial)
    const brasilApiUrls = codigoOuNome && codigoOuNome.trim() 
      ? [
          `https://brasilapi.com.br/api/cbo/v1/${codigoOuNome.trim().replace(/-/g, '')}`,
          `https://brasilapi.com.br/api/cbo/v1/${codigoOuNome.trim()}`,
        ]
      : [];
    
    // Tentar diferentes URLs possíveis da API CBO do GitHub
    const githubUrls = [
      "https://raw.githubusercontent.com/datasets-br/cbo/master/data/cbo.json",
      "https://raw.githubusercontent.com/datasets-br/cbo/main/data/cbo.json",
      "https://raw.githubusercontent.com/datasets-br/cbo/master/cbo.json",
      "https://raw.githubusercontent.com/datasets-br/cbo/main/cbo.json",
    ];
    
    const todasUrls = [...brasilApiUrls, ...githubUrls];
    
    let data: any = null;
    let apiFuncionou = false;
    let apiUsada = "";
    
    // Tentar cada URL até encontrar uma que funcione
    for (const url of todasUrls) {
      try {
        // Usar axios (já está no projeto)
        const axios = (await import('axios')).default;
        const response = await axios.get(url, { timeout: 10000 });
        
        // Se for Brasil API, pode retornar um objeto único ou array
        if (url.includes('brasilapi.com.br')) {
          const resultado = response.data;
          if (resultado && typeof resultado === 'object') {
            // Se for um objeto único, converter para array
            if (!Array.isArray(resultado)) {
              data = [resultado];
            } else {
              data = resultado;
            }
            apiFuncionou = true;
            apiUsada = "Brasil API";
            console.log(`[CBO] ✅ Dados obtidos da Brasil API: ${url}`);
            break;
          }
        } else {
          // GitHub API
          data = response.data;
          apiFuncionou = true;
          apiUsada = "GitHub API";
          console.log(`[CBO] ✅ Dados obtidos da GitHub API: ${url}`);
          break;
        }
      } catch (error: any) {
        // Ignorar erros 404 silenciosamente, apenas logar outros erros
        if (error.response?.status !== 404) {
          console.log(`[CBO] ⚠️ Erro ao buscar de ${url}: ${error.message}`);
        }
        continue;
      }
    }
    
    // Se a API não funcionar, usar dados de exemplo
    let cargos: any[] = [];
    
    if (apiFuncionou && data) {
      // A API pode retornar objeto ou array
      if (Array.isArray(data)) {
        cargos = data;
      } else if (typeof data === 'object' && data !== null) {
        // Se for objeto, converter para array
        cargos = Object.values(data);
      }
      
      // Se for Brasil API, mapear os campos para o formato esperado
      if (apiUsada === "Brasil API" && cargos.length > 0) {
        cargos = cargos.map((cargo: any) => ({
          codigoCbo: cargo.codigo || cargo.cbo || cargo.codigoCbo || "",
          nomeCargo: cargo.titulo || cargo.nome || cargo.nomeCargo || cargo.ocupacao || "",
          descricao: cargo.descricao || cargo.sinopse || "",
          familiaOcupacional: cargo.familia || cargo.familiaOcupacional || cargo.grupo || "",
          sinonimia: cargo.sinonimia || cargo.variantes || "",
        }));
      }
    } else {
      // Usar dados de exemplo se a API não estiver disponível
      console.log("[CBO] API não disponível, usando dados de exemplo");
      cargos = CARGOS_CBO_EXEMPLO;
    }
    
    console.log(`[CBO] Total de cargos encontrados: ${cargos.length}`);
    
    // Filtrar por código ou nome se fornecido (com normalização de acentos)
    if (codigoOuNome && codigoOuNome.trim()) {
      const termoNormalizado = normalizarTexto(codigoOuNome.trim());
      const originalLength = cargos.length;
      
      cargos = cargos.filter((cargo: any) => {
        // Tentar diferentes campos possíveis e normalizar
        const codigo = normalizarTexto(
          (cargo.codigo || 
          cargo.cbo || 
          cargo.codigoCbo || 
          cargo.id ||
          "").toString()
        );
        
        const nome = normalizarTexto(
          (cargo.titulo || 
          cargo.nome || 
          cargo.nomeCargo || 
          cargo.ocupacao ||
          cargo.descricaoOcupacao ||
          "").toString()
        );
        
        const descricao = normalizarTexto(
          (cargo.descricao || 
          cargo.sinopse || 
          cargo.descricaoDetalhada ||
          "").toString()
        );
        
        const sinonimia = normalizarTexto(
          (cargo.sinonimia || 
          cargo.variantes || 
          cargo.denominacoes ||
          "").toString()
        );
        
        return codigo.includes(termoNormalizado) || 
               nome.includes(termoNormalizado) || 
               descricao.includes(termoNormalizado) ||
               sinonimia.includes(termoNormalizado);
      });
      
      console.log(`[CBO] Filtrados ${cargos.length} de ${originalLength} para termo: "${codigoOuNome}"`);
    }
    
    // Limitar a 100 resultados para performance
    const limitados = cargos.slice(0, 100);
    
    // Mapear para formato padronizado
    return limitados.map((cargo: any) => ({
      codigoCbo: cargo.codigo || cargo.cbo || cargo.codigoCbo || cargo.id || "",
      nomeCargo: cargo.titulo || cargo.nome || cargo.nomeCargo || cargo.ocupacao || cargo.descricaoOcupacao || "",
      descricao: cargo.descricao || cargo.sinopse || cargo.descricaoDetalhada || "",
      familiaOcupacional: cargo.familia || cargo.familiaOcupacional || cargo.grupo || "",
      sinonimia: cargo.sinonimia || cargo.variantes || cargo.denominacoes || "",
    }));
  } catch (error: any) {
    console.error("[Database] Erro ao buscar CBO na API:", error.message);
    // Em caso de erro, retornar dados de exemplo filtrados (com normalização)
    if (codigoOuNome && codigoOuNome.trim()) {
      const termoNormalizado = normalizarTexto(codigoOuNome.trim());
      return CARGOS_CBO_EXEMPLO
        .filter(cargo => {
          const codigoNorm = normalizarTexto(cargo.codigoCbo);
          const nomeNorm = normalizarTexto(cargo.nomeCargo);
          const descNorm = normalizarTexto(cargo.descricao);
          const sinonNorm = cargo.sinonimia ? normalizarTexto(cargo.sinonimia) : "";
          
          return codigoNorm.includes(termoNormalizado) ||
                 nomeNorm.includes(termoNormalizado) ||
                 descNorm.includes(termoNormalizado) ||
                 sinonNorm.includes(termoNormalizado);
        })
        .slice(0, 100);
    }
    return CARGOS_CBO_EXEMPLO.slice(0, 100);
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

export async function getAllCertificadosEmitidos(tenantId: number | null, empresaId?: number | null, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(certificadosEmitidos.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(certificadosEmitidos.empresaId, empresaId));
    }
    
    let query = db.select().from(certificadosEmitidos);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(asc(certificadosEmitidos.nomeColaborador));
  } catch (error) {
    console.error("[Database] Erro ao buscar certificados emitidos:", error);
    throw error;
  }
}

export async function getCertificadoEmitidoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(certificadosEmitidos.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o certificado pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(certificadosEmitidos.tenantId, tenantId));
    }
    
    const result = await db.select().from(certificadosEmitidos).where(and(...conditions)).limit(1);
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
    return await query.orderBy(asc(tiposEpis.tipoEpi));
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

export async function getAllOrdensServico(tenantId: number | null, empresaId?: number | null, filters?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório) - SEMPRE filtrar se tenantId não for null
    // Se tenantId for null, é admin e pode ver todos (não filtra)
    if (tenantId !== null && tenantId !== undefined) {
      conditions.push(eq(ordensServico.tenantId, tenantId));
      console.log("[getAllOrdensServico] 🔒 Filtrando por tenantId:", tenantId);
    } else {
      console.log("[getAllOrdensServico] 👑 Admin - Sem filtro de tenant (vê todos)");
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(ordensServico.empresaId, empresaId));
    }
    
    // Fazer JOINs com empresas, colaboradores, cargos e responsáveis para buscar todos os dados
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
      cidade: ordensServico.cidade,
      uf: ordensServico.uf,
      createdAt: ordensServico.createdAt,
      updatedAt: ordensServico.updatedAt,
      // JOIN com empresas
      empresaNome: empresas.razaoSocial,
      empresaCnpj: empresas.cnpj,
      // JOIN com colaboradores
      colaboradorNome: colaboradores.nomeCompleto,
      colaboradorDataAdmissao: colaboradores.dataAdmissao,
      colaboradorCargoId: colaboradores.cargoId,
      // JOIN com cargos para buscar função do colaborador
      colaboradorFuncao: cargos.nomeCargo,
      colaboradorDescricaoCargo: cargos.descricao,
      // JOIN com responsáveis
      responsavelNome: responsaveis.nomeCompleto,
      responsavelFuncao: responsaveis.funcao,
      responsavelRegistroProfissional: responsaveis.registroProfissional,
    })
    .from(ordensServico)
    .leftJoin(empresas, eq(ordensServico.empresaId, empresas.id))
    .leftJoin(colaboradores, eq(ordensServico.colaboradorId, colaboradores.id))
    .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
    .leftJoin(responsaveis, eq(ordensServico.responsavelId, responsaveis.id));
    
    // Filtro opcional por searchTerm (busca em número, descrição ou empresa)
    // Deve ser aplicado após os JOINs
    if (filters?.searchTerm) {
      const searchTerm = `%${filters.searchTerm}%`;
      conditions.push(
        or(
          like(ordensServico.numeroOrdem, searchTerm),
          like(ordensServico.descricaoServico, searchTerm),
          like(empresas.razaoSocial, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(asc(ordensServico.numeroOrdem));
    
    console.log("[getAllOrdensServico] 📊 Retornando", result.length, "ordens de serviço");
    
    return result;
  } catch (error) {
    console.error("[Database] Erro ao buscar ordens de serviço:", error);
    throw error;
  }
}

export async function getOrdemServicoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(ordensServico.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se a ordem de serviço pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(ordensServico.tenantId, tenantId));
    }
    
    // Fazer JOINs com empresas, colaboradores, cargos e responsáveis para buscar todos os dados necessários
    const result = await db.select({
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
      cidade: ordensServico.cidade,
      uf: ordensServico.uf,
      createdAt: ordensServico.createdAt,
      updatedAt: ordensServico.updatedAt,
      // JOIN com empresas
      empresaNome: empresas.razaoSocial,
      empresaCnpj: empresas.cnpj,
      // JOIN com colaboradores
      colaboradorNome: colaboradores.nomeCompleto,
      colaboradorDataAdmissao: colaboradores.dataAdmissao,
      colaboradorCargoId: colaboradores.cargoId,
      // JOIN com cargos para buscar função do colaborador
      colaboradorFuncao: cargos.nomeCargo,
      colaboradorDescricaoCargo: cargos.descricao,
      // JOIN com responsáveis
      responsavelNome: responsaveis.nomeCompleto,
      responsavelFuncao: responsaveis.funcao,
      responsavelRegistroProfissional: responsaveis.registroProfissional,
    })
    .from(ordensServico)
    .leftJoin(empresas, eq(ordensServico.empresaId, empresas.id))
    .leftJoin(colaboradores, eq(ordensServico.colaboradorId, colaboradores.id))
    .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
    .leftJoin(responsaveis, eq(ordensServico.responsavelId, responsaveis.id))
    .where(and(...conditions))
    .limit(1);
    
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
    console.log("[createOrdemServico] Criando ordem com dados:", { ...data, descricaoServico: data.descricaoServico?.substring(0, 50) + "..." });
    const result = await db.insert(ordensServico).values(data);
    const insertId = (result as any)[0]?.insertId;
    console.log("[createOrdemServico] Ordem criada com ID:", insertId, "tenantId:", data.tenantId);
    if (insertId) {
      // Passar tenantId para getOrdemServicoById para garantir que encontre a ordem recém-criada
      return await getOrdemServicoById(insertId, data.tenantId);
    }
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

export async function getAllModelosOrdemServico(tenantId: number | null, empresaId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [];
    
    // FILTRO POR TENANT (obrigatório)
    if (tenantId) {
      conditions.push(eq(modelosOrdemServico.tenantId, tenantId));
    }
    
    // Filtro opcional por empresa
    if (empresaId) {
      conditions.push(eq(modelosOrdemServico.empresaId, empresaId));
    }
    
    let query = db.select().from(modelosOrdemServico);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(modelosOrdemServico.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao buscar modelos de ordem de serviço:", error);
    throw error;
  }
}

export async function getModeloOrdemServicoById(id: number, tenantId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const conditions: any[] = [eq(modelosOrdemServico.id, id)];
    
    // ISOLAMENTO DE TENANT: Verificar se o modelo pertence ao tenant
    if (tenantId !== undefined && tenantId !== null) {
      conditions.push(eq(modelosOrdemServico.tenantId, tenantId));
    }
    
    const result = await db.select().from(modelosOrdemServico).where(and(...conditions)).limit(1);
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
    console.log(`[Database] Criando ASO para tenantId: ${data.tenantId}, colaboradorId: ${data.colaboradorId}, tipo: ${data.tipoAso}`);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataValidade = new Date(data.dataValidade);
    dataValidade.setHours(0, 0, 0, 0);

    const asoData = {
      ...data,
      status: dataValidade < hoje ? ("vencido" as const) : ("ativo" as const),
    };

    console.log(`[Database] Dados do ASO:`, {
      tenantId: asoData.tenantId,
      colaboradorId: asoData.colaboradorId,
      empresaId: asoData.empresaId,
      tipoAso: asoData.tipoAso,
      status: asoData.status,
      dataValidade: asoData.dataValidade,
    });

    const result: any = await db.insert(asos).values(asoData);
    const insertId = result?.insertId ?? (Array.isArray(result) ? result[0]?.insertId : undefined);
    console.log(`[Database] ASO criado com ID: ${insertId}`);
    if (insertId) {
      await refreshColaboradorAsoSnapshot(data.tenantId, data.colaboradorId);
      const asoCriado = await getAsoById(insertId);
      console.log(`[Database] ASO recuperado após criação:`, asoCriado ? `ID ${asoCriado.id}, Status: ${asoCriado.status}` : "não encontrado");
      return asoCriado;
    }
    console.warn(`[Database] ASO criado mas insertId não encontrado no resultado:`, result);
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
  tenantId?: number | null;
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

    // FILTRO POR TENANT (obrigatório para não-admins)
    // Se tenantId for null, é admin/super_admin e pode ver TODOS os ASOs (não filtra)
    if (filters?.tenantId !== null && filters?.tenantId !== undefined) {
      conditions.push(eq(asos.tenantId, filters.tenantId));
      console.log("[getAllAsos] 🔒 Filtrando por tenantId:", filters.tenantId);
    } else {
      console.log("[getAllAsos] 👑 Admin - Sem filtro de tenant (vê todos os ASOs)");
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

    return await query.orderBy(asc(asos.numeroAso));
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
    console.log(`[Dashboard ASOs] Buscando dashboard para tenantId: ${tenantId}`);
    
    // Buscar colaboradores do tenant
    const colaboradoresRows = await db
      .select({ id: colaboradores.id })
      .from(colaboradores)
      .where(eq(colaboradores.tenantId, tenantId));

    const totalColaboradores = colaboradoresRows.length;
    const colaboradoresIds = new Set(colaboradoresRows.map((c) => c.id));
    
    console.log(`[Dashboard ASOs] Total de colaboradores encontrados para tenantId ${tenantId}: ${totalColaboradores}`);

    // Se não há colaboradores, retornar dados vazios
    if (totalColaboradores === 0) {
      console.log(`[Dashboard ASOs] Nenhum colaborador encontrado, retornando dados vazios`);
      return {
        totalAsos: 0,
        totalAtivos: 0,
        totalVencidos: 0,
        totalAVencer30: 0,
        totalAVencer5: 0,
        cobertura: {
          totalColaboradores: 0,
          colaboradoresCobertos: 0,
          colaboradoresSemAso: 0,
          percentual: 0,
        },
        porTipo: [],
        vencimentosPorMes: [],
        topEmpresasVencidos: [],
        proximosVencimentos: [],
        asosVencidosRecentes: [],
        ultimaAtualizacao: new Date().toISOString(),
      };
    }

    // Buscar ASOs do tenant e que tenham colaboradores existentes
    const todosRegistros = await db
      .select()
      .from(asos)
      .where(eq(asos.tenantId, tenantId));
    
    console.log(`[Dashboard ASOs] Total de ASOs encontrados no banco para tenantId ${tenantId}: ${todosRegistros.length}`);
    
    const registros = todosRegistros.filter((aso) => 
      aso.colaboradorId && colaboradoresIds.has(aso.colaboradorId)
    );
    console.log(`[Dashboard ASOs] ASOs válidos (com colaboradores existentes): ${registros.length}`);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dayMs = 1000 * 60 * 60 * 24;
    type RegistroAso = typeof registros[number];

    const total = registros.length;
    const totalAtivos = registros.filter((item: RegistroAso) => item.status === "ativo").length;
    const totalVencidos = registros.filter((item: RegistroAso) => item.status === "vencido").length;
    
    console.log(`[Dashboard ASOs] Métricas calculadas: Total=${total}, Ativos=${totalAtivos}, Vencidos=${totalVencidos}`);

    const setCobertos = new Set<number>();
    registros.forEach((item: RegistroAso) => {
      if (item.dataValidade && item.colaboradorId) {
        const validade = new Date(item.dataValidade);
        validade.setHours(0, 0, 0, 0);
        if (validade >= hoje) {
          setCobertos.add(item.colaboradorId);
        }
      }
    });

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

    // Buscar nomes das empresas para topEmpresasVencidos
    const empresasMap = new Map<number, string>();
    const empresasIds = new Set(registros.map((r) => r.empresaId).filter((id): id is number => id !== null));
    if (empresasIds.size > 0) {
      const empresasList = await db
        .select({ id: empresas.id, razaoSocial: empresas.razaoSocial })
        .from(empresas)
        .where(inArray(empresas.id, Array.from(empresasIds)));
      empresasList.forEach((empresa) => {
        empresasMap.set(empresa.id, empresa.razaoSocial);
      });
    }

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
        empresaNome: empresasMap.get(empresaId) || null,
        total,
      }));

    // Buscar nomes dos colaboradores para proximosVencimentos e asosVencidosRecentes
    const colaboradoresMap = new Map<number, string>();
    if (colaboradoresRows.length > 0) {
      const colaboradoresCompleto = await db
        .select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto })
        .from(colaboradores)
        .where(inArray(colaboradores.id, Array.from(colaboradoresIds)));
      colaboradoresCompleto.forEach((colab) => {
        colaboradoresMap.set(colab.id, colab.nomeCompleto || "N/A");
      });
    }

    const proximosVencimentos = registros
      .filter((item: RegistroAso) => {
        if (!item.dataValidade || !item.colaboradorId) return false;
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
        colaboradorNome: item.colaboradorId ? colaboradoresMap.get(item.colaboradorId) || null : null,
        empresaId: item.empresaId,
        empresaNome: item.empresaId ? empresasMap.get(item.empresaId) || null : null,
      }));

    const asosVencidosRecentes = registros
      .filter((item: RegistroAso) => {
        if (!item.dataValidade || !item.colaboradorId) return false;
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
        colaboradorNome: item.colaboradorId ? colaboradoresMap.get(item.colaboradorId) || null : null,
        empresaId: item.empresaId,
        empresaNome: item.empresaId ? empresasMap.get(item.empresaId) || null : null,
      }));

    const totalAVencer30 = registros.filter((item: RegistroAso) => {
      if (!item.dataValidade || !item.colaboradorId) return false;
      const validade = new Date(item.dataValidade);
      validade.setHours(0, 0, 0, 0);
      const diff = Math.round((validade.getTime() - hoje.getTime()) / dayMs);
      return diff >= 0 && diff <= 30;
    }).length;

    const totalAVencer5 = registros.filter((item: RegistroAso) => {
      if (!item.dataValidade || !item.colaboradorId) return false;
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

/**
 * Sincroniza ASOs dos colaboradores - cria ASOs na tabela asos baseado nos dados dos colaboradores
 * que têm dataPrimeiroAso e validadeAso mas não têm ASO cadastrado
 */
export async function syncAsosFromColaboradores(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log(`[Sync ASOs] Iniciando sincronização para tenantId: ${tenantId}`);
    
    // Buscar TODOS os colaboradores que têm dataPrimeiroAso e validadeAso
    // Não filtrar por tenantId para garantir que todos sejam processados
    const colaboradoresComAso = await db
      .select({
        id: colaboradores.id,
        tenantId: colaboradores.tenantId,
        empresaId: colaboradores.empresaId,
        dataPrimeiroAso: colaboradores.dataPrimeiroAso,
        validadeAso: colaboradores.validadeAso,
      })
      .from(colaboradores)
      .where(
        and(
          sql`${colaboradores.dataPrimeiroAso} IS NOT NULL`,
          sql`${colaboradores.validadeAso} IS NOT NULL`
        )
      );

    console.log(`[Sync ASOs] Encontrados ${colaboradoresComAso.length} colaboradores com dados de ASO`);

    let asosCriados = 0;
    let asosJaExistentes = 0;
    let erros = 0;

    // Para cada colaborador, verificar se já tem ASO e criar se não tiver
    for (const colab of colaboradoresComAso) {
      try {
        // Verificar se já existe ASO para este colaborador
        // Verificar por colaboradorId apenas, não por datas exatas (pode ter múltiplos ASOs)
        const asosExistentes = await db
          .select()
          .from(asos)
          .where(eq(asos.colaboradorId, colab.id));

        // Se já tem ASO, pular (não criar duplicado)
        if (asosExistentes.length > 0) {
          asosJaExistentes++;
          continue;
        }

        // Criar ASO baseado nos dados do colaborador
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataValidade = new Date(colab.validadeAso);
        dataValidade.setHours(0, 0, 0, 0);

        const asoData: InsertAso = {
          tenantId: colab.tenantId || tenantId,
          colaboradorId: colab.id,
          empresaId: colab.empresaId,
          numeroAso: null,
          tipoAso: "admissional", // Tipo padrão
          dataEmissao: colab.dataPrimeiroAso,
          dataValidade: colab.validadeAso,
          medicoResponsavel: null,
          clinicaMedica: null,
          crmMedico: null,
          apto: "sim", // Padrão
          restricoes: null,
          observacoes: "ASO sincronizado automaticamente dos dados do colaborador",
          anexoUrl: null,
          status: dataValidade < hoje ? "vencido" : "ativo",
        };

        await db.insert(asos).values(asoData);
        asosCriados++;

        // Atualizar snapshot do colaborador
        await refreshColaboradorAsoSnapshot(colab.tenantId || tenantId, colab.id);
      } catch (error) {
        console.error(`[Sync ASOs] Erro ao criar ASO para colaborador ${colab.id}:`, error);
        erros++;
      }
    }

    console.log(`[Sync ASOs] Sincronização concluída: ${asosCriados} criados, ${asosJaExistentes} já existentes, ${erros} erros`);

    return {
      totalColaboradores: colaboradoresComAso.length,
      asosCriados,
      asosJaExistentes,
      erros,
    };
  } catch (error) {
    console.error("[Database] Erro ao sincronizar ASOs dos colaboradores:", error);
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

// === TENANTS (ADMIN) ===

/**
 * Cria um novo tenant (cliente/sistema)
 */
export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(tenants).values(data);
    const insertId = (result as any)[0]?.insertId;
    
    if (insertId) {
      return await getTenantById(insertId);
    }
    
    throw new Error("Erro ao criar tenant");
  } catch (error) {
    console.error("[Database] Erro ao criar tenant:", error);
    throw error;
  }
}

/**
 * Lista todos os tenants (apenas para admin)
 */
export async function getAllTenants() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const tenantsList = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    
    // Buscar estatísticas de cada tenant
    const tenantsWithStats = await Promise.all(
      tenantsList.map(async (tenant) => {
        const [usersCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.tenantId, tenant.id));

        const [empresasCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(empresas)
          .where(eq(empresas.tenantId, tenant.id));

        const [colaboradoresCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(colaboradores)
          .where(eq(colaboradores.tenantId, tenant.id));

        return {
          ...tenant,
          stats: {
            usuarios: Number(usersCount?.count || 0),
            empresas: Number(empresasCount?.count || 0),
            colaboradores: Number(colaboradoresCount?.count || 0),
          },
        };
      })
    );

    return tenantsWithStats;
  } catch (error) {
    console.error("[Database] Erro ao listar tenants:", error);
    throw error;
  }
}

/**
 * Atualiza o plano de um tenant
 */
export async function updateTenantPlano(tenantId: number, novoPlano: string, valorPlano?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = {
      plano: novoPlano as any,
      updatedAt: new Date(),
    };
    
    if (valorPlano) {
      updateData.valorPlano = valorPlano;
    }

    await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atualizar plano do tenant:", error);
    throw error;
  }
}

/**
 * Atualiza informações de pagamento de um tenant
 */
export async function updateTenantPagamento(
  tenantId: number,
  dataUltimoPagamento?: Date,
  dataProximoPagamento?: Date,
  statusPagamento?: string,
  valorPlano?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (dataUltimoPagamento !== undefined) {
      updateData.dataUltimoPagamento = dataUltimoPagamento;
    }
    if (dataProximoPagamento !== undefined) {
      updateData.dataProximoPagamento = dataProximoPagamento;
    }
    if (statusPagamento) {
      updateData.statusPagamento = statusPagamento as any;
    }
    if (valorPlano) {
      updateData.valorPlano = valorPlano;
    }

    await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atualizar pagamento do tenant:", error);
    throw error;
  }
}

/**
 * Atualiza informações de contato de um tenant
 */
export async function updateTenantContato(
  tenantId: number,
  nome?: string,
  email?: string,
  telefone?: string,
  cpf?: string,
  cnpj?: string,
  observacoes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;
    if (telefone) updateData.telefone = telefone;
    if (cpf) updateData.cpf = cpf;
    if (cnpj) updateData.cnpj = cnpj;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atualizar contato do tenant:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um tenant
 */
export async function updateTenantStatus(tenantId: number, novoStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(tenants)
      .set({
        status: novoStatus as any,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atualizar status do tenant:", error);
    throw error;
  }
}

/**
 * Atualiza as datas de um tenant
 */
export async function updateTenantDates(tenantId: number, dataInicio: Date, dataFim?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(tenants)
      .set({
        dataInicio: dataInicio,
        dataFim: dataFim || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Erro ao atualizar datas do tenant:", error);
    throw error;
  }
}

/**
 * Obtém detalhes de um tenant específico
 */
export async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    // Buscar estatísticas
    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    const [empresasCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(empresas)
      .where(eq(empresas.tenantId, tenantId));

    const [colaboradoresCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(colaboradores)
      .where(eq(colaboradores.tenantId, tenantId));

    return {
      ...tenant,
      stats: {
        usuarios: Number(usersCount?.count || 0),
        empresas: Number(empresasCount?.count || 0),
        colaboradores: Number(colaboradoresCount?.count || 0),
      },
    };
  } catch (error) {
    console.error("[Database] Erro ao buscar tenant:", error);
    throw error;
  }
}

