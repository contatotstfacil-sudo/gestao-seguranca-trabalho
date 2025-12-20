import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema";

/**
 * Retorna instância do Drizzle conectada ao MySQL.
 * Lança erro se DATABASE_URL não estiver configurada.
 */
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: mysql.Pool | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL);
  }

  if (!db) {
    db = drizzle(pool, { schema });
  }

  return db;
}

export async function closeDb() {
  await pool?.end();
  db = null;
  pool = null;
}

