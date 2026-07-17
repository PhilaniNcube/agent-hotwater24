import { parseAsStringLiteral } from "nuqs";

import {
  CRM_NAV_ITEMS,
  CRM_VIEW_QUERY_PARAM,
  DEFAULT_CRM_VIEW,
  type CrmView,
} from "@/lib/crm/nav";

const CRM_VIEW_LITERALS = CRM_NAV_ITEMS.map(
  (item) => item.id,
) as unknown as readonly [CrmView, ...CrmView[]];

export const crmViewParser = parseAsStringLiteral(CRM_VIEW_LITERALS).withDefault(
  DEFAULT_CRM_VIEW,
);

export const CRM_VIEW_PARAM = CRM_VIEW_QUERY_PARAM;
