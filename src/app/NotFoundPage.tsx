import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PublicChrome } from "../pages/public/PublicChrome.tsx";
import { SessionStatusPage } from "../features/session/SessionStatusPage.tsx";
import { useSession } from "../features/session/useSession.ts";
import AppShell from "../features/shell/AppShell.tsx";

const HOME_TITLE = "DateZA — Meet someone who chooses you.";
const NOT_FOUND_TITLE = "Page not found — DateZA";

export default function NotFoundPage() {
  const { session } = useSession();

  useEffect(() => {
    document.title = NOT_FOUND_TITLE;
    return () => {
      document.title = HOME_TITLE;
    };
  }, []);

  if (session.status === "unknown") {
    return (
      <SessionStatusPage
        title="Checking your session…"
        body="Please wait while DateZA confirms whether you are signed in."
        busy
      />
    );
  }

  if (session.status === "authenticated") {
    return (
      <AppShell>
        <div className="shell-page shell-page--narrow not-found-member">
          <p className="shell-page__eyebrow">DateZA</p>
          <h1 className="shell-page__title">Page not found</h1>
          <p className="shell-page__subtitle">
            That address is not a DateZA page. Check the link, or go back to Discover.
          </p>
          <Link className="public-status__home" to="/discover">
            Back to Discover
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <PublicChrome>
      <main className="public-status public-status--with-chrome" id="main-content">
        <h1 className="public-status__title">Page not found</h1>
        <p className="public-status__body">
          That address is not a DateZA page. Check the link, or go back to the home page.
        </p>
        <Link className="public-status__home" to="/">
          Back to home
        </Link>
      </main>
    </PublicChrome>
  );
}
