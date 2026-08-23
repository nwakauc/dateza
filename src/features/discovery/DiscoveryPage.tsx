import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSignOut } from "../auth/useSignOut.ts";
import { FeedHeader } from "../feed/FeedHeader.tsx";
import { FeedTabs } from "../feed/FeedTabs.tsx";

/**
 * Discovery is DateZA's curated, recommendation-led surface (10/day) — a
 * separate product and allowance from Find. The backend for it does not
 * exist yet, so this page must never call `/api/v1/find` or otherwise fake
 * curated results; it only holds the route and nav destination until the
 * curated feed ships.
 */
export default function DiscoveryPage() {
  const { signOut, pending: signingOut } = useSignOut();

  useEffect(() => {
    document.title = "Discovery — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  return (
    <main className="discover-screen" id="main-content">
      <FeedHeader onSignOut={() => void signOut()} signingOut={signingOut} />
      <FeedTabs />

      <div className="feed-pending">
        <p className="feed-pending__title">Your daily picks are coming soon</p>
        <p className="feed-pending__body">
          We're building a smarter set of matches chosen specifically for you — based on compatibility,
          preferences, and trust.
        </p>
        <Link className="auth-screen__text-link" to="/find">
          Browse Find in the meantime →
        </Link>
      </div>
    </main>
  );
}
