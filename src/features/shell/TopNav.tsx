import { Link, NavLink } from "react-router-dom";
import { canInteract } from "../session/verificationState.ts";
import { useSession } from "../session/useSession.ts";
import { BellIcon, ChevronRightIcon } from "./icons.tsx";
import { ACCOUNT_NAV_ITEMS, PRIMARY_NAV_ITEMS } from "./navConfig.ts";
import type { OwnAccount } from "./OwnAccountContext.ts";
import { useBadgeCounts } from "./useBadgeCounts.ts";

type Props = {
  account: OwnAccount;
};

export function TopNav({ account }: Props) {
  const counts = useBadgeCounts();
  const { verification } = useSession();
  const verified = canInteract(verification);

  return (
    <header className="shell-topnav">
      <div className="shell-topnav__inner">
        <Link to="/discover" className="shell-brand" aria-label="DateZA home">
          <svg width="24" height="24" viewBox="0 0 30 30" aria-hidden="true">
            <path
              d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z"
              fill="#E8375A"
            />
          </svg>
          <span>
            Date<span>ZA</span>
          </span>
        </Link>

        <nav className="shell-primary-nav" aria-label="Main">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const badge = item.key === "likes" ? counts.likes : item.key === "chats" ? counts.chats : 0;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) => `shell-primary-nav__link${isActive ? " shell-primary-nav__link--active" : ""}`}
              >
                <Icon className="shell-primary-nav__icon" />
                <span>{item.label}</span>
                {badge > 0 ? <span className="shell-badge">{badge > 9 ? "9+" : badge}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="shell-topnav__actions">
          <Link to="/notifications" className="shell-icon-link" aria-label="Notifications">
            <BellIcon />
            {account.unreadNotifications > 0 ? (
              <span className="shell-icon-link__badge" aria-label={`${account.unreadNotifications} unread notifications`}>
                {account.unreadNotifications > 9 ? "9+" : account.unreadNotifications}
              </span>
            ) : null}
          </Link>
          <details className="shell-account-menu">
            <summary aria-label="Open account menu">
              <span className="shell-avatar" aria-hidden="true">
                {account.avatarUrl ? <img src={account.avatarUrl} width="38" height="38" alt="" /> : <span className="shell-avatar__initial">{account.initial}</span>}
                {!verified ? <span className="shell-avatar__dot" /> : null}
              </span>
              <span className="shell-account-menu__name">{account.displayName || "My account"}</span>
              <ChevronRightIcon className="shell-account-menu__chevron" />
            </summary>
            <div className="shell-account-menu__panel">
              {ACCOUNT_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
