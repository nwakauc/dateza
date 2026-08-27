import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getProfileLocation } from "../../lib/api/profile.ts";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { LocationStep } from "../onboarding/LocationStep.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

type Props = { children: ReactNode };

/**
 * Discover and Find need a configured dating location. Server state from
 * GET /profile `location.configured` is authoritative. When that field is
 * omitted, DateZA reads GET /api/v1/profile/location. Browser storage never
 * decides whether location is configured.
 */
function inlineConfigured(profile: OwnerProfile | null): boolean | undefined {
  return profile?.location?.configured;
}

export function RequireLocation({ children }: Props) {
  const account = useOwnAccount();
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [fetchedConfigured, setFetchedConfigured] = useState<boolean | undefined>();
  const [lookupFailed, setLookupFailed] = useState(false);
  const [lookupAttempt, setLookupAttempt] = useState(0);

  const profile = account.profile;
  const known = inlineConfigured(profile);

  useEffect(() => {
    if (!profile || known !== undefined || justConfirmed) return;
    let cancelled = false;
    void getProfileLocation()
      .then((status) => {
        if (!cancelled) {
          setFetchedConfigured(status.configured);
          setLookupFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLookupFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, known, justConfirmed, lookupAttempt]);

  if (account.loading) {
    return (
      <div className="shell-page">
        <p className="shell-page__subtitle">Loading…</p>
      </div>
    );
  }

  const configured = known ?? fetchedConfigured;
  if (!profile || justConfirmed || configured === true) {
    return children;
  }

  if (known === undefined && fetchedConfigured === undefined && !lookupFailed) {
    return (
      <div className="shell-page">
        <p className="shell-page__subtitle">Checking your dating location…</p>
      </div>
    );
  }

  if (lookupFailed && known === undefined) {
    return (
      <div className="shell-page">
        <div className="shell-page__header">
          <p className="shell-page__eyebrow">Dating location</p>
          <h1 className="shell-page__title">We couldn’t confirm your location</h1>
          <p className="shell-page__subtitle">Check your connection, then try again.</p>
        </div>
        <button
          className="shell-primary-action"
          type="button"
          onClick={() => {
            setLookupFailed(false);
            setLookupAttempt((current) => current + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="shell-page">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Discover</p>
        <h1 className="shell-page__title">Where are you dating from?</h1>
        <p className="shell-page__subtitle">Choose the general area you want to date from.</p>
      </div>
      <LocationStep
        onSuccess={() => {
          setJustConfirmed(true);
          account.refresh();
        }}
      />
    </div>
  );
}
