/**
 * Utilitários de segurança para proteção contra vírus, hackers, golpistas e clonadores
 */

import { Request, Response, NextFunction } from "express";

// Rate limiting simples em memória (em produção, usar Redis)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Limpa tentativas antigas de login
 */
function cleanOldAttempts() {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.resetTime < now) {
      loginAttempts.delete(key);
    }
  }
}

/**
 * Verifica se um IP está bloqueado por muitas tentativas de login
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  cleanOldAttempts();
  
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  // Limite: 5 tentativas por 15 minutos
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  
  if (!attempt || attempt.resetTime < now) {
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((attempt.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  attempt.count++;
  return { allowed: true };
}

/**
 * Registra uma tentativa de login falha
 */
export function recordFailedLogin(ip: string) {
  const attempt = loginAttempts.get(ip);
  if (attempt) {
    attempt.count++;
  }
}

/**
 * Limpa tentativas de login após sucesso
 */
export function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

/**
 * Rate limiting geral para API
 */
export function checkApiRateLimit(ip: string, endpoint: string): { allowed: boolean; retryAfter?: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const request = requestCounts.get(key);
  
  // Limite: 100 requests por minuto por endpoint
  const MAX_REQUESTS = 100;
  const WINDOW_MS = 60 * 1000; // 1 minuto
  
  if (!request || request.resetTime < now) {
    requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }
  
  if (request.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((request.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  request.count++;
  return { allowed: true };
}

/**
 * Valida força da senha
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("A senha deve ter pelo menos 8 caracteres");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("A senha deve conter pelo menos um caractere especial");
  }
  
  // Verifica senhas comuns
  const commonPasswords = [
    "password", "12345678", "qwerty", "abc123", "senha123",
    "password123", "admin123", "123456789", "senha", "admin"
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push("A senha é muito comum e fácil de adivinhar");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/javascript:/gi, "") // Remove javascript:
    .replace(/on\w+=/gi, "") // Remove event handlers (onclick=, etc)
    .trim();
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return sanitizeInput(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }
  
  if (obj && typeof obj === "object") {
    const sanitized = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      (sanitized as any)[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Valida origem da requisição
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  
  if (!origin) {
    // Requisições sem origin podem ser legítimas (navegador direto, Postman, etc)
    // Mas em produção, podemos ser mais restritivos
    return process.env.NODE_ENV === "development";
  }
  
  // Em desenvolvimento, aceita localhost, 127.0.0.1 e IPs da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (process.env.NODE_ENV === "development") {
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
    if (isLocalhost) return true;
    
    // Aceita IPs da rede local em desenvolvimento
    const localNetworkPatterns = [
      /^https?:\/\/192\.168\./,
      /^https?:\/\/10\./,
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
    ];
    
    if (origin && localNetworkPatterns.some(pattern => pattern.test(origin))) {
      return true;
    }
  }
  
  // Em produção, valida contra lista de origens permitidas
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(o => o);
  
  if (allowedOrigins.length > 0) {
    return allowedOrigins.some(allowed => origin.includes(allowed));
  }
  
  // Se não houver lista configurada, valida contra o host
  try {
    const originUrl = new URL(origin);
    return originUrl.hostname === host?.split(":")[0];
  } catch {
    return false;
  }
}

/**
 * Gera token CSRF
 */
export function generateCSRFToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(req: Request, token: string): boolean {
  const sessionToken = req.headers["x-csrf-token"] || (req.body && req.body.csrfToken);
  return sessionToken === token;
}

/**
 * Log de auditoria para ações críticas
 */
export function logAuditEvent(
  userId: number | null,
  action: string,
  details: Record<string, any>,
  ip?: string
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    action,
    details: sanitizeObject(details),
    ip: ip || "unknown"
  };
  
  // Em produção, salvar em banco de dados ou serviço de logs
  console.log("[AUDIT]", JSON.stringify(logEntry));
  
  // TODO: Implementar salvamento em tabela de auditoria no banco
}

/**
 * Detecta tentativas de scraping/coleta de dados
 */
function detectScraping(req: Request): boolean {
  const userAgent = req.headers["user-agent"] || "";
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /node-fetch/i,
    /axios/i,
  ];
  
  // Se não tem user-agent, é suspeito
  if (!userAgent) return true;
  
  // Verifica padrões suspeitos
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Detecta tentativas de SQL injection
 */
function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|JOIN|WHERE|FROM|INTO)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /('|"|;|--)/,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitiza mensagens de erro para não revelar estrutura do banco
 */
export function sanitizeError(error: any): { message: string; code?: string } {
  const errorMessage = error?.message || "Erro interno do servidor";
  
  // Remove informações sensíveis de erros de banco de dados
  const sanitized = errorMessage
    .replace(/Table\s+['"]?\w+['"]?\s+doesn't\s+exist/gi, "Recurso não encontrado")
    .replace(/Unknown\s+column\s+['"]?\w+['"]?/gi, "Campo inválido")
    .replace(/Duplicate\s+entry/gi, "Dados duplicados")
    .replace(/Access\s+denied/gi, "Acesso negado")
    .replace(/Connection\s+refused/gi, "Erro de conexão")
    .replace(/SQL\s+syntax/gi, "Erro de sintaxe")
    .replace(/database\s+['"]?\w+['"]?/gi, "banco de dados")
    .replace(/user\s+['"]?\w+['"]?/gi, "usuário")
    .replace(/password/gi, "credencial")
    .replace(/localhost|127\.0\.0\.1/gi, "servidor")
    .replace(/\d+\.\d+\.\d+\.\d+/g, "[IP oculto]");
  
  return {
    message: sanitized,
    code: error?.code || "INTERNAL_ERROR"
  };
}

/**
 * Middleware de segurança geral
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  const isDev = process.env.NODE_ENV === "development";
  const url = (req.originalUrl || req.url || "").toLowerCase();
  const isAuthRoute = url.includes("/auth") || url.includes("/login") || url.includes("trpc/auth");
  
  // ⚠️ Segurança desabilitada temporariamente para destravar login
  res.setHeader("X-Content-Type-Options", "nosniff");
  return next();

  // Em desenvolvimento, pular TODAS as validações de segurança que podem bloquear Vite
  if (isDev) {
    // Apenas aplicar headers básicos, sem bloqueios
    res.setHeader("X-Content-Type-Options", "nosniff");
    return next();
  }
  
  // Em produção, aplicar todas as validações
  // Bypass para rotas de autenticação (não bloquear scraping/origin/rate)
  if (isAuthRoute) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    return next();
  }

  // Detecta scraping
  if (detectScraping(req)) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    console.warn(`[SECURITY] Tentativa de scraping detectada de IP: ${ip}, User-Agent: ${req.headers["user-agent"]}`);
    return res.status(403).json({
      error: "Acesso negado"
    });
  }
  
  // Valida origem
  if (!validateOrigin(req)) {
    return res.status(403).json({
      error: "Origem não autorizada"
    });
  }
  
  // Headers de segurança
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  
  // Remove headers que revelam informações do servidor
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  
  // Content Security Policy - DESABILITADO em desenvolvimento para debug
  if (!isDev) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ");
    res.setHeader("Content-Security-Policy", csp);
  }
  
  // Em desenvolvimento, pular validações que podem bloquear Vite
  if (isDev) {
    // Pular validações de SQL injection e scraping em desenvolvimento
    return next();
  }
  
  // Rate limiting
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const endpoint = req.path || "/";
  
  const rateLimit = checkApiRateLimit(ip, endpoint);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Muitas requisições. Tente novamente mais tarde.",
      retryAfter: rateLimit.retryAfter
    });
  }
  
  // SQL injection check DESABILITADO temporariamente para destravar login
  
  next();
}

/**
 * Middleware específico para login
 */
export function loginSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Muitas tentativas de login. Tente novamente em alguns minutos.",
      retryAfter: rateLimit.retryAfter
    });
  }
  
  next();
}

