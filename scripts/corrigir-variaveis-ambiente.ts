/**
 * Script para corrigir variáveis de ambiente faltando
 * Adiciona COOKIE_SECRET e ENCRYPTION_KEY se não existirem
 */

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { randomBytes } from "crypto";

const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Gerar chaves seguras
function generateSecureKey(): string {
  return randomBytes(32).toString("hex");
}

console.log("🔧 Corrigindo variáveis de ambiente...\n");

// Verificar qual arquivo usar (prioridade: .env.local > .env)
let envFile = envLocalPath;
if (!existsSync(envLocalPath)) {
  envFile = envPath;
  if (!existsSync(envPath)) {
    console.log("❌ Nenhum arquivo .env encontrado!");
    console.log("   Criando .env.local...");
    writeFileSync(envLocalPath, "");
    envFile = envLocalPath;
  }
}

console.log(`📝 Usando arquivo: ${envFile}\n`);

// Ler arquivo atual
let envContent = "";
if (existsSync(envFile)) {
  envContent = readFileSync(envFile, "utf-8");
}

// Verificar se variáveis já existem
const hasCookieSecret = /^COOKIE_SECRET\s*=/m.test(envContent);
const hasEncryptionKey = /^ENCRYPTION_KEY\s*=/m.test(envContent);

let updated = false;

// Adicionar COOKIE_SECRET se não existir
if (!hasCookieSecret) {
  const cookieSecret = generateSecureKey();
  envContent += `\nCOOKIE_SECRET=${cookieSecret}\n`;
  console.log("✅ Adicionado COOKIE_SECRET");
  updated = true;
} else {
  console.log("ℹ️  COOKIE_SECRET já existe");
}

// Adicionar ENCRYPTION_KEY se não existir
if (!hasEncryptionKey) {
  const encryptionKey = generateSecureKey();
  envContent += `ENCRYPTION_KEY=${encryptionKey}\n`;
  console.log("✅ Adicionado ENCRYPTION_KEY");
  updated = true;
} else {
  console.log("ℹ️  ENCRYPTION_KEY já existe");
}

// Salvar arquivo
if (updated) {
  writeFileSync(envFile, envContent);
  console.log(`\n✅ Arquivo ${envFile} atualizado!`);
  console.log("\n⚠️  IMPORTANTE: Reinicie o servidor para aplicar as mudanças!");
  console.log("   Execute: pnpm dev (ou pnpm dev:win)");
} else {
  console.log("\n✅ Todas as variáveis já estão configuradas!");
}



