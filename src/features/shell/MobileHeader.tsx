import { Link } from "react-router-dom";
import { DateZaBrand } from "../../components/brand/DateZaBrand.tsx";
import { canInteract } from "../session/verificationState.ts";
import { useSession } from "../session/useSession.ts";
import { BellIcon } from "./icons.tsx";
import { MobileMenu } from "./MobileMenu.tsx";
import type { OwnAccount } from "./OwnAccountContext.ts";

type Props = {
  account: OwnAccount;
};

/** Brand bar shown only below the desktop breakpoint. Dating destinations
 * live on the tab bar; the hamburger opens account and the rest of the app. */
export function MobileHeader({ account }: Props) {
  const { verification } = useSession();
  const verified = canInteract(verification);

  return (
    <header className="shell-mobile-header">
      <Link to="/discover" className="shell-brand shell-brand--compact dateza-brand-link" aria-label="DateZA home">
        <DateZaBrand size="sm" />
      </Link>
      <div className="shell-mobile-header__actions">
        <Link to="/notifications" className="shell-icon-link" aria-label="Notifications">
          <BellIcon />
          {account.unreadNotifications > 0 ? <span className="shell-icon-link__badge">{account.unreadNotifications > 9 ? "9+" : account.unreadNotifications}</span> : null}
        </Link>
        <MobileMenu account={account} />
        <Link to="/profile" className="shell-avatar shell-avatar--sm" aria-label="Your profile">
          {account.avatarUrl ? <img src={account.avatarUrl} width="32" height="32" alt="" /> : <span className="shell-avatar__initial">{account.initial}</span>}
          {!verified ? <span className="shell-avatar__dot" aria-label="Verification needed" /> : null}
        </Link>
      </div>
    </header>
  );
}
