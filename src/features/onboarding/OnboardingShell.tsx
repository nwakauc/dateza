import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { DateZaBrand } from "../../components/brand/DateZaBrand.tsx";

type Props = {
  title: string;
  intro: string;
  percent: number;
  wide?: boolean;
  onBack?: () => void;
  backDisabled?: boolean;
  children: ReactNode;
};

export function OnboardingShell({
  title,
  intro,
  percent,
  wide = false,
  onBack,
  backDisabled = false,
  children,
}: Props) {
  const bounded = Math.min(100, Math.max(0, percent));

  return (
    <main className="onboard-screen" id="main-content">
      <div className={wide ? "onboard-screen__panel onboard-screen__panel--wide" : "onboard-screen__panel"}>
        <div className="onboard-topbar">
          {onBack ? (
            <button
              className="onboard-back-top"
              type="button"
              onClick={onBack}
              disabled={backDisabled}
              aria-label="Back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>
          ) : null}
          <Link className="auth-screen__brand dateza-brand-link" to="/" aria-label="DateZA home">
            <DateZaBrand size="lg" />
          </Link>
        </div>
        <p className="auth-screen__eyebrow">Set up your profile</p>
        <div className="onboard-progress" aria-label={`Profile setup ${bounded} percent complete`}>
          <div className="onboard-progress__track">
            <div className="onboard-progress__bar" style={{ width: `${bounded}%` }} />
          </div>
          <span className="onboard-progress__label">{bounded}%</span>
        </div>
        <h1 className="auth-screen__title">{title}</h1>
        {intro ? <p className="auth-screen__intro">{intro}</p> : null}
        {children}
      </div>
    </main>
  );
}
