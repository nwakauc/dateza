import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CompassIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

/**
 * Discovery is DateZA's curated, recommendation-led surface (10/day) — a
 * separate product and allowance from Find. The backend for it does not
 * exist yet, so this page must never call `/api/v1/find` or otherwise fake
 * curated results; it only holds the route and nav destination until the
 * curated feed ships.
 */
export default function DiscoveryPage() {
  const account = useOwnAccount();

  useEffect(() => {
    document.title = "Discover — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  if (account.loading) {
    return (
      <div className="shell-page" aria-busy="true">
        <div className="shell-page__header">
          <p className="shell-page__eyebrow">Discover</p>
          <h1 className="shell-page__title">Making this space yours</h1>
          <p className="shell-page__subtitle">We’re getting your DateZA home ready.</p>
        </div>
        <div className="discover-preview" aria-hidden="true"><span /><span /><span /></div>
      </div>
    );
  }

  if (account.onboarding && account.onboarding.state !== "complete") {
    const progress = account.onboarding.completion.percent;
    return (
      <div className="shell-page">
        <div className="shell-page__header">
          <p className="shell-page__eyebrow">Discover</p>
          <h1 className="shell-page__title">Your next connection starts here</h1>
          <p className="shell-page__subtitle">
            Add the essentials to your profile before we introduce you to other DateZA members.
          </p>
        </div>
        <section className="discover-onboarding" aria-labelledby="discover-profile-title">
          <div className="discover-onboarding__mark" aria-hidden="true">D</div>
          <div className="discover-onboarding__content">
            <p className="discover-onboarding__eyebrow">Your profile · {progress}% complete</p>
            <h2 id="discover-profile-title">Let people see who you are</h2>
            <p>A thoughtful profile helps DateZA make better introductions when Discover is ready for you.</p>
            <div
              className="discover-onboarding__progress"
              role="progressbar"
              aria-label="Profile completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <Link className="auth-form__submit discover-onboarding__action" to="/onboarding">
              Complete your profile
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="shell-page">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Today's picks</p>
        <h1 className="shell-page__title">Your curated selection</h1>
        <p className="shell-page__subtitle">
          A separate daily selection shaped around you — not the same profiles or allowance as Find.
        </p>
      </div>

      <div className="shell-empty">
        <CompassIcon className="shell-empty__icon" />
        <p className="shell-empty__title">Your daily picks are coming soon</p>
        <p className="shell-empty__body">
          Your curated daily selection is still being prepared. Until it is ready, Find stays open for exploring
          at your own pace.
        </p>
        <Link className="auth-screen__text-link" to="/find">
          Browse Find in the meantime →
        </Link>
      </div>
    </div>
  );
}
