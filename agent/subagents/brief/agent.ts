import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Produce a concise pre-call 'One-Minute Brief' for a single Hotwater24 quote lead, with automatic technical friction flags (borehole water, indoor installation) and cross-sell prompts (gas stove/heating/other gas use). Delegate to this subagent when a sales rep needs a quick digest of an individual lead before calling them.",
  model: "anthropic/claude-haiku-4.5",
});