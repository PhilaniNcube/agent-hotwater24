import type { SetupStatus } from "@/lib/chat/types";

import { isDatabaseConfigured, isDatabaseSchemaReady } from "@/lib/db/client";

export function isAuthConfigured() {
  return true;
}

export function isRateLimitConfigured() {
  return true;
}

export function getInitialSetupStatus(): SetupStatus {
  return createSetupStatus({
    databaseSchemaReady: isDatabaseConfigured(),
  });
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const databaseConfigured = isDatabaseConfigured();
  const databaseSchemaReady = databaseConfigured
    ? await isDatabaseSchemaReady()
    : false;

  return createSetupStatus({ databaseSchemaReady });
}

export async function isAppConfigured() {
  const status = await getSetupStatus();

  return status.appReady;
}

function createSetupStatus({
  databaseSchemaReady,
}: {
  readonly databaseSchemaReady: boolean;
}): SetupStatus {
  const databaseConfigured = isDatabaseConfigured();
  const authReady = isAuthConfigured();
  const rateLimitReady = isRateLimitConfigured();
  const databaseReady = databaseConfigured && databaseSchemaReady;
  const missing = [
    ...(databaseConfigured ? [] : ["DATABASE_URL"]),
    ...(databaseConfigured && !databaseSchemaReady ? ["database migrations"] : []),
  ];

  return {
    appReady: authReady && databaseReady,
    authReady,
    databaseConfigured,
    databaseReady,
    databaseSchemaReady,
    missing,
    rateLimitReady,
  };
}
