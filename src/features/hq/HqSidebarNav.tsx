import { ChevronRight, Lock } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { canAccessNavItem } from "../../lib/hq/capabilities.ts";
import type { HqCurrentOperator } from "../../lib/hq/types.ts";
import { isNavGroupExpanded, setNavGroupExpanded } from "./hqNavExpansion.ts";
import {
  HQ_NAV,
  isHqNavItemActive,
  type HqNavEntry,
  type HqNavGroup,
  type HqNavItem,
} from "./navConfig.ts";

function capabilityIdForItem(item: HqNavItem): string {
  if (item.id.startsWith("trust-")) return "trust-safety";
  return item.id;
}

function visibleItems(
  items: HqNavItem[],
  operator: HqCurrentOperator | null | undefined,
  founderMode: boolean,
): HqNavItem[] {
  return items.filter((item) => {
    if (item.visibility === "hidden") return false;
    if (!canAccessNavItem(operator, capabilityIdForItem(item))) return false;
    if (founderMode && item.visibility === "coming_soon" && item.availability !== "ready") {
      return false;
    }
    return true;
  });
}

function visibleEntries(
  entries: HqNavEntry[],
  operator: HqCurrentOperator | null | undefined,
  founderMode: boolean,
): HqNavEntry[] {
  const result: HqNavEntry[] = [];

  for (const entry of entries) {
    if (entry.type === "link") {
      if (entry.item.visibility === "hidden") continue;
      if (!canAccessNavItem(operator, capabilityIdForItem(entry.item))) continue;
      result.push(entry);
      continue;
    }

    const items = visibleItems(entry.group.items, operator, founderMode);
    if (items.length === 0) continue;
    if (items.length === 1) {
      result.push({ type: "link", item: items[0]! });
      continue;
    }
    result.push({ type: "group", group: { ...entry.group, items } });
  }

  return result;
}

function groupHasActiveChild(group: HqNavGroup, pathname: string, search: string): boolean {
  return group.items.some((item) => isHqNavItemActive(item, pathname, search));
}

function NavGroup({
  group,
  pathname,
  search,
  founderMode,
  onNavigate,
}: {
  group: HqNavGroup;
  pathname: string;
  search: string;
  founderMode: boolean;
  onNavigate?: () => void;
}) {
  const activeChild = groupHasActiveChild(group, pathname, search);
  const [toggleExpanded, setToggleExpanded] = useState(() =>
    isNavGroupExpanded(group.id, activeChild),
  );
  const expanded = activeChild || toggleExpanded;

  const toggle = useCallback(() => {
    if (activeChild) return;
    setToggleExpanded((value) => {
      const next = !value;
      setNavGroupExpanded(group.id, next);
      return next;
    });
  }, [activeChild, group.id]);

  const panelId = `hq-nav-group-${group.id}`;

  return (
    <div className={`hq-nav-accordion${expanded ? " hq-nav-accordion--open" : ""}`}>
      <button
        type="button"
        className="hq-nav-accordion__trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className="hq-nav-accordion__label">{group.label}</span>
        <ChevronRight size={14} className="hq-nav-accordion__chevron" aria-hidden="true" />
      </button>
      <div id={panelId} className="hq-nav-accordion__panel" hidden={!expanded}>
        <div className="hq-nav-accordion__items">
          {group.items.map((item) => {
            const active = isHqNavItemActive(item, pathname, search);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={[
                  "hq-nav-link",
                  "hq-nav-link--child",
                  active ? "hq-nav-link--active" : "",
                  item.visibility === "coming_soon" || item.availability !== "ready"
                    ? "hq-nav-link--soon"
                    : "",
                  founderMode &&
                  (item.visibility === "coming_soon" || item.availability !== "ready")
                    ? "hq-nav-link--later"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
              >
                <span className="hq-nav-link__label">{item.label}</span>
                {item.visibility === "coming_soon" || item.availability !== "ready" ? (
                  <span className="hq-nav-link__meta" title="Coming soon">
                    <Lock size={11} aria-hidden="true" />
                    <span>Soon</span>
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HqSidebarNav({
  operator,
  founderMode,
  onNavigate,
}: {
  operator: HqCurrentOperator | null | undefined;
  founderMode: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;

  const entries = useMemo(
    () => visibleEntries(HQ_NAV, operator, founderMode),
    [operator, founderMode],
  );

  return (
    <nav className="hq-sidebar__nav" aria-label="HQ sections">
      {entries.map((entry) => {
        if (entry.type === "link") {
          const item = entry.item;
          const active = isHqNavItemActive(item, pathname, search);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={[
                "hq-nav-link",
                "hq-nav-link--top",
                active ? "hq-nav-link--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              end
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
            >
              <span className="hq-nav-link__label">{item.label}</span>
            </NavLink>
          );
        }

        return (
          <NavGroup
            key={entry.group.id}
            group={entry.group}
            pathname={pathname}
            search={search}
            founderMode={founderMode}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}
