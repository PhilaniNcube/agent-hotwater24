import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Triage and prioritize quote leads for sales outreach: rank hot leads, build daily call schedules grouped by preferred contact day/time, and flag stale uncontacted leads that need urgent follow-up. Also marks a lead as contacted after a rep makes contact. Delegate to this subagent whenever the user wants to organize, rank, schedule, or check the freshness of leads.",
  model: "anthropic/claude-haiku-4.5",
});