import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

// SLACK_CONNECTOR is the UID returned by `vercel connect create slack`.
// For local setup, create a connector with:
// `vercel connect create slack --name agent-hotwater24 --triggers`.
const slackConnector = process.env.SLACK_CONNECTOR ?? "slack/agent-hotwater24";

export default slackChannel({
  credentials: connectSlackCredentials(slackConnector),
  uploadPolicy: "disabled",
});
