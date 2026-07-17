import { defineTool } from "eve/tools";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

const SELECT_COLUMNS =
  "id,firstName,lastName,email,telephoneNumber,suburb,city,adults,teenagers,children,houseType,bathrooms,geyserSize,electric_geysers,electricGeyser,solarGeyser,gasGeyser,otherGeyser,completeSolution,offGrid,locateOutside,borehole_water,gasStove,gasHeating,gasWaterHeating,otherGasUse,contactDay,contactTime,monthlySavings,comments,source,created_at";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

type LeadRow = Record<string, unknown>;

export default defineTool({
  description:
    "Fetch a single Hotwater24 quote lead by id and return a structured 'One-Minute Brief' payload: family summary, geyser requirements, current water heating, solution type, contact slot, plus computed technical flags (borehole water, indoor installation) and cross-sell prompts (gas stove/heating/other gas use). Use this before a rep calls a lead.",
  inputSchema: z.object({
    quoteId: z.number().int().positive().describe("The id of the quote to brief on."),
  }),
  async execute({ quoteId }) {
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

    const row = data as unknown as LeadRow;
    const adults = toNumber(row.adults) ?? 0;
    const teenagers = toNumber(row.teenagers) ?? 0;
    const children = toNumber(row.children) ?? 0;
    const familyTotal = adults + teenagers + children;
    const electricGeysers = toNumber(row.electric_geysers) ?? 0;
    const geyserSize = toNumber(row.geyserSize);
    const solutionType = asBool(row.completeSolution)
      ? "complete solution"
      : asBool(row.offGrid)
        ? "off-grid"
        : "standard";

    const flags: { level: "warning" | "opportunity"; message: string }[] = [];

    if (asBool(row.borehole_water)) {
      flags.push({
        level: "warning",
        message:
          "Remind the customer we need to check their water pressure (borehole water detected).",
      });
    }
    if (row.locateOutside === false) {
      flags.push({
        level: "warning",
        message:
          "Indoor installation requested; remind them about strict flue/ventilation regulations.",
      });
    }
    if (
      asBool(row.gasStove) ||
      asBool(row.gasHeating) ||
      (typeof row.otherGasUse === "string" && row.otherGasUse.trim() !== "")
    ) {
      flags.push({
        level: "opportunity",
        message:
          "Ask the customer about bundled gas supply deals or larger manifold installations (gas stove/heating mentioned).",
      });
    }

    return {
      ok: true,
      brief: {
        id: row.id,
        name: `${(row.firstName as string | null ?? "").trim()} ${(row.lastName as string | null ?? "").trim()}`.trim(),
        firstName: row.firstName,
        lastName: row.lastName,
        contact: {
          email: row.email,
          telephoneNumber: row.telephoneNumber,
          contactDay: row.contactDay,
          contactTime: row.contactTime,
        },
        location: { suburb: row.suburb, city: row.city },
        family: {
          adults,
          teenagers,
          children,
          total: familyTotal,
        },
        houseType: row.houseType,
        bathrooms: toNumber(row.bathrooms),
        geyser: {
          sizeLitres: geyserSize,
          electricGeysers,
          currentSources: {
            electric: asBool(row.electricGeyser),
            solar: asBool(row.solarGeyser),
            gas: asBool(row.gasGeyser),
            other: row.otherGeyser,
          },
        },
        solutionType,
        completeSolution: asBool(row.completeSolution),
        offGrid: asBool(row.offGrid),
        locateOutside: row.locateOutside,
        boreholeWater: asBool(row.borehole_water),
        gasUses: {
          stove: asBool(row.gasStove),
          heating: asBool(row.gasHeating),
          waterHeating: asBool(row.gasWaterHeating),
          other: row.otherGasUse,
        },
        monthlySavings: toNumber(row.monthlySavings),
        comments: row.comments,
        source: row.source,
        createdAt: row.created_at,
      },
      flags,
      suggestedFormat: `**${(row.firstName as string | null ?? "").trim()} ${(row.lastName as string | null ?? "").trim()}** (Family of ${familyTotal}, ${teenagers} teenagers) in **${row.suburb ?? "unspecified"}, ${row.city ?? "unspecified"}** needs a **${geyserSize ?? "?"}L gas geyser**. They currently have **${electricGeysers} electric geyser(s)** and are looking for a **${solutionType}** solution. Call on **${row.contactDay ?? "unspecified"}** at **${row.contactTime ?? "unspecified"}**.`,
    };
  },
});