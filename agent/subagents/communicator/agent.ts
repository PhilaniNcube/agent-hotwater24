import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Draft ready-to-send personalized follow-up messages (email or WhatsApp) for Hotwater24 leads, using lead data such as firstName, houseType, bathrooms, monthlySavings, and contactDay. Delegate to this subagent when a sales rep wants a follow-up template drafted for a customer.",
  model: "anthropic/claude-haiku-4.5",
});