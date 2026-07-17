import type { SetupStatus, Viewer } from "@/lib/chat/types";
import { getSetupStatus } from "@/lib/setup";

export const ANONYMOUS_VIEWER: Viewer = Object.freeze({
  email: "anonymous@local",
  id: "anonymous",
  image: null,
  name: "Anonymous",
});

export async function getServerViewer(
  setupStatus?: SetupStatus,
): Promise<Viewer | null> {
  const status = setupStatus ?? (await getSetupStatus());

  if (!status.appReady) {
    return null;
  }

  return ANONYMOUS_VIEWER;
}