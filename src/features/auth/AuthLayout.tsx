import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { DateZaBrand } from "../../components/brand/DateZaBrand.tsx";

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
          <Link className="auth-screen__brand dateza-brand-link" to="/" aria-label="DateZA home">
            <DateZaBrand size="lg" />
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
