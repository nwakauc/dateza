import { useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { DateZaBrand } from "../../components/brand/DateZaBrand.tsx";
import { useSignOut } from "../auth/useSignOut.ts";
import { canInteract } from "../session/verificationState.ts";
import { useSession } from "../session/useSession.ts";
import { HqEntryLink } from "../hq/HqEntryLink.tsx";
import { BellIcon, ChevronRightIcon, SignOutIcon } from "./icons.tsx";
import { ACCOUNT_NAV_ITEMS, PRIMARY_NAV_ITEMS } from "./navConfig.ts";
import type { OwnAccount } from "./OwnAccountContext.ts";
import { useBadgeCounts } from "./useBadgeCounts.ts";

type Props = {
  account: OwnAccount;
};

export function TopNav({ account }: Props) {
  const counts = useBadgeCounts();
  const { verification } = useSession();
  const { signOut, pending } = useSignOut();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const verified = canInteract(verification);

  return (
    <header className="shell-topnav">
      <div className="shell-topnav__inner">
        <Link to="/discover" className="shell-brand dateza-brand-link" aria-label="DateZA home">
          <DateZaBrand size="md" />
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
                {badge > 0 ? <span className="shell-badge" aria-label={item.key === "chats" ? `${badge} unread chats` : undefined}>{badge > 9 ? "9+" : badge}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="shell-topnav__actions">
          <HqEntryLink variant="chip" />
          <Link to="/notifications" className="shell-icon-link" aria-label="Notifications">
            <BellIcon />
            {account.unreadNotifications > 0 ? (
              <span className="shell-icon-link__badge" aria-label={`${account.unreadNotifications} unread notifications`}>
                {account.unreadNotifications > 9 ? "9+" : account.unreadNotifications}
              </span>
            ) : null}
          </Link>
          <details className="shell-account-menu" ref={menuRef}>
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
              <HqEntryLink
                variant="menu"
                onNavigate={() => menuRef.current?.removeAttribute("open")}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  menuRef.current?.removeAttribute("open");
                  void signOut();
                }}
              >
                <SignOutIcon />
                <span>{pending ? "Signing out…" : "Sign out"}</span>
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
