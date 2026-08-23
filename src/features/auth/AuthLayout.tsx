import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  title: string;
  intro: string;
  children: ReactNode;
};

export function AuthLayout({ title, intro, children }: Props) {
  return (
    <main className="auth-screen auth-screen--split" id="main-content">
      <div className="auth-screen__visual" aria-hidden="true">
        <div className="auth-screen__visual-scrim" />
        <p className="auth-screen__visual-line">Be the chosen one.</p>
      </div>
      <div className="auth-screen__form-pane">
        <div className="auth-screen__panel">
          <Link className="auth-screen__brand" to="/" aria-label="DateZA home">
            <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
              <path
                d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z"
                fill="#E8375A"
              />
            </svg>
            <span>
              Date<span>ZA</span>
            </span>
          </Link>
          <p className="auth-screen__eyebrow">South Africa · Date for real</p>
          <h1 className="auth-screen__title">{title}</h1>
          <p className="auth-screen__intro">{intro}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
