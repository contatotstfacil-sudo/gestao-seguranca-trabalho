import { eq, and, gte, lte, desc, sql, asc, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

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

import bcrypt from "bcryptjs";
import { normalizeCPF, normalizeCNPJ, isValidCPF, isValidCNPJ } from "./utils/validation";
import { ENV } from "./_core/env";

dotenv.config();

let _db: any = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(_pool);
      console.log("[Database] Connected successfully to PostgreSQL (Neon)");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

