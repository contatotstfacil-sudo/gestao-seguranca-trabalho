/**
 * Sistema de Limitações por Plano
 * Define as restrições e funcionalidades disponíveis para cada plano
 */

export type PlanoType = "bronze" | "prata" | "ouro" | "diamante";

export interface PlanoLimits {
  // Limites de quantidade
  maxEmpresas: number; // -1 = ilimitado
  maxColaboradores: number; // Por empresa, -1 = ilimitado
  maxObras: number; // -1 = ilimitado
  maxTreinamentos: number; // -1 = ilimitado
  maxEpis: number; // -1 = ilimitado
  maxCargos: number; // -1 = ilimitado
  maxSetores: number; // -1 = ilimitado
  
  // Funcionalidades disponíveis
  permiteGestaoAsos: boolean; // Gestão de ASOs
  permiteLaudosOcupacionais: boolean; // Laudos LTCat, insalubridade, periculosidade
  permiteOrdemServico: boolean; // Ordem de Serviço
  permiteRelatoriosAvancados: boolean; // Relatórios avançados
  permiteExportacao: boolean; // Exportação de dados
  permiteIntegracao: boolean; // API de integração
  
  // Prazos e validades
  diasValidadeAso: number; // Dias de validade padrão para ASO
  diasValidadeTreinamento: number; // Dias de validade padrão para treinamentos
  diasValidadeEpi: number; // Dias de validade padrão para EPIs
  
  // Limites de upload
  maxTamanhoAnexo: number; // MB
  
  // Suporte
  suportePrioritario: boolean; // Suporte prioritário (ticket, chat)
  suporteWhatsapp: boolean; // Suporte por WhatsApp
}

export const PLANO_LIMITS: Record<PlanoType, PlanoLimits> = {
  bronze: {
    maxEmpresas: 5,
    maxColaboradores: 20, // Por empresa
    maxObras: -1, // Não especificado na tabela
    maxTreinamentos: -1, // Não especificado na tabela
    maxEpis: -1, // Não especificado na tabela
    maxCargos: -1, // Não especificado na tabela
    maxSetores: -1, // Não especificado na tabela
    permiteGestaoAsos: true, // Funcionalidades básicas
    permiteLaudosOcupacionais: false, // Laudos avançados não permitidos
    permiteOrdemServico: false, // Não mencionado
    permiteRelatoriosAvancados: false, // Não mencionado
    permiteExportacao: false, // Não mencionado
    permiteIntegracao: false, // Não mencionado
    diasValidadeAso: 30,
    diasValidadeTreinamento: 180,
    diasValidadeEpi: 365,
    maxTamanhoAnexo: 5, // 5MB
    suportePrioritario: false, // Suporte por email apenas
    suporteWhatsapp: false,
  },
  prata: {
    maxEmpresas: 10,
    maxColaboradores: 30, // Por empresa
    maxObras: -1,
    maxTreinamentos: -1,
    maxEpis: -1,
    maxCargos: -1,
    maxSetores: -1,
    permiteGestaoAsos: true, // Tudo do Bronze
    permiteLaudosOcupacionais: true, // Laudos LTCat, insalubridade e periculosidade ilimitados
    permiteOrdemServico: true, // Incluído nas funcionalidades
    permiteRelatoriosAvancados: true, // Relatórios avançados
    permiteExportacao: true, // Incluído
    permiteIntegracao: true, // API de integração
    diasValidadeAso: 30,
    diasValidadeTreinamento: 365,
    diasValidadeEpi: 730,
    maxTamanhoAnexo: 10, // 10MB
    suportePrioritario: true, // Suporte por ticket e chat
    suporteWhatsapp: false,
  },
  ouro: {
    maxEmpresas: -1, // Ilimitado
    maxColaboradores: -1, // Ilimitado
    maxObras: -1, // Ilimitado
    maxTreinamentos: -1, // Ilimitado
    maxEpis: -1, // Ilimitado
    maxCargos: -1, // Ilimitado
    maxSetores: -1, // Ilimitado
    permiteGestaoAsos: true, // Tudo do Ouro + Prata + Bronze
    permiteLaudosOcupacionais: true, // Laudos ilimitados
    permiteOrdemServico: true,
    permiteRelatoriosAvancados: true,
    permiteExportacao: true,
    permiteIntegracao: true,
    diasValidadeAso: 30,
    diasValidadeTreinamento: 1095,
    diasValidadeEpi: 1825,
    maxTamanhoAnexo: 50, // 50MB
    suportePrioritario: true, // Suporte por chat, ticket e WhatsApp + Gerente dedicado
    suporteWhatsapp: true,
  },
  diamante: {
    maxEmpresas: -1, // Ilimitado
    maxColaboradores: -1, // Ilimitado
    maxObras: -1, // Ilimitado
    maxTreinamentos: -1, // Ilimitado
    maxEpis: -1, // Ilimitado
    maxCargos: -1, // Ilimitado
    maxSetores: -1, // Ilimitado
    permiteGestaoAsos: true,
    permiteLaudosOcupacionais: true,
    permiteOrdemServico: true,
    permiteRelatoriosAvancados: true,
    permiteExportacao: true,
    permiteIntegracao: true,
    diasValidadeAso: 30,
    diasValidadeTreinamento: 1095,
    diasValidadeEpi: 1825,
    maxTamanhoAnexo: 50, // 50MB
    suportePrioritario: true,
    suporteWhatsapp: true,
  },
};

/**
 * Obtém as limitações do plano do tenant
 */
export async function getTenantPlanLimits(tenantId: number | null): Promise<PlanoLimits | null> {
  if (!tenantId) return null;
  
  try {
    const { getTenantById } = await import("../db");
    const tenant = await getTenantById(tenantId);
    
    if (!tenant || !tenant.plano) return null;
    
    return PLANO_LIMITS[tenant.plano as PlanoType] || PLANO_LIMITS.bronze;
  } catch (error) {
    console.error("[PlanLimits] Erro ao obter limites do plano:", error);
    return null;
  }
}

/**
 * Verifica se uma quantidade está dentro do limite
 */
export function checkQuantityLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // Ilimitado
  return current < limit;
}

/**
 * Verifica se uma funcionalidade está disponível no plano
 */
export function checkFeatureAvailable(limits: PlanoLimits | null, feature: keyof Pick<PlanoLimits, 'permiteGestaoAsos' | 'permiteLaudosOcupacionais' | 'permiteOrdemServico' | 'permiteRelatoriosAvancados' | 'permiteExportacao' | 'permiteIntegracao'>): boolean {
  if (!limits) return false;
  return limits[feature] === true;
}

/**
 * Gera mensagem quando o limite do plano é atingido
 */
export function getLimitMessage(
  resourceType: 'empresas' | 'colaboradores' | 'obras' | 'treinamentos' | 'epis' | 'cargos' | 'setores',
  currentCount: number,
  limit: number,
  isPerCompany: boolean = false
): string {
  return `Você chegou no limite.`;
}

/**
 * Gera mensagem quando uma funcionalidade não está disponível no plano
 */
export function getFeatureUnavailableMessage(featureName: string, requiredPlan?: string): string {
  return `Você chegou no limite.`;
}

