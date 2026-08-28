import { useEffect, useId, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { DateZaBrand } from "../../components/brand/DateZaBrand.tsx";
import { PUBLIC_FOOTER, PUBLIC_NAV } from "./publicNav.ts";

type Props = {
  children: ReactNode;
};

export function PublicChrome({ children }: Props) {
  const location = useLocation();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="dz-page public-site">
      <header className="dz-nav public-chrome__nav">
        <Link className="dz-logo public-chrome__logo dateza-brand-link" to="/" aria-label="DateZA home" onClick={closeMenu}>
          <DateZaBrand size="lg" className="public-chrome__brand" />
          <span className="public-chrome__tag">NO DNA. JUST RSA. 🇿🇦</span>
        </Link>
        <button
          type="button"
          className="dz-menu-btn"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id={menuId}
          className={menuOpen ? "dz-nav-links public-chrome__links dz-nav-open" : "dz-nav-links public-chrome__links"}
          aria-label="DateZA"
        >
          {PUBLIC_NAV.map((item) => {
            const current =
              item.to === "/" ? location.pathname === "/" : location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={"hash" in item ? { pathname: item.to, hash: item.hash } : item.to}
                aria-current={current ? "page" : undefined}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            );
          })}
          <Link className="dz-nav-signin" to="/sign-in" onClick={closeMenu}>
            Sign in
          </Link>
          <Link className="dz-nav-join" to="/sign-up" onClick={closeMenu}>
            Join free
          </Link>
        </nav>
        <div
          className={menuOpen ? "dz-nav-backdrop dz-nav-open" : "dz-nav-backdrop"}
          onClick={closeMenu}
        />
      </header>
      {children}
      <footer className="dz-footer public-chrome__footer">
        <Link className="public-chrome__foot-brand" to="/">
          <svg width="15" height="15" viewBox="0 0 30 30" aria-hidden="true">
            <path
              d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z"
              fill="#E8375A"
            />
          </svg>
          <b>DateZA</b> · NO DNA. JUST RSA. 🇿🇦
        </Link>
        <div className="public-chrome__foot-links">
          {PUBLIC_FOOTER.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
        <span>© 2026 DateZA. All rights reserved.</span>
      </footer>
    </div>
  );
}
