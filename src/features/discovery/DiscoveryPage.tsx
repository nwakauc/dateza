import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDiscoveryProfiles } from "../../lib/api/discovery.ts";
import { likeProfile, passProfile } from "../../lib/api/find.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { DiscoveryProfile, DiscoverySelection } from "../../lib/api/discoveryTypes.ts";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { CompassIcon } from "../shell/icons.tsx";
import { DiscoveryCard } from "./DiscoveryCard.tsx";

type Interaction = "idle" | "liked" | "matched" | "passed";

/**
 * Discovery is DateZA's curated, recommendation-led surface (10/day) — a
 * separate product and allowance from Find, backed by `GET /api/v1/discovery`.
 * It must never call `/api/v1/find` or otherwise borrow Find's allowance
 * semantics.
 */
export default function DiscoveryPage() {
  const navigate = useNavigate();
  const { pendingReason, requireVerified, dismiss } = useVerificationGate();

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [selection, setSelection] = useState<DiscoverySelection | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [interactions, setInteractions] = useState<Record<string, Interaction>>({});
  const [busyProfileId, setBusyProfileId] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.title = "Discover — DateZA";
    let cancelled = false;
    getDiscoveryProfiles()
      .then((result) => {
        if (cancelled) return;
        setProfiles(result.profiles);
        setSelection(result.selection);
        setInteractions({});
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(discoveryErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [attempt]);

  function openProfile(profileId: string) {
    requireVerified("profile", () => navigate(`/profile/${profileId}`, { state: { from: "discover" } }));
  }

  function like(profileId: string) {
    requireVerified("like", () => {
      setBusyProfileId(profileId);
      likeProfile(profileId)
        .then((result) => {
          setInteractions((current) => ({ ...current, [profileId]: result.matched ? "matched" : "liked" }));
        })
        .catch(() => undefined)
        .finally(() => setBusyProfileId(undefined));
    });
  }

  function pass(profileId: string) {
    requireVerified("pass", () => {
      setBusyProfileId(profileId);
      passProfile(profileId)
        .then(() => {
          setInteractions((current) => ({ ...current, [profileId]: "passed" }));
        })
        .catch(() => undefined)
        .finally(() => setBusyProfileId(undefined));
    });
  }

  function retry() {
    setLoading(true);
    setError(undefined);
    setAttempt((current) => current + 1);
  }

  const header = (
    <div className="shell-page__header">
      <p className="shell-page__eyebrow">Discover</p>
      <h1 className="shell-page__title">Picked for you today</h1>
      <p className="shell-page__subtitle">A small set of people DateZA thinks are worth meeting.</p>
    </div>
  );

  const verificationModal = pendingReason ? (
    <Modal ariaLabel="Verify your account" onClose={dismiss}>
      <VerificationFlow onDone={dismiss} />
    </Modal>
  ) : null;

  if (loading) {
    return (
      <div className="shell-page">
        {header}
        <div className="discover-preview" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell-page">
        {header}
        <div className="shell-empty">
          <CompassIcon className="shell-empty__icon" />
          <p className="shell-empty__title">We couldn't load your picks</p>
          <p className="shell-empty__body">{error}</p>
          <button className="shell-primary-action" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const refreshTime = formatRefreshTime(selection?.refreshes_at);

  if (profiles.length === 0) {
    return (
      <div className="shell-page">
        {header}
        <div className="shell-empty">
          <CompassIcon className="shell-empty__icon" />
          <p className="shell-empty__title">No picks right now</p>
          <p className="shell-empty__body">
            {refreshTime
              ? `DateZA is putting together your next selection. New picks arrive ${refreshTime}.`
              : "DateZA is putting together your next selection. Check back soon."}
          </p>
          <Link className="shell-primary-action" to="/find">
            Browse Find instead
          </Link>
        </div>
        {verificationModal}
      </div>
    );
  }

  return (
    <div className="shell-page">
      {header}
      <div className="discovery-grid">
        {profiles.map((profile) => (
          <DiscoveryCard
            key={profile.id}
            profile={profile}
            interaction={interactions[profile.id] ?? "idle"}
            pending={busyProfileId === profile.id}
            onOpen={() => openProfile(profile.id)}
            onLike={() => like(profile.id)}
            onPass={() => pass(profile.id)}
          />
        ))}
      </div>
      {refreshTime ? <p className="discovery-refresh-note">New picks {refreshTime}</p> : null}
      {verificationModal}
    </div>
  );
}

function discoveryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Publish your profile to start seeing your picks.";
    }
    if (error.status === 404) {
      return "Discover isn't available for DateZA yet.";
    }
    if (error.status === 429) {
      return "Too many requests. Wait a moment and try again.";
    }
  }
  return "We could not load Discover. Try again.";
}

function formatRefreshTime(refreshesAt: string | undefined): string | undefined {
  if (!refreshesAt) {
    return undefined;
  }
  const date = new Date(refreshesAt);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}
