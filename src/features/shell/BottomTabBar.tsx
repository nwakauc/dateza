import { NavLink } from "react-router-dom";
import { PRIMARY_NAV_ITEMS } from "./navConfig.ts";
import { useBadgeCounts } from "./useBadgeCounts.ts";

export function BottomTabBar() {
  const counts = useBadgeCounts();
  return (
    <nav className="shell-tabbar" aria-label="Main">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const badge = item.key === "likes" ? counts.likes : item.key === "chats" ? counts.chats : 0;
        const Icon = item.icon;
        return (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) => `shell-tabbar__link${isActive ? " shell-tabbar__link--active" : ""}`}
          >
            <span className="shell-tabbar__icon-wrap">
              <Icon className="shell-tabbar__icon" />
              {badge > 0 ? <span className="shell-badge shell-badge--tab">{badge > 9 ? "9+" : badge}</span> : null}
            </span>
            <span className="shell-tabbar__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
