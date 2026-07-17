import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

export default defineTool({
  description:
    "Mark a single Hotwater24 quote lead as contacted by setting contacted = true. Use this only after a rep confirms they have contacted the lead, so the contacted field becomes reliable over time. This is a write operation and requires human approval before it runs.",
  inputSchema: z.object({
    quoteId: z
      .number()
      .int()
      .positive()
      .describe("The id of the quote/lead to mark as contacted."),
  }),
  approval: always(),
  async execute({ quoteId }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .update({ contacted: true })
      .eq("id", quoteId)
      .select("id,firstName,lastName,contacted")
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }

    if (!data) {
      return {
        ok: false,
        error: `No quote found with id ${quoteId}. Nothing was updated.`,
      };
    }

    return {
      ok: true,
      quote: data,
      message: `Quote ${quoteId} (${`${(data.firstName ?? "").trim()} ${(data.lastName ?? "").trim()}`.trim()}) marked as contacted.`,
    };
  },
});