import { defineTool } from "eve/tools";
import { z } from "zod";
import { getSupabase, QUOTES_TABLE } from "@/lib/supabase";

const SELECT_COLUMNS =
  "id,firstName,lastName,telephoneNumber,email,suburb,city,geyserSize,contactDay,contactTime,created_at";

type ScheduleRow = {
  id: number | string;
  firstName: string | null;
  lastName: string | null;
  telephoneNumber: string | null;
  email: string | null;
  suburb: string | null;
  city: string | null;
  geyserSize: string | number | null;
  contactDay: string | null;
  contactTime: string | null;
  created_at: string | null;
  createdAt: string | null;
};

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function daySortKey(day: string | null): number {
  if (!day) return 99;
  return DAY_ORDER[day.trim().toLowerCase()] ?? 50;
}

function groupKey(day: string | null, time: string | null): string {
  const d = day?.trim() || "Unscheduled";
  const t = time?.trim();
  return t ? `${d} @ ${t}` : d;
}

export default defineTool({
  description:
    "Build a call schedule for Hotwater24 leads grouped by the customer's preferred contact day and time. Use this to give a rep a clean top-to-bottom list to work through when contacting leads on their preferred day and time.",
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Maximum number of leads to include. Defaults to 100."),
  }),
  async execute({ limit }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .select(SELECT_COLUMNS)
      .not("contactDay", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);

    if (error) {
      return { ok: false, error: error.message };
    }

    const rows = (data ?? []) as unknown as ScheduleRow[];
    const buckets = new Map<
      string,
      {
        day: string | null;
        time: string | null;
        leads: ScheduleRow[];
      }
    >();

    for (const row of rows) {
      const day = row.contactDay ?? null;
      const time = row.contactTime ?? null;
      const key = groupKey(day, time);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { day, time, leads: [] };
        buckets.set(key, bucket);
      }
      bucket.leads.push({ ...row, createdAt: row.created_at ?? null }); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
    }

    const scheduleGroups = [...buckets.values()]
      .sort((a, b) => daySortKey(a.day) - daySortKey(b.day) || String(a.time ?? "").localeCompare(String(b.time ?? "")))
      .map((bucket) => ({
        day: bucket.day ?? "Unscheduled",
        time: bucket.time ?? null,
        leadCount: bucket.leads.length,
        leads: bucket.leads,
      }));

    return {
      ok: true,
      totalLeads: rows.length,
      groupCount: scheduleGroups.length,
      groups: scheduleGroups,
    };
  },
});