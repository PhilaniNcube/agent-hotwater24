import { defineTool } from "eve/tools";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

const SELECT_COLUMNS =
  "id,firstName,lastName,telephoneNumber,email,suburb,city,geyserSize,contacted,contactDay,contactTime,created_at,source,comments";

const HOUR_MS = 60 * 60 * 1000;

export default defineTool({
  description:
    "List Hotwater24 leads that are NOT marked as contacted and were created more than 24 hours ago, so they get urgent follow-up. Note: the contacted field has historically been unreliable, so these are leads 'not marked as contacted in the system', not necessarily never contacted.",
  inputSchema: z.object({
    olderThanHours: z
      .number()
      .int()
      .min(1)
      .max(720)
      .optional()
      .describe("Age threshold in hours. Defaults to 24."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Maximum number of stale leads to return. Defaults to 50."),
  }),
  async execute({ olderThanHours, limit }) {
    const hours = olderThanHours ?? 24;
    const cutoff = new Date(Date.now() - hours * HOUR_MS).toISOString();

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .select(SELECT_COLUMNS)
      .eq("contacted", false)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(limit ?? 50);

    if (error) {
      return { ok: false, error: error.message };
    }

    const stale = (data ?? []).map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      telephoneNumber: row.telephoneNumber,
      email: row.email,
      suburb: row.suburb,
      city: row.city,
      geyserSize: row.geyserSize,
      contacted: row.contacted,
      contactDay: row.contactDay,
      contactTime: row.contactTime,
      createdAt: row.created_at,
      source: row.source,
      comments: row.comments,
      status: "stale",
    }));

    return {
      ok: true,
      criteria: `contacted = false AND created_at < ${hours}h ago (cutoff ${cutoff})`,
      count: stale.length,
      leads: stale,
    };
  },
});