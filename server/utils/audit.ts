/**
 * Sistema de auditoria para rastrear ações críticas
 */

import * as db from "../db";

export interface AuditLog {
  userId: number | null;
  action: string;
  resource: string;
  resourceId?: number;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Registra evento de auditoria
 */
export async function logAudit(auditLog: AuditLog) {
  try {
    // Por enquanto, apenas log no console
    // TODO: Criar tabela de auditoria no banco de dados
    console.log("[AUDIT]", JSON.stringify({
      ...auditLog,
      timestamp: auditLog.timestamp.toISOString()
    }));
    
    // Em produção, salvar em banco de dados
    // await db.createAuditLog(auditLog);
  } catch (error) {
    console.error("[AUDIT] Erro ao registrar log:", error);
  }
}

/**
 * Ações auditadas
 */
export const AuditActions = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
  DATA_EXPORT: "DATA_EXPORT",
  DATA_DELETE: "DATA_DELETE",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  SENSITIVE_DATA_ACCESS: "SENSITIVE_DATA_ACCESS",
} as const;


