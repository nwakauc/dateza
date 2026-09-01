import { Link, NavLink } from "react-router-dom";
import { canAccessNavItem } from "../../lib/hq/capabilities.ts";
import { HqSiteLink } from "./HqSiteLink.tsx";
import { HQ_NAV_GROUPS } from "./navConfig.ts";
import { useHqMode } from "./useHqMode.ts";
import { useHqOperator } from "./useHqOperator.ts";

export function HqSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { operator } = useHqOperator();
  const { mode } = useHqMode();
  const founderMode = mode === "founder";

  return (
    <aside className="hq-sidebar" aria-label="D8N HQ navigation">
      <div className="hq-sidebar__brand">
        <div className="hq-sidebar__mark" aria-hidden="true">
          D8
        </div>
        <div>
          <div className="hq-sidebar__title">D8N HQ</div>
          <div className="hq-sidebar__subtitle">Command centre</div>
        </div>
      </div>

      <nav className="hq-sidebar__nav">
        {HQ_NAV_GROUPS.map((group) => (
          <div className="hq-nav-group" key={group.id}>
            <p className="hq-nav-group__label">{group.label}</p>
            {group.items.map((item) => {
              if (!canAccessNavItem(operator, item.id)) {
                return null;
              }
              return (
              <NavLink
                key={item.id}
                to={item.path}
                className={() =>
                  [
                    "hq-nav-link",
                    founderMode && item.availability !== "ready" ? "hq-nav-link--later" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                end={item.path === "/hq"}
                onClick={onNavigate}
              >
                <span className="hq-nav-link__label">{item.label}</span>
                {!founderMode && item.availability !== "ready" ? (
                  <span className="hq-nav-link__meta">Later</span>
                ) : null}
              </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hq-sidebar__footer">
        <Link to="/ops" className="hq-site-link hq-site-link--sidebar" onClick={onNavigate}>
          DateZA Admin
        </Link>
        <HqSiteLink variant="sidebar" onNavigate={onNavigate} />
        <p className="hq-sidebar__phase">Phase 1–2 · Operator HQ</p>
      </div>
    </aside>
  );
}
