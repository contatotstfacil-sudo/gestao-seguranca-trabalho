/**
 * Criptografia de dados sensíveis para proteção contra vazamento
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Gera chave de criptografia a partir de uma senha
 */
function getKeyFromPassword(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha512");
}

/**
 * Criptografa dados sensíveis (CPF, CNPJ, etc)
 */
export function encryptSensitiveData(text: string): string {
  if (!text) return "";
  
  const password = process.env.ENCRYPTION_KEY || "default-key-change-in-production";
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKeyFromPassword(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  // Retorna: salt:iv:tag:encrypted
  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Descriptografa dados sensíveis
 */
export function decryptSensitiveData(encryptedText: string): string {
  if (!encryptedText) return "";
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      throw new Error("Formato de dados criptografados inválido");
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const password = process.env.ENCRYPTION_KEY || "default-key-change-in-production";
    const key = getKeyFromPassword(password, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Erro ao descriptografar:", error);
    return "";
  }
}

/**
 * Hash de dados para comparação sem revelar valor original
 */
export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Gera token único para rastreamento
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(32).toString("hex");
}


