import { NavLink, useLocation } from "react-router-dom";
import { isProfileAreaPath, PRIMARY_NAV_ITEMS } from "./navConfig.ts";
import { useBadgeCounts } from "./useBadgeCounts.ts";
import { useOwnAccount } from "./useOwnAccount.ts";

export function BottomTabBar() {
  const counts = useBadgeCounts();
  const account = useOwnAccount();
  const { pathname } = useLocation();

  return (
    <nav className="shell-tabbar" aria-label="Main">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const badge = item.key === "likes" ? counts.likes : item.key === "chats" ? counts.chats : 0;
        const Icon = item.icon;
        const showAvatar = item.key === "profile" && account.avatarUrl;
        return (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) => {
              const active = isActive || (item.key === "profile" && isProfileAreaPath(pathname));
              return `shell-tabbar__link${active ? " shell-tabbar__link--active" : ""}`;
            }}
          >
            <span className="shell-tabbar__icon-wrap">
              {showAvatar ? (
                <img className="shell-tabbar__avatar" src={account.avatarUrl!} alt="" />
              ) : (
                <Icon className="shell-tabbar__icon" />
              )}
              {badge > 0 ? <span className="shell-badge shell-badge--tab">{badge > 9 ? "9+" : badge}</span> : null}
            </span>
            <span className="shell-tabbar__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
