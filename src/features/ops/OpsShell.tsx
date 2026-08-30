import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { DateZaBrand } from "../../components/brand/DateZaBrand.tsx";
import { formatOperatorRole } from "../../lib/hq/capabilities.ts";
import { HqBrandProvider } from "../hq/HqBrandContext.tsx";
import { HqMfaGate } from "../hq/HqMfaGate.tsx";
import { HqSiteLink } from "../hq/HqSiteLink.tsx";
import { useHqOperator } from "../hq/useHqOperator.ts";
import { OPS_NAV_ITEMS } from "./navConfig.ts";
import { canAccessOpsNavItem } from "./opsCapabilities.ts";
import "./ops.css";

function OpsShellInner() {
  const location = useLocation();
  const { operator, operatorLabel, brandName, refresh, status } = useHqOperator();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const navItem =
    OPS_NAV_ITEMS.find((item) => {
      const normalized = location.pathname.replace(/\/$/, "") || "/ops";
      return item.path === normalized || normalized.startsWith(`${item.path}/`);
    }) ?? OPS_NAV_ITEMS[0]!;

  useEffect(() => {
    document.title = `${navItem.label} — DateZA Admin`;
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [navItem.label]);

  return (
    <div className="ops-root" data-sidebar-open={sidebarOpen ? "true" : "false"}>
      <aside className="ops-sidebar" aria-label="Admin navigation">
        <div className="ops-sidebar__brand">
          <DateZaBrand size="sm" />
          <div>
            <div className="ops-sidebar__title">DateZA Admin</div>
            <div className="ops-sidebar__subtitle">Operations console</div>
          </div>
        </div>

        <nav className="ops-nav">
          {OPS_NAV_ITEMS.map((item) => {
            if (!canAccessOpsNavItem(operator, item)) return null;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/ops"}
                className={({ isActive }) =>
                  `ops-nav__link${isActive ? " ops-nav__link--active" : ""}`
                }
                onClick={closeSidebar}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="ops-sidebar__footer">
          <Link to="/ops" onClick={closeSidebar}>
            DateZA Admin
          </Link>
          <Link to="/hq" onClick={closeSidebar}>
            D8N HQ Command Centre
          </Link>
          <HqSiteLink variant="sidebar" onNavigate={closeSidebar} />
          {operator ? (
            <p className="ops-muted">
              {operatorLabel} · {formatOperatorRole(operator.role)}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-header">
          <div>
            <button
              type="button"
              className="ops-btn ops-mobile-nav-toggle"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label="Open navigation"
            >
              Menu
            </button>
            <h1>{navItem.label}</h1>
            <p>
              {brandName ?? operator?.current_brand ?? "Current brand"} · Review flagged accounts,
              photo moderation, reports, and safety workflows.
            </p>
          </div>
          <div className="ops-header__controls">
            {operator && operator.brand_assignments.length > 1 ? (
              <div className="ops-control ops-control--muted" title="Brand switching requires signing in on each brand host">
                Brand: {operator.current_brand}
              </div>
            ) : (
              <div className="ops-control ops-control--muted">Brand: {operator?.current_brand ?? "—"}</div>
            )}
            <Link to="/discover" className="ops-btn">
              User panel
            </Link>
            <button
              type="button"
              className="ops-btn ops-btn--primary"
              disabled={status === "loading"}
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>
        </header>
        <div className="ops-content">
          <Outlet />
        </div>
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          className="ops-palette"
          aria-label="Close navigation"
          onClick={closeSidebar}
          style={{ background: "rgba(0,0,0,0.25)" }}
        />
      ) : null}
    </div>
  );
}

export default function OpsShell() {
  return (
    <HqBrandProvider>
      <HqMfaGate>
        <OpsShellInner />
      </HqMfaGate>
    </HqBrandProvider>
  );
}
