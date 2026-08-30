import type { HqCapability } from "../../lib/hq/types.ts";

export type OpsNavItem = {
  id: string;
  label: string;
  path: string;
  /** null = any authorized operator */
  capabilities: readonly HqCapability[] | null;
};

export const OPS_NAV_ITEMS: OpsNavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/ops", capabilities: null },
  { id: "users", label: "Users", path: "/ops/users", capabilities: ["hq.member.sensitive_read"] },
  { id: "reports", label: "Reports", path: "/ops/reports", capabilities: ["admin.reports.read"] },
  {
    id: "photos",
    label: "Photos",
    path: "/ops/photos",
    capabilities: ["admin.profile_photos.moderate"],
  },
  { id: "safety", label: "Safety", path: "/ops/safety", capabilities: ["hq.trust_safety.read"] },
  {
    id: "activity",
    label: "Activity",
    path: "/ops/activity",
    capabilities: ["hq.member.security_read"],
  },
  {
    id: "operators",
    label: "Operators",
    path: "/ops/operators",
    capabilities: ["admin.operators.read"],
  },
];

export function findOpsNavItem(pathname: string): OpsNavItem | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/ops";
  for (const item of OPS_NAV_ITEMS) {
    if (item.path === normalized) return item;
    if (item.path !== "/ops" && normalized.startsWith(`${item.path}/`)) return item;
  }
  return undefined;
}
