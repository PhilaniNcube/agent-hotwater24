import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";

let database: LibSQLDatabase<typeof schema> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  if (!database) {
    const url = process.env.DATABASE_URL?.trim();

    if (!url) {
      throw new Error("DATABASE_URL is required. Add Turso configuration first.");
    }

    const authToken = process.env.DATABASE_TOKEN?.trim();
    const client = createClient({ url, authToken });
    database = drizzle({ client, schema });
  }

  return database;
}

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function isDatabaseSchemaReady() {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    return false;
  }

  try {
    const authToken = process.env.DATABASE_TOKEN?.trim();
    const client = createClient({ url, authToken });
    const res = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('account', 'chat', 'chat_event', 'session', 'user', 'verification')
    `);
    const tables = res.rows.map((row) => String(row.name));
    const requiredTables = ["account", "chat", "chat_event", "session", "user", "verification"];
    const ready = requiredTables.every((t) => tables.includes(t));

    return ready;
  } catch {
    return false;
  }
}
