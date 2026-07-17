import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Business intelligence analyst for the Hotwater24 quotes database. Translates natural-language business questions about leads, geography, pipeline value, marketing attribution, and product trends into read-only SQL against the quotes table, then runs the query and explains the results. Delegate to this subagent for analytics, reporting, counts, sums, averages, group-by breakdowns, and percentage questions about quotes/leads.",
  model: "anthropic/claude-haiku-4.5",
});