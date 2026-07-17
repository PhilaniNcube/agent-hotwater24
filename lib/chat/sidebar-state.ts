export const SIDEBAR_COOKIE_NAME = "eve-chat-sidebar";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const CHAT_PANEL_COOKIE_NAME = "eve-chat-panel";
export const CHAT_PANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseSidebarOpen(value: string | null | undefined) {
  return value !== "closed";
}

export function serializeSidebarOpen(open: boolean) {
  return open ? "open" : "closed";
}

export function readBooleanCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

  if (!match?.[1]) {
    return null;
  }

  return parseSidebarOpen(decodeURIComponent(match[1]));
}

export function writeBooleanCookie(name: string, open: boolean, maxAge: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${serializeSidebarOpen(open)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
