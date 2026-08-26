import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSignOut } from "../auth/useSignOut.ts";
import { Modal } from "../verification/Modal.tsx";
import { CloseIcon, MenuIcon } from "./icons.tsx";
import { ACCOUNT_NAV_ITEMS, PRIMARY_NAV_ITEMS } from "./navConfig.ts";
import type { OwnAccount } from "./OwnAccountContext.ts";

type Props = {
  account: OwnAccount;
};

export function MobileMenu({ account }: Props) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { signOut, pending } = useSignOut();
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="shell-icon-link"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>
      {open ? (
        <Modal
          ariaLabel="DateZA menu"
          onClose={close}
          hideCloseButton
          backdropClassName="shell-mobile-menu-backdrop"
          panelClassName="shell-mobile-menu"
        >
          <div className="shell-mobile-menu__head">
            <p className="shell-mobile-menu__who">{account.displayName || "Your account"}</p>
            <button type="button" className="shell-icon-link" aria-label="Close menu" onClick={close}>
              <CloseIcon />
            </button>
          </div>
          <p className="shell-mobile-menu__label">Date</p>
          <nav className="shell-mobile-menu__list" aria-label="Date">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const current = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Link key={item.to} to={item.to} aria-current={current ? "page" : undefined} onClick={close}>
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="shell-mobile-menu__label">Account</p>
          <nav className="shell-mobile-menu__list" aria-label="Account">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const current = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} aria-current={current ? "page" : undefined} onClick={close}>
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className="shell-mobile-menu__sign-out"
            onClick={() => {
              close();
              void signOut();
            }}
            disabled={pending}
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </Modal>
      ) : null}
    </>
  );
}
