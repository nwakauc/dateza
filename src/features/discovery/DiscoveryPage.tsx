import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CompassIcon } from "../shell/icons.tsx";

/**
 * Discovery is DateZA's curated, recommendation-led surface (10/day) — a
 * separate product and allowance from Find. The backend for it does not
 * exist yet, so this page must never call `/api/v1/find` or otherwise fake
 * curated results; it only holds the route and nav destination until the
 * curated feed ships.
 */
export default function DiscoveryPage() {
  useEffect(() => {
    document.title = "Discover — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

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
