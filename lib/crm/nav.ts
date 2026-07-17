export type CrmView = "dashboard" | "quotes" | "deals" | "settings";

export const CRM_VIEW_QUERY_PARAM = "view";

export const CRM_NAV_ITEMS: ReadonlyArray<{
  readonly id: CrmView;
  readonly label: string;
  readonly description: string;
}> = [
  { id: "dashboard", label: "Dashboard", description: "Overview of your pipeline" },
  { id: "quotes", label: "Quotes", description: "Hotwater24 quote requests" },
  { id: "deals", label: "Deals", description: "Track opportunities" },
  { id: "settings", label: "Settings", description: "Workspace preferences" },
];

export const CRM_VIEWS: ReadonlySet<CrmView> = new Set(
  CRM_NAV_ITEMS.map((item) => item.id),
);

export const DEFAULT_CRM_VIEW: CrmView = "dashboard";

export function isCrmView(value: string | null | undefined): value is CrmView {
  return Boolean(value && CRM_VIEWS.has(value as CrmView));
}