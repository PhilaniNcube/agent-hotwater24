import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

export type QuoteRow = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  telephoneNumber: string | null;
  suburb: string | null;
  city: string | null;
  adults: number | null;
  teenagers: number | null;
  children: number | null;
  houseType: string | null;
  bathrooms: number | null;
  geyserSize: number | null;
  electric_geysers: number | null;
  electricGeyser: boolean | null;
  solarGeyser: boolean | null;
  gasGeyser: boolean | null;
  otherGeyser: string | null;
  completeSolution: boolean | null;
  offGrid: boolean | null;
  locateOutside: boolean | null;
  borehole_water: boolean | null;
  gasStove: boolean | null;
  gasHeating: boolean | null;
  gasWaterHeating: boolean | null;
  otherGasUse: string | null;
  contactDay: string | null;
  contactTime: string | null;
  monthlySavings: number | null;
  comments: string | null;
  source: string | null;
  created_at: string | null;
  financing: string | null;
  contacted: boolean | null;
};

const SELECT_COLUMNS =
  "id,firstName,lastName,email,telephoneNumber,suburb,city,adults,teenagers,children,houseType,bathrooms,geyserSize,electric_geysers,electricGeyser,solarGeyser,gasGeyser,otherGeyser,completeSolution,offGrid,locateOutside,borehole_water,gasStove,gasHeating,gasWaterHeating,otherGasUse,contactDay,contactTime,monthlySavings,comments,source,created_at,financing,contacted";

export type QuoteListItem = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  telephoneNumber: string | null;
  suburb: string | null;
  city: string | null;
  geyserSize: number | null;
  contactDay: string | null;
  contactTime: string | null;
  source: string | null;
  created_at: string | null;
  contacted: boolean | null;
};

const LIST_COLUMNS =
  "id,firstName,lastName,email,telephoneNumber,suburb,city,geyserSize,contactDay,contactTime,source,created_at,contacted";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function toBool(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return null;
}

function normalizeListRow(row: Record<string, unknown>): QuoteListItem {
  return {
    id: toNumber(row.id) ?? 0,
    firstName: (row.firstName as string | null) ?? null,
    lastName: (row.lastName as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    telephoneNumber: (row.telephoneNumber as string | null) ?? null,
    suburb: (row.suburb as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    geyserSize: toNumber(row.geyserSize),
    contactDay: (row.contactDay as string | null) ?? null,
    contactTime: (row.contactTime as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    contacted: toBool(row.contacted),
  };
}

function normalizeQuoteRow(row: Record<string, unknown>): QuoteRow {
  return {
    id: toNumber(row.id) ?? 0,
    firstName: (row.firstName as string | null) ?? null,
    lastName: (row.lastName as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    telephoneNumber: (row.telephoneNumber as string | null) ?? null,
    suburb: (row.suburb as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    adults: toNumber(row.adults),
    teenagers: toNumber(row.teenagers),
    children: toNumber(row.children),
    houseType: (row.houseType as string | null) ?? null,
    bathrooms: toNumber(row.bathrooms),
    geyserSize: toNumber(row.geyserSize),
    electric_geysers: toNumber(row.electric_geysers),
    electricGeyser: toBool(row.electricGeyser),
    solarGeyser: toBool(row.solarGeyser),
    gasGeyser: toBool(row.gasGeyser),
    otherGeyser: (row.otherGeyser as string | null) ?? null,
    completeSolution: toBool(row.completeSolution),
    offGrid: toBool(row.offGrid),
    locateOutside: toBool(row.locateOutside),
    borehole_water: toBool(row.borehole_water),
    gasStove: toBool(row.gasStove),
    gasHeating: toBool(row.gasHeating),
    gasWaterHeating: toBool(row.gasWaterHeating),
    otherGasUse: (row.otherGasUse as string | null) ?? null,
    contactDay: (row.contactDay as string | null) ?? null,
    contactTime: (row.contactTime as string | null) ?? null,
    monthlySavings: toNumber(row.monthlySavings),
    comments: (row.comments as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    financing: (row.financing as string | null) ?? null,
    contacted: toBool(row.contacted),
  };
}

export async function listQuotes(limit = 100): Promise<QuoteListItem[]> {
  if (!isSupabaseQuotesConfigured()) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(QUOTES_TABLE)
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .range(0, Math.max(limit - 1, 0));

  if (error) {
    throw new Error(`Failed to fetch quotes: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map((row) => normalizeListRow(row as Record<string, unknown>));
}

export async function getQuoteById(id: number): Promise<QuoteRow | null> {
  if (!isSupabaseQuotesConfigured()) {
    return null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(QUOTES_TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch quote ${id}: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeQuoteRow(data as Record<string, unknown>);
}

function isSupabaseQuotesConfigured() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function formatQuoteName(quote: { firstName: string | null; lastName: string | null }) {
  return `${(quote.firstName ?? "").trim()} ${(quote.lastName ?? "").trim()}`.trim() || "Unknown";
}

export function formatQuoteLocation(quote: { suburb: string | null; city: string | null }) {
  const parts = [quote.suburb, quote.city].filter(Boolean);

  return parts.length ? parts.join(", ") : "—";
}