import type { ReactNode } from "react";
import { useState } from "react";
import { hasConfirmedLocation } from "../../lib/locationConfirmationStore.ts";
import { LocationStep } from "../onboarding/LocationStep.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

type Props = { children: ReactNode };

/**
 * Guards Discover for accounts published before location capture existed
 * (or on a device that's never confirmed it). D8N's `GET /api/v1/profile`
 * doesn't expose whether ProfileLocation is configured (confirmed against
 * staging 2026-08-25), so this can only act on what this device has itself
 * confirmed — see locationConfirmationStore.ts. A member who already has
 * location on file from another device is asked once more here; that's the
 * safe direction to be wrong in, not a silently empty Discover.
 */
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
  if (!profile || justConfirmed || hasConfirmedLocation(profile.id)) {
    return children;
  }

  return (
    <div className="shell-page">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Discover</p>
        <h1 className="shell-page__title">Where are you dating from?</h1>
        <p className="shell-page__subtitle">
          Your location helps us show you people within the distance you choose.
        </p>
      </div>
      <LocationStep profileId={profile.id} onSuccess={() => setJustConfirmed(true)} />
    </div>
  );
}
