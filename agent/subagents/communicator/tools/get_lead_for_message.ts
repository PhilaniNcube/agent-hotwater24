import { defineTool } from "eve/tools";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

const SELECT_COLUMNS =
  "id,firstName,lastName,email,telephoneNumber,suburb,city,houseType,bathrooms,geyserSize,monthlySavings,contactDay,contactTime,comments";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default defineTool({
  description:
    "Fetch the fields needed to draft a personalized follow-up message for a Hotwater24 lead: name, contact details, house type, bathrooms, geyser size, monthly savings, and preferred contact day/time. Use this before composing an email or WhatsApp follow-up for a specific quote.",
  inputSchema: z.object({
    quoteId: z.number().int().positive().describe("The id of the quote to personalize for."),
    channel: z
      .enum(["whatsapp", "email"])
      .optional()
      .describe("The channel the message will be sent on. Defaults to whatsapp."),
  }),
  async execute({ quoteId, channel }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .select(SELECT_COLUMNS)
      .eq("id", quoteId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data) {
      return { ok: false, error: `No quote found with id ${quoteId}.` };
    }

    const row = data as Record<string, unknown>;
    return {
      ok: true,
      channel: channel ?? "whatsapp",
      lead: {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        telephoneNumber: row.telephoneNumber,
        suburb: row.suburb,
        city: row.city,
        houseType: row.houseType,
        bathrooms: toNumber(row.bathrooms),
        geyserSize: toNumber(row.geyserSize),
        monthlySavings: toNumber(row.monthlySavings),
        contactDay: row.contactDay,
        contactTime: row.contactTime,
        comments: row.comments,
      },
    };
  },
});