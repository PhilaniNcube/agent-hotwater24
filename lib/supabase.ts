import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createLibSqlClient } from "@libsql/client";

export const QUOTES_TABLE = "quotes";

let supabase: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.",
    );
  }

  if (!supabase) {
    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return supabase;
}

const READ_ONLY_KEYWORDS = /^(with|select)\b/i;

function assertReadOnlyQuery(query: string) {
  const trimmed = query.trim().replace(/;+\s*$/, "").trim();

  if (!trimmed) {
    throw new Error("Query is empty.");
  }

  if (!READ_ONLY_KEYWORDS.test(trimmed)) {
    throw new Error(
      "Only read-only SELECT / WITH ... SELECT queries are allowed on the quotes database.",
    );
  }

  // Block statement separators so the model cannot append a second statement.
  if (trimmed.includes(";")) {
    throw new Error(
      "Multi-statement queries are not allowed. Use a single SELECT statement.",
    );
  }

  // Block obviously mutating language even inside a WITH, defensively.
  const forbidden = /\b(insert\s+into|update\s+|delete\s+from|drop\s+|alter\s+|truncate\s+|create\s+|grant\s+|revoke\s+|vacuum\s+|copy\s+)\b/i;
  if (forbidden.test(trimmed)) {
    throw new Error("The query contains a forbidden mutating statement.");
  }

  return trimmed;
}

export type SqlRow = Record<string, unknown>;

export async function runQuotesSql(
  query: string,
  options: { limit?: number } = {},
): Promise<{ rows: SqlRow[]; rowCount: number; truncated: boolean }> {
  const trimmed = assertReadOnlyQuery(query);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const wrapped = `SELECT sub.* FROM (${trimmed}) AS sub LIMIT ${limit + 1}`;

  // Fetch data using Supabase JS client directly
  const clientSupabase = getSupabase();
  const allRows: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await clientSupabase
      .from(QUOTES_TABLE)
      .select("*")
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      throw new Error(`Failed to fetch quotes from Supabase: ${error.message}`);
    }
    if (!data || data.length === 0) {
      break;
    }
    allRows.push(...data);
    if (data.length < pageSize) {
      break;
    }
    page++;
  }

  const client = createLibSqlClient({ url: "file::memory:" });
  
  if (allRows.length > 0) {
    const columns = Array.from(new Set(allRows.flatMap(row => Object.keys(row))));
    const createTableSql = `CREATE TABLE quotes (${columns.map(col => `"${col}" TEXT`).join(", ")})`;
    await client.execute(createTableSql);
    
    const batchSize = 50;
    for (let i = 0; i < allRows.length; i += batchSize) {
      const batch = allRows.slice(i, i + batchSize);
      for (const row of batch) {
        const rowCols = Object.keys(row);
        const placeholders = rowCols.map(() => "?").join(", ");
        const values = rowCols.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return null;
          if (typeof val === "object") return JSON.stringify(val);
          return val;
        });
        const insertSql = `INSERT INTO quotes (${rowCols.map(col => `"${col}"`).join(", ")}) VALUES (${placeholders})`;
        await client.execute({ sql: insertSql, args: values });
      }
    }
  } else {
    await client.execute(`CREATE TABLE quotes (id TEXT)`);
  }

  const res = await client.execute(wrapped);
  const rows = res.rows.map(row => {
    const obj: SqlRow = {};
    for (const key of Object.keys(row)) {
      obj[key] = row[key];
    }
    return obj;
  });

  const truncated = rows.length > limit;
  const output = truncated ? rows.slice(0, limit) : rows;

  return { rows: output, rowCount: output.length, truncated };
}