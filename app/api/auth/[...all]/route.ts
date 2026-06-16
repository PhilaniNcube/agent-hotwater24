import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetupStatus } from "@/lib/setup";

export async function GET(request: Request) {
  return handleAuth(request);
}

export async function POST(request: Request) {
  return handleAuth(request);
}

async function handleAuth(request: Request) {
  const setupStatus = await getSetupStatus();

  if (!setupStatus.databaseConfigured) {
    return redirectToAuthError(request, "database_not_configured");
  }

  if (!setupStatus.databaseSchemaReady) {
    return redirectToAuthError(request, "database_migrations_missing");
  }

  if (!setupStatus.authReady) {
    return redirectToAuthError(request, "auth_env_missing");
  }

  return auth.handler(request);
}

function redirectToAuthError(request: Request, error: string) {
  const url = new URL("/auth/error", request.url);
  url.searchParams.set("error", error);

  return NextResponse.redirect(url);
}
