import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getCurrentProfile } from "../../lib/api/profile.ts";
import type { ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";
import { useSignOut } from "../auth/useSignOut.ts";
import { memberDestination } from "../onboarding/destination.ts";
import { onboardingErrorMessage } from "../onboarding/onboardingErrors.ts";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";

export default function MemberHomePage() {
  const { signOut, pending } = useSignOut();
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<ProfileOnboardingStatus | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    document.title = "DateZA";
    let cancelled = false;
    void getCurrentProfile()
      .then((result) => {
        if (!cancelled) {
          setOnboarding(result.onboarding);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(onboardingErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  if (loading) {
    return (
      <SessionStatusPage
        title="Checking your profile…"
        body="Please wait while DateZA loads your account."
        busy
      />
    );
  }

  if (error || !onboarding) {
    return (
      <SessionStatusPage
        title="We could not load your profile"
        body={error ?? "Refresh the page and try again."}
      />
    );
  }

  const destination = memberDestination(onboarding);
  if (destination === "/onboarding" || destination === "/find") {
    return <Navigate to={destination} replace />;
  }

  return (
    <main className="auth-screen" id="main-content">
      <div className="auth-screen__panel">
        <p className="auth-screen__eyebrow">Account paused</p>
        <h1 className="auth-screen__title">This profile is suspended</h1>
        <p className="auth-screen__intro">
          This profile is paused, so you can’t continue setup from here. Sign out, or contact DateZA if you need
          help.
        </p>
        <div className="auth-signed-in-actions">
          <button
            className="auth-form__submit"
            type="button"
            onClick={() => void signOut()}
            disabled={pending}
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
          <Link className="auth-screen__text-link" to="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
