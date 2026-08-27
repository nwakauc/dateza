import type { ReactNode } from "react";
import { useState } from "react";
import { hasConfirmedLocation } from "../../lib/locationConfirmationStore.ts";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { LocationStep } from "../onboarding/LocationStep.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

type Props = { children: ReactNode };

/**
 * Discover needs a configured dating location. Prefer GET /profile
 * `location.configured` when the owner payload includes it. If that field is
 * omitted, fall back to this device's local confirmation flag (T6 will
 * replace that fallback). Do not redesign Discover here.
 */
function needsDatingLocation(profile: OwnerProfile): boolean {
  if (profile.location?.configured === true) {
    return false;
  }
  if (profile.location?.configured === false) {
    return true;
  }
  return !hasConfirmedLocation(profile.id);
}

export function RequireLocation({ children }: Props) {
  const account = useOwnAccount();
  const [justConfirmed, setJustConfirmed] = useState(false);

  if (account.loading) {
    return (
      <div className="shell-page">
        <p className="shell-page__subtitle">Loading…</p>
      </div>
    );
  }

  const profile = account.profile;
  if (!profile || justConfirmed || !needsDatingLocation(profile)) {
    return children;
  }

  return (
    <div className="shell-page">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Discover</p>
        <h1 className="shell-page__title">Where are you dating from?</h1>
        <p className="shell-page__subtitle">Choose the general area you want to date from.</p>
      </div>
      <LocationStep profileId={profile.id} onSuccess={() => setJustConfirmed(true)} />
    </div>
  );
}
