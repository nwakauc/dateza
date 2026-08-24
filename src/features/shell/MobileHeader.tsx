import { Link } from "react-router-dom";
import { canInteract } from "../session/verificationState.ts";
import { useSession } from "../session/useSession.ts";
import type { OwnAccount } from "./OwnAccountContext.ts";

type Props = {
  account: OwnAccount;
};

/** Thin brand bar shown only below the desktop breakpoint — the bottom tab
 * bar carries primary navigation on mobile, so this stays minimal. */
export function MobileHeader({ account }: Props) {
  const { verification } = useSession();
  const verified = canInteract(verification);

  return (
    <header className="shell-mobile-header">
      <Link to="/discover" className="shell-brand shell-brand--compact" aria-label="DateZA home">
        <svg width="20" height="20" viewBox="0 0 30 30" aria-hidden="true">
          <path
            d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z"
            fill="#E8375A"
          />
        </svg>
        <span>
          Date<span>ZA</span>
        </span>
      </Link>
      <Link to="/profile" className="shell-avatar shell-avatar--sm" aria-label="Your profile">
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt="" />
        ) : (
          <span className="shell-avatar__initial">{account.initial}</span>
        )}
        {!verified ? <span className="shell-avatar__dot" aria-label="Verification needed" /> : null}
      </Link>
    </header>
  );
}
