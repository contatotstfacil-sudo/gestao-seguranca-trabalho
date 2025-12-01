/**
 * Middleware de Isolamento de Tenant
 * 
 * Garante que usuários só acessem dados do seu próprio tenant
 * Super admins não têm tenantId e não podem acessar dados de clientes
 */

import { User } from "../../drizzle/schema";

/**
 * Garante que o usuário tenha um tenantId
 * Super admins não têm tenantId e não podem acessar dados de clientes
 * 
 * @throws Error se o usuário não tiver tenantId ou for super_admin tentando acessar dados
 */
export function requireTenant(user: User): number {
  // Super admin não pode acessar dados de tenants
  if (user.role === "super_admin") {
    throw new Error("Super admin não pode acessar dados de tenants. Use o painel de administração.");
  }
  
  // Usuário deve ter tenantId
  if (!user.tenantId) {
    throw new Error("Usuário não possui tenant associado. Entre em contato com o suporte.");
  }
  
  return user.tenantId;
}

/**
 * Valida que um registro pertence ao tenant do usuário
 * 
 * @throws Error se o registro não pertencer ao tenant do usuário
 */
export function validateTenantAccess(
  user: User,
  recordTenantId: number | null | undefined
): void {
  const userTenantId = requireTenant(user);
  
  if (recordTenantId === null || recordTenantId === undefined) {
    throw new Error("Registro não possui tenant associado");
  }
  
  if (recordTenantId !== userTenantId) {
    throw new Error("Acesso negado: registro não pertence ao seu tenant");
  }
}

/**
 * Verifica se o usuário é super admin
 */
export function isSuperAdmin(user: User): boolean {
  return user.role === "super_admin";
}

/**
 * Verifica se o usuário é tenant admin
 */
export function isTenantAdmin(user: User): boolean {
  return user.role === "tenant_admin";
}

/**
 * Verifica se o usuário pode gerenciar o tenant
 */
export function canManageTenant(user: User, tenantId: number | null): boolean {
  // Super admin pode gerenciar qualquer tenant
  if (isSuperAdmin(user)) {
    return true;
  }
  
  // Tenant admin só pode gerenciar seu próprio tenant
  if (isTenantAdmin(user)) {
    return user.tenantId === tenantId;
  }
  
  return false;
}















