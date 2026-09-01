export type HqNavAvailability = "ready" | "planned" | "phase_gated";

/** Whether an item appears in the sidebar at all. */
export type HqNavVisibility = "available" | "coming_soon" | "hidden";

export type HqNavItem = {
  id: string;
  label: string;
  /** Path under /hq — may include ?tab= for in-page sections. */
  path: string;
  availability: HqNavAvailability;
  visibility: HqNavVisibility;
  badge?: string;
};

export type HqNavGroup = {
  id: string;
  label: string;
  items: HqNavItem[];
};

export type HqNavEntry =
  | { type: "link"; item: HqNavItem }
  | { type: "group"; group: HqNavGroup };

/**
 * HQ navigation information architecture.
 * Only `available` and selective `coming_soon` items render; `hidden` items stay out of the sidebar.
 */
export const HQ_NAV: HqNavEntry[] = [
  {
    type: "link",
    item: {
      id: "command-centre",
      label: "Command Centre",
      path: "/hq",
      availability: "ready",
      visibility: "available",
    },
  },
  {
    type: "group",
    group: {
      id: "people",
      label: "People",
      items: [
        {
          id: "members",
          label: "Members",
          path: "/hq/members",
          availability: "ready",
          visibility: "available",
        },
        {
          id: "customers",
          label: "Customers & Support",
          path: "/hq/customers",
          availability: "phase_gated",
          visibility: "coming_soon",
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "product",
      label: "Product",
      items: [
        {
          id: "product",
          label: "Product Intelligence",
          path: "/hq/product",
          availability: "planned",
          visibility: "hidden",
        },
        {
          id: "marketplace",
          label: "Marketplace Health",
          path: "/hq/marketplace",
          availability: "planned",
          visibility: "hidden",
        },
        {
          id: "growth",
          label: "Growth & Marketing",
          path: "/hq/growth",
          availability: "planned",
          visibility: "hidden",
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "trust",
      label: "Trust & Safety",
      items: [
        {
          id: "trust-overview",
          label: "Overview",
          path: "/hq/trust-safety",
          availability: "ready",
          visibility: "available",
        },
        {
          id: "trust-reports",
          label: "Reports",
          path: "/hq/trust-safety?tab=queue",
          availability: "ready",
          visibility: "available",
        },
        {
          id: "trust-photos",
          label: "Photo moderation",
          path: "/hq/trust-safety?tab=overview",
          availability: "ready",
          visibility: "available",
        },
        {
          id: "trust-enforcements",
          label: "Enforcements",
          path: "/hq/trust-safety?tab=enforcements",
          availability: "ready",
          visibility: "available",
        },
        {
          id: "trust-offenders",
          label: "Repeat offenders",
          path: "/hq/trust-safety?tab=offenders",
          availability: "ready",
          visibility: "available",
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "security",
      label: "Security",
      items: [
        {
          id: "alerts",
          label: "Security alerts",
          path: "/hq/alerts",
          availability: "ready",
          visibility: "available",
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "engineering",
      label: "Engineering",
      items: [
        { id: "reliability", label: "Reliability", path: "/hq/reliability", availability: "planned", visibility: "hidden" },
        { id: "errors", label: "Errors", path: "/hq/errors", availability: "planned", visibility: "hidden" },
        { id: "apm", label: "APM & Traces", path: "/hq/apm", availability: "planned", visibility: "hidden" },
        { id: "traces", label: "Traces", path: "/hq/traces", availability: "planned", visibility: "hidden" },
        { id: "logs", label: "Logs", path: "/hq/logs", availability: "planned", visibility: "hidden" },
        { id: "jobs", label: "Jobs & Queues", path: "/hq/jobs", availability: "planned", visibility: "hidden" },
        { id: "database", label: "Database", path: "/hq/database", availability: "planned", visibility: "hidden" },
        { id: "infra", label: "Infrastructure", path: "/hq/infrastructure", availability: "planned", visibility: "hidden" },
        { id: "deployments", label: "Deployments", path: "/hq/deployments", availability: "planned", visibility: "hidden" },
        { id: "data-health", label: "Data Health", path: "/hq/data-health", availability: "planned", visibility: "hidden" },
        { id: "security-platform", label: "Security", path: "/hq/security", availability: "planned", visibility: "hidden" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "platform",
      label: "Platform",
      items: [
        { id: "brands", label: "Brands", path: "/hq/brands", availability: "planned", visibility: "hidden" },
        { id: "admin", label: "Operators / Admin", path: "/hq/admin", availability: "planned", visibility: "hidden" },
        { id: "audit", label: "Audit", path: "/hq/audit", availability: "planned", visibility: "hidden" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "business",
      label: "Business",
      items: [
        { id: "revenue", label: "Revenue", path: "/hq/revenue", availability: "phase_gated", visibility: "hidden" },
        { id: "live-events", label: "Live / Events", path: "/hq/live", availability: "planned", visibility: "hidden" },
        { id: "incidents", label: "Incidents", path: "/hq/incidents", availability: "planned", visibility: "hidden" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "intelligence",
      label: "Intelligence",
      items: [
        {
          id: "company-intelligence",
          label: "Company Intelligence",
          path: "/hq/intelligence",
          availability: "phase_gated",
          visibility: "hidden",
        },
        {
          id: "briefings",
          label: "Executive Briefings",
          path: "/hq/briefings",
          availability: "phase_gated",
          visibility: "hidden",
        },
      ],
    },
  },
];

/** @deprecated Use HQ_NAV — kept for route lookup helpers. */
export const HQ_NAV_GROUPS: HqNavGroup[] = HQ_NAV.filter(
  (entry): entry is { type: "group"; group: HqNavGroup } => entry.type === "group",
).map((entry) => entry.group);

function allNavItems(): HqNavItem[] {
  const items: HqNavItem[] = [];
  for (const entry of HQ_NAV) {
    if (entry.type === "link") {
      items.push(entry.item);
    } else {
      items.push(...entry.group.items);
    }
  }
  return items;
}

export function navItemPathname(path: string): string {
  return path.split("?")[0] ?? path;
}

export function navItemSearchTab(path: string): string | null {
  const query = path.split("?")[1];
  if (!query) return null;
  return new URLSearchParams(query).get("tab");
}

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/$/, "") || "/hq";
}

export function isHqNavItemActive(
  item: HqNavItem,
  pathname: string,
  search: string,
): boolean {
  const normalized = normalizePathname(pathname);
  const currentTab = new URLSearchParams(search).get("tab");
  const itemPath = navItemPathname(item.path);
  const itemTab = navItemSearchTab(item.path);

  if (normalized.match(/^\/hq\/trust-safety\/reports\//)) {
    return item.id === "trust-reports";
  }

  if (item.id === "command-centre") {
    return normalized === "/hq";
  }

  if (item.id === "trust-overview") {
    return (
      normalized === "/hq/trust-safety" &&
      (currentTab === null || currentTab === "overview")
    );
  }

  if (item.id === "trust-photos") {
    return false;
  }

  if (itemTab) {
    return normalized.startsWith(itemPath) && currentTab === itemTab;
  }

  if (itemPath === "/hq/members") {
    return normalized.startsWith("/hq/members");
  }

  if (itemPath === "/hq/alerts") {
    return normalized.startsWith("/hq/alerts");
  }

  return normalized === itemPath || normalized.startsWith(`${itemPath}/`);
}

export function findHqNavItem(pathname: string, search = ""): HqNavItem | undefined {
  const normalized = normalizePathname(pathname);
  for (const item of allNavItems()) {
    if (isHqNavItemActive(item, normalized, search)) {
      return item;
    }
  }
  return undefined;
}

export function findHqNavGroupIdForPath(pathname: string, search = ""): string | null {
  const normalized = normalizePathname(pathname);
  for (const entry of HQ_NAV) {
    if (entry.type !== "group") continue;
    for (const item of entry.group.items) {
      if (isHqNavItemActive(item, normalized, search)) {
        return entry.group.id;
      }
    }
  }
  return null;
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
    body: "Navigation is reserved so the shell can grow. This page is not part of the Phase 1–2 HQ surfaces yet.",
    badge: "COMING LATER",
  };
}
