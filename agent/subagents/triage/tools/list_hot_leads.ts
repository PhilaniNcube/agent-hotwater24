import { defineTool } from "eve/tools";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

const POSITIVE_TRUE = new Set(["true", "yes", "1"]);

function isFinancingRequested(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === "false" || normalized === "") return false;
  if (POSITIVE_TRUE.has(normalized)) return true;
  // Any other non-empty affirmative string counts as requested.
  return true;
}

const SELECT_COLUMNS =
  "id,firstName,lastName,suburb,city,telephoneNumber,email,geyserSize,completeSolution,financing,contacted,contactDay,contactTime,created_at,source,comments";

export default defineTool({
  description:
    "List and rank Hotwater24 hot leads. A lead is hot when completeSolution is true AND financing is requested (financing stored as text). Returns leads ranked by recency with the fields a sales rep needs to follow up.",
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of hot leads to return. Defaults to 25."),
  }),
  async execute({ limit }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .select(SELECT_COLUMNS)
      .eq("completeSolution", true)
      .neq("financing", "false")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);

    if (error) {
      return { ok: false, error: error.message };
    }

    const hot = (data ?? [])
      .filter((row) => isFinancingRequested((row as { financing?: unknown }).financing))
      .map((row) => ({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        suburb: row.suburb,
        city: row.city,
        telephoneNumber: row.telephoneNumber,
        email: row.email,
        geyserSize: row.geyserSize,
        completeSolution: row.completeSolution,
        financing: row.financing,
        contacted: row.contacted,
        contactDay: row.contactDay,
        contactTime: row.contactTime,
        createdAt: row.created_at,
        source: row.source,
        comments: row.comments,
      }));

    return {
      ok: true,
      criteria: "completeSolution = true AND financing requested",
      count: hot.length,
      leads: hot,
    };
  },
});