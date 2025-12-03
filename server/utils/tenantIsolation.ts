/**
 * Utilitários para garantir isolamento de dados por tenant
 * Este módulo centraliza a lógica de isolamento para evitar vazamento de dados entre tenants
 */

import type { User } from "../../drizzle/schema";

/**
 * Obtém o tenantId correto baseado no role do usuário
 * - admin/super_admin/tenant_admin: podem ver todos (retorna null)
 * - outros: devem ter tenantId obrigatório
 */
export function getTenantIdForQuery(user: User): number | null {
  // Admin/super_admin/tenant_admin podem ver todos os tenants
  if (user.role === "admin" || user.role === "super_admin" || user.role === "tenant_admin") {
    return null; // null = sem filtro (vê todos)
  }
  
  // Outros usuários DEVEM ter tenantId
  return user.tenantId || null;
}

/**
 * Valida se o usuário tem permissão para acessar dados de um tenant específico
 * @throws Error se o usuário não tiver permissão
 */
export function validateTenantAccess(user: User, resourceTenantId: number | null): void {
  // Admin/super_admin/tenant_admin podem acessar qualquer tenant
  if (user.role === "admin" || user.role === "super_admin" || user.role === "tenant_admin") {
    return; // Permite acesso
  }
  
  // Usuários comuns DEVEM ter tenantId e deve corresponder ao recurso
  if (!user.tenantId) {
    throw new Error("Usuário não associado a um tenant. Acesso negado.");
  }
  
  if (resourceTenantId !== null && user.tenantId !== resourceTenantId) {
    throw new Error("Acesso negado. Recurso pertence a outro tenant.");
  }
}

/**
 * Valida se o usuário pode criar recursos (deve ter tenantId, exceto admins)
 * @throws Error se o usuário não puder criar recursos
 */
export function validateTenantForCreation(user: User): number {
  // Admin/super_admin/tenant_admin podem criar sem tenantId (mas geralmente não devem)
  if (user.role === "admin" || user.role === "super_admin" || user.role === "tenant_admin") {
    // Se tiver tenantId, usar; senão permitir null (mas não recomendado)
    return user.tenantId || null as any;
  }
  
  // Usuários comuns DEVEM ter tenantId para criar recursos
  if (!user.tenantId) {
    throw new Error("Usuário não associado a um tenant. Não é possível criar recursos.");
  }
  
  return user.tenantId;
}

/**
 * Garante que um novo usuário receba o tenantId correto ao ser criado
 * Se o criador for admin, o novo usuário pode herdar o tenantId do criador ou receber um específico
 */
export function getTenantIdForNewUser(creator: User, providedTenantId?: number | null): number | null {
  // Se foi fornecido um tenantId específico, usar
  if (providedTenantId !== undefined && providedTenantId !== null) {
    return providedTenantId;
  }
  
  // Se o criador for admin/super_admin, pode criar sem tenantId (mas não recomendado)
  if (creator.role === "admin" || creator.role === "super_admin" || creator.role === "tenant_admin") {
    return null; // Admin pode criar usuários sem tenantId
  }
  
  // Caso contrário, herdar o tenantId do criador
  return creator.tenantId || null;
}





