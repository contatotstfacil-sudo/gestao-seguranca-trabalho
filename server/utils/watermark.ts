/**
 * Sistema de watermarking e rastreamento para proteção contra cópia
 */

import crypto from "crypto";

/**
 * Gera watermark único para cada instalação
 */
export function generateInstallationId(): string {
  // Gera ID único baseado em informações do sistema
  const machineId = process.env.MACHINE_ID || 
    crypto.createHash("sha256")
      .update(process.platform + process.arch + (process.env.COMPUTERNAME || ""))
      .digest("hex")
      .substring(0, 16);
  
  return `INST-${machineId}`;
}

/**
 * Adiciona watermark invisível em respostas JSON
 */
export function addWatermark(data: any, userId?: number): any {
  if (typeof data !== "object" || data === null) return data;
  
  // Adiciona marca d'água invisível
  const watermark = {
    _t: Date.now(), // timestamp
    _i: generateInstallationId(), // installation ID
    _u: userId || null, // user ID
  };
  
  // Adiciona como propriedade não enumerável
  Object.defineProperty(data, "__w", {
    value: watermark,
    enumerable: false,
    writable: false,
    configurable: false
  });
  
  return data;
}

/**
 * Valida origem de requisições suspeitas
 */
export function validateRequestOrigin(req: any): boolean {
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  
  // Em desenvolvimento, permite tudo
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  
  // Lista de origens permitidas
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",")
    .map(o => o.trim())
    .filter(o => o.length > 0);
  
  if (allowedOrigins.length === 0) {
    // Se não configurado, valida contra host
    try {
      if (origin) {
        const originUrl = new URL(origin);
        return originUrl.hostname === host?.split(":")[0];
      }
    } catch {
      return false;
    }
  } else {
    // Valida contra lista de origens permitidas
    return allowedOrigins.some(allowed => {
      if (!origin) return false;
      try {
        const originUrl = new URL(origin);
        return originUrl.hostname.includes(allowed.replace(/^https?:\/\//, "").split("/")[0]);
      } catch {
        return false;
      }
    });
  }
  
  return true;
}

/**
 * Detecta tentativas de cópia/clonagem do sistema
 */
export function detectCloneAttempt(req: any): boolean {
  // Verifica headers suspeitos
  const suspiciousHeaders = [
    "x-clone-attempt",
    "x-copy-request",
    "x-scrape-data"
  ];
  
  const hasSuspiciousHeader = suspiciousHeaders.some(header => req.headers[header.toLowerCase()]);
  
  // Verifica se está tentando acessar endpoints sensíveis sem autenticação
  const sensitiveEndpoints = ["/api/trpc/system", "/api/trpc/db"];
  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => req.path?.includes(endpoint));
  
  // Verifica padrões de requisição suspeitos
  const suspiciousPatterns = [
    /\/api\/trpc\/.*\.list/i, // Tentando listar tudo
    /\/api\/trpc\/.*\.getAll/i, // Tentando pegar tudo
    /\/api\/trpc\/.*\.export/i, // Tentando exportar
  ];
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(req.path || ""));
  
  return hasSuspiciousHeader || (isSensitiveEndpoint && !req.user);
}

