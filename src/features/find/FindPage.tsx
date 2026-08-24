import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFindProfiles, likeProfile, passProfile } from "../../lib/api/find.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { FindAllowance, FindProfile } from "../../lib/api/findTypes.ts";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { Modal } from "../verification/Modal.tsx";
import { VerificationBanner } from "../verification/VerificationBanner.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { ProfileCard } from "./ProfileCard.tsx";

type Interaction = "idle" | "liked" | "matched" | "passed";

function findErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Publish your profile to start seeing people on DateZA.";
    }
    if (error.status === 404) {
      return "Find isn't available for DateZA yet.";
    }
    if (error.status === 429) {
      return "Too many requests. Wait a moment and try again.";
    }
  }
  return "We could not load Find. Refresh the page and try again.";
}

function formatResetTime(resetsAt: string): string | undefined {
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function FindPage() {
  const navigate = useNavigate();
  const { verified, verification, pendingReason, requireVerified, openPrompt, dismiss } = useVerificationGate();
  const modalTitleId = useId();

  const [profiles, setProfiles] = useState<FindProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<FindAllowance | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [interactions, setInteractions] = useState<Record<string, Interaction>>({});
  const [busyProfileId, setBusyProfileId] = useState<string | undefined>();

  useEffect(() => {
    document.title = "Find — DateZA";
    let cancelled = false;
    getFindProfiles()
      .then((result) => {
        if (cancelled) return;
        setProfiles(result.profiles);
        setNextCursor(result.next_cursor);
        setAllowance(result.allowance);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(findErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await getFindProfiles({ cursor: nextCursor });
      setProfiles((current) => [...current, ...result.profiles]);
      setNextCursor(result.next_cursor);
      setAllowance(result.allowance);
    } catch (caught) {
      setError(findErrorMessage(caught));
    } finally {
      setLoadingMore(false);
    }
  }

  function openProfile(profileId: string) {
    requireVerified("profile", () => navigate(`/profile/${profileId}`));
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

  if (loading) {
    return <SessionStatusPage title="Loading Find…" body="Finding people near you." busy />;
  }

  if (error && profiles.length === 0) {
    return <SessionStatusPage title="We could not load Find" body={error} />;
  }

  const exhausted = allowance?.exhausted === true && !nextCursor;
  const resetTime = allowance ? formatResetTime(allowance.resets_at) : undefined;

  return (
    <div className="shell-page" id="main-content">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Active browsing</p>
        <h1 className="shell-page__title">Find</h1>
        <p className="shell-page__subtitle">
          Browse and search for people yourself — up to 10 free profiles a day, separate from Discover.
        </p>
      </div>

      {!verified && verification.status === "known" ? (
        <VerificationBanner kind={verification.kind} onVerify={() => openPrompt("profile")} />
      ) : null}

      {allowance && !exhausted && allowance.remaining > 0 ? (
        <p className="feed-allowance">{allowance.remaining} left today</p>
      ) : null}

      {profiles.length > 0 ? (
        <div className="discover-grid">
          {profiles.map((profile) => (
            <ProfileCard
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
      ) : null}

      {exhausted ? (
        <div className="feed-end">
          <p className="feed-end__title">That's today's Find</p>
          <p className="feed-end__body">
            {resetTime
              ? `Come back after ${resetTime} for more people to explore.`
              : "Come back later for more people to explore."}
          </p>
        </div>
      ) : profiles.length === 0 ? (
        <p className="discover-empty">No new profiles right now. Check back soon.</p>
      ) : nextCursor ? (
        <div className="discover-load-more">
          <button className="verify-prompt__secondary" type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Show more"}
          </button>
        </div>
      ) : null}

      {pendingReason ? (
        <Modal titleId={modalTitleId} onClose={dismiss}>
          <VerificationFlow onDone={dismiss} />
        </Modal>
      ) : null}
    </div>
  );
}
