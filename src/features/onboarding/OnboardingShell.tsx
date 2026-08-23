import { Link } from "react-router-dom";
import type { ReactNode } from "react";

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
