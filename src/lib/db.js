import "server-only";
import { Pool } from "pg";

const globalForPg = globalThis;

/**
 * Return the singleton PostgreSQL pool, reusing globalThis across dev HMR reloads.
 */
export function getPool() {
  if (!globalForPg.__hasilautPgPool) {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    const pool = new Pool({
      connectionString,
      max: 15,
      idleTimeoutMillis: 30000,
    });

    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error);
    });

    globalForPg.__hasilautPgPool = pool;
  }

  return globalForPg.__hasilautPgPool;
}

/**
 * Execute a parameterized SQL query against the pool.
 */
export function query(text, params = []) {
  return getPool().query(text, params);
}

/**
 * Run a callback inside a PostgreSQL transaction (BEGIN / COMMIT / ROLLBACK).
 */
export async function withTransaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original failure when rollback itself fails.
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * PostgreSQL raises 23001 for ON DELETE RESTRICT and 23503 for NO ACTION FK checks.
 */
export function isForeignKeyRestrictError(error) {
  return error?.code === "23001" || error?.code === "23503";
}
