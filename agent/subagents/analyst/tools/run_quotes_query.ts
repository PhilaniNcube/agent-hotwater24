import { defineTool } from "eve/tools";
import { z } from "zod";
import { runQuotesSql } from "@/lib/supabase";

export default defineTool({
  description:
    "Run a read-only SQL query against the Hotwater24 Supabase `quotes` table and return the result rows. Only single SELECT or WITH...SELECT statements are allowed; mutations and multi-statement queries are rejected. Use the exact `quotes` column names. The row count is capped (default 100, max 500).",
  inputSchema: z.object({
    sql: z
      .string()
      .min(1)
      .describe(
        "A read-only SELECT or WITH...SELECT query against the `quotes` table. Do not include a trailing semicolon or multiple statements.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Maximum rows to return. Defaults to 100. Hard cap is 500."),
  }),
  async execute({ sql, limit }) {
    try {
      const result = await runQuotesSql(sql, { limit });
      return {
        ok: true,
        rowCount: result.rowCount,
        truncated: result.truncated,
        rows: result.rows,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message, rows: [] };
    }
  },
});