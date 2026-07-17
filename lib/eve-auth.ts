import type { AuthFn } from "eve/channels/auth";
import { ANONYMOUS_VIEWER } from "@/lib/session";
import { isAppConfigured } from "@/lib/setup";

export const betterAuthEveAuth: AuthFn<Request> = async () => {
  if (!(await isAppConfigured())) {
    return null;
  }

  return {
    attributes: {
      email: ANONYMOUS_VIEWER.email,
      name: ANONYMOUS_VIEWER.name,
    },
    authenticator: "anonymous",
    issuer: "local",
    principalId: ANONYMOUS_VIEWER.id,
    principalType: "user",
    subject: ANONYMOUS_VIEWER.email,
  };
};