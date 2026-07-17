import { defineTool } from "eve/tools";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

const SELECT_COLUMNS =
  "id,firstName,lastName,suburb,city,telephoneNumber,email,geyserSize,completeSolution,financing,contacted,contactDay,contactTime,created_at,source,comments,monthlySavings";

export default defineTool({
  description: "Retrieve a list of the most recent quote leads received by Hotwater24, sorted by creation date descending.",
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of recent leads to return. Defaults to 10."),
  }),
  async execute({ limit }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      count: data?.length ?? 0,
      leads: data,
    };
  },
});
