export type CrmView = "dashboard" | "quotes" | "deals" | "settings";

export const CRM_VIEW_STORAGE_KEY = "hotwater-crm-view";
export const CRM_NAV_ITEMS: ReadonlyArray<{
  readonly id: CrmView;
  readonly label: string;
  readonly description: string;
}> = [
  { id: "quotes", label: "Quotes", description: "Hotwater24 quote requests" },
  { id: "dashboard", label: "Dashboard", description: "Overview of your pipeline" },
  { id: "deals", label: "Deals", description: "Track opportunities" },
  { id: "settings", label: "Settings", description: "Workspace preferences" },
];

export const CRM_VIEWS: ReadonlySet<CrmView> = new Set(
  CRM_NAV_ITEMS.map((item) => item.id),
);

export function isCrmView(value: string | null | undefined): value is CrmView {
  return Boolean(value && CRM_VIEWS.has(value as CrmView));
}

export function readStoredCrmView(): CrmView | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(CRM_VIEW_STORAGE_KEY);

  return isCrmView(stored) ? stored : null;
}

export function persistCrmView(view: CrmView) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(CRM_VIEW_STORAGE_KEY, view);
  } catch {
    // Best-effort persistence.
  }
}