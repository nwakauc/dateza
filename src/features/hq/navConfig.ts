export type HqNavAvailability = "ready" | "planned" | "phase_gated";

export type HqNavItem = {
  id: string;
  label: string;
  /** Path under /hq — planned items still route to an honest unavailable page. */
  path: string;
  availability: HqNavAvailability;
  badge?: string;
};

export type HqNavGroup = {
  id: string;
  label: string;
  items: HqNavItem[];
};

/**
 * Full IA from D8N-HQ-PLAN / implementation brief.
 * Only Command Centre + Members are Phase 1 ready surfaces.
 */
export const HQ_NAV_GROUPS: HqNavGroup[] = [
  {
    id: "command",
    label: "Command",
    items: [
      { id: "command-centre", label: "Command Centre", path: "/hq", availability: "ready" },
      { id: "live-events", label: "Live / Events", path: "/hq/live", availability: "planned" },
      { id: "alerts", label: "Alerts", path: "/hq/alerts", availability: "planned" },
      { id: "incidents", label: "Incidents", path: "/hq/incidents", availability: "planned" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "members", label: "Members", path: "/hq/members", availability: "ready" },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { id: "growth", label: "Growth & Marketing", path: "/hq/growth", availability: "planned" },
      { id: "product", label: "Product", path: "/hq/product", availability: "planned" },
      { id: "marketplace", label: "Marketplace Health", path: "/hq/marketplace", availability: "planned" },
      { id: "revenue", label: "Revenue", path: "/hq/revenue", availability: "phase_gated" },
      { id: "customers", label: "Customers & Support", path: "/hq/customers", availability: "phase_gated" },
    ],
  },
  {
    id: "trust",
    label: "Trust",
    items: [
      { id: "trust-safety", label: "Trust & Safety", path: "/hq/trust-safety", availability: "planned" },
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    items: [
      { id: "reliability", label: "Reliability / SRE", path: "/hq/reliability", availability: "planned" },
      { id: "apm", label: "APM / Observability", path: "/hq/apm", availability: "planned" },
      { id: "errors", label: "Errors", path: "/hq/errors", availability: "planned" },
      { id: "traces", label: "Traces", path: "/hq/traces", availability: "planned" },
      { id: "logs", label: "Logs", path: "/hq/logs", availability: "planned" },
      { id: "jobs", label: "Jobs & Queues", path: "/hq/jobs", availability: "planned" },
      { id: "database", label: "Database", path: "/hq/database", availability: "planned" },
      { id: "infra", label: "Infrastructure", path: "/hq/infrastructure", availability: "planned" },
      { id: "deployments", label: "Deployments", path: "/hq/deployments", availability: "planned" },
      { id: "data-health", label: "Data Health", path: "/hq/data-health", availability: "planned" },
      { id: "security", label: "Security", path: "/hq/security", availability: "planned" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { id: "brands", label: "Brands", path: "/hq/brands", availability: "planned" },
      { id: "admin", label: "Admin / Operations", path: "/hq/admin", availability: "planned" },
      { id: "audit", label: "Audit", path: "/hq/audit", availability: "planned" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      {
        id: "company-intelligence",
        label: "Company Intelligence",
        path: "/hq/intelligence",
        availability: "phase_gated",
      },
      {
        id: "briefings",
        label: "Executive Briefings",
        path: "/hq/briefings",
        availability: "phase_gated",
      },
    ],
  },
];

export function findHqNavItem(pathname: string): HqNavItem | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/hq";
  for (const group of HQ_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.path === normalized) {
        return item;
      }
      if (item.path !== "/hq" && normalized.startsWith(`${item.path}/`)) {
        return item;
      }
    }
  }
  if (normalized.startsWith("/hq/members")) {
    return HQ_NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === "members");
  }
  return undefined;
}

export function hqUnavailableCopy(availability: HqNavAvailability): {
  title: string;
  body: string;
  badge: string;
} {
  if (availability === "phase_gated") {
    return {
      title: "Not available yet",
      body: "This area depends on product capabilities that do not exist in D8N yet. HQ will not invent data for it.",
      badge: "NOT CONFIGURED",
    };
  }
  return {
    title: "Coming later",
    body: "Navigation is reserved so the shell can grow. This page is not part of the Phase 1 Member 360 slice.",
    badge: "COMING LATER",
  };
}
