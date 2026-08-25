import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFindProfiles, likeProfile, passProfile } from "../../lib/api/find.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { FindAllowance, FindProfile } from "../../lib/api/findTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { SearchIcon } from "../shell/icons.tsx";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { FindActions } from "./FindActions.tsx";
import { FindSwipeStack } from "./FindSwipeStack.tsx";
import { buildOptionLabelLookup } from "./optionLabels.ts";

/**
 * Find is DateZA's sequential, one-profile-at-a-time swipe surface — the
 * deliberate opposite of Discover's curated grid (see DiscoveryPage.tsx).
 * A Like/Pass isn't sent to D8N the instant it's tapped: it parks the card
 * to one side for UNDO_WINDOW_MS first. D8N has no undo/rewind endpoint
 * (`POST .../likes` and `POST .../pass` are both documented as producing a
 * 409 `InteractionConflict` if you try to reverse a decision by calling the
 * other one — confirmed against the verified openapi.yaml contract), so a
 * genuine "I meant to do the opposite" only works before the request is
 * ever sent. This also keeps Like's match result honest: matched status is
 * only known once the real request resolves, so a match is never revealed
 * later than the moment the card would otherwise have advanced.
 */

type Action = "liked" | "passed";
type Phase = "active" | "committing" | "submitting" | "exit-left" | "exit-right";

const UNDO_WINDOW_MS = 2200;
const EXIT_TRANSITION_MS = 300;

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
  const { pendingReason, requireVerified, dismiss } = useVerificationGate();

  const [active, setActive] = useState<FindProfile | undefined>();
  const [queue, setQueue] = useState<FindProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<FindAllowance | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [seenAny, setSeenAny] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [advanceCount, setAdvanceCount] = useState(0);

  const [phase, setPhase] = useState<Phase>("active");
  const [pendingAction, setPendingAction] = useState<Action | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [matchedProfile, setMatchedProfile] = useState<FindProfile | undefined>();

  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queueRef = useRef(queue);
  const nextCursorRef = useRef(nextCursor);
  const loadingMoreRef = useRef(loadingMore);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    document.title = "Find — DateZA";
    let cancelled = false;
    getFindProfiles()
      .then((result) => {
        if (cancelled) return;
        setActive(result.profiles[0]);
        setQueue(result.profiles.slice(1));
        setNextCursor(result.next_cursor);
        setAllowance(result.allowance);
        setSeenAny(result.profiles.length > 0);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(findErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Best-effort: powers human-readable relationship-intent/interest chips
    // on the swipe card (see optionLabels.ts). Find still renders fully
    // without it — those chips just stay hidden rather than showing raw
    // option codes.
    getProfileConfiguration()
      .then((result) => {
        if (!cancelled) setConfiguration(result.configuration);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [attempt]);

  useEffect(
    () => () => {
      clearTimeout(undoTimer.current);
      clearTimeout(exitTimer.current);
    },
    [],
  );

  function retry() {
    setLoading(true);
    setError(undefined);
    setAttempt((current) => current + 1);
  }

  async function fetchMore() {
    if (loadingMoreRef.current || !nextCursorRef.current) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await getFindProfiles({ cursor: nextCursorRef.current });
      setQueue((current) => [...current, ...result.profiles]);
      setNextCursor(result.next_cursor);
      setAllowance(result.allowance);
      if (result.profiles.length > 0) setSeenAny(true);
      return result.profiles;
    } catch {
      // Silent: this is a background top-up, not the member's current
      // request. If the queue actually runs dry, advance() below surfaces
      // an honest "load more" retry instead.
      return [];
    } finally {
      setLoadingMore(false);
    }
  }

  function advance() {
    setPhase("active");
    setPendingAction(undefined);
    setActionError(undefined);
    setMatchedProfile(undefined);
    setActive(queueRef.current[0]);
    setQueue((current) => current.slice(1));
    setAdvanceCount((current) => current + 1);
    if (queueRef.current.length <= 2 && nextCursorRef.current) {
      void fetchMore();
    }
  }

  function openProfile(profileId: string) {
    requireVerified("profile", () => navigate(`/profile/${profileId}`, { state: { from: "find" } }));
  }

  function requestAction(action: Action) {
    if (!active || phase !== "active" || matchedProfile) {
      return;
    }
    requireVerified(action === "liked" ? "like" : "pass", () => {
      setPhase("committing");
      setPendingAction(action);
      setActionError(undefined);
      undoTimer.current = setTimeout(() => void commit(action), UNDO_WINDOW_MS);
    });
  }

  async function commit(action: Action) {
    if (!active) return;
    setPhase("submitting");
    try {
      if (action === "liked") {
        const result = await likeProfile(active.id);
        if (result.matched) {
          setMatchedProfile(active);
          setPhase("active");
          setPendingAction(undefined);
          return;
        }
      } else {
        await passProfile(active.id);
      }
      setPhase(action === "liked" ? "exit-right" : "exit-left");
      exitTimer.current = setTimeout(advance, EXIT_TRANSITION_MS);
    } catch (caught) {
      setPhase("active");
      setPendingAction(undefined);
      setActionError(
        caught instanceof ApiError && caught.status === 429
          ? "Too many requests. Wait a moment and try again."
          : `We couldn't save that. Try again.`,
      );
    }
  }

  function undo() {
    clearTimeout(undoTimer.current);
    setPhase("active");
    setPendingAction(undefined);
  }

  function continueAfterMatch() {
    setMatchedProfile(undefined);
    advance();
  }

  if (loading) {
    return (
      <div className="shell-page">
        <div className="shell-page__header">
          <h1 className="shell-page__title">Find</h1>
          <p className="shell-page__subtitle">Meet someone new.</p>
        </div>
        <div className="find-stack find-stack--skeleton" aria-hidden="true">
          <div className="find-stack__peek find-card-skeleton" />
          <div className="find-stack__active find-card-skeleton" />
        </div>
      </div>
    );
  }

  if (error && !active) {
    return (
      <div className="shell-page">
        <div className="shell-page__header">
          <h1 className="shell-page__title">Find</h1>
        </div>
        <div className="shell-empty">
          <SearchIcon className="shell-empty__icon" />
          <p className="shell-empty__title">We couldn't load Find</p>
          <p className="shell-empty__body">{error}</p>
          <button className="shell-primary-action" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const exhausted = !active && allowance?.exhausted === true;
  const resetTime = allowance ? formatResetTime(allowance.resets_at) : undefined;
  const verificationModal = pendingReason ? (
    <Modal ariaLabel="Verify your account" onClose={dismiss}>
      <VerificationFlow onDone={dismiss} />
    </Modal>
  ) : null;

  if (!active) {
    return (
      <div className="shell-page">
        <div className="shell-page__header">
          <h1 className="shell-page__title">Find</h1>
        </div>
        <div className="shell-empty">
          <SearchIcon className="shell-empty__icon" />
          {exhausted ? (
            <>
              <p className="shell-empty__title">That's everyone for today</p>
              <p className="shell-empty__body">
                {resetTime
                  ? `You've seen today's Find profiles. Come back after ${resetTime} for more.`
                  : "You've seen today's Find profiles. Come back tomorrow for more."}
              </p>
            </>
          ) : (
            <>
              <p className="shell-empty__title">No one new right now</p>
              <p className="shell-empty__body">
                {seenAny ? "That's everyone nearby for the moment. Check back soon." : "Check back soon for new people to meet."}
              </p>
            </>
          )}
          <Link className="shell-primary-action" to="/discover">
            See today's Discover picks
          </Link>
        </div>
        {verificationModal}
      </div>
    );
  }

  const interaction = matchedProfile
    ? "matched"
    : pendingAction === "liked"
      ? "liked"
      : pendingAction === "passed"
        ? "passed"
        : "idle";
  const optionLabel = buildOptionLabelLookup(configuration);
  const actionsDisabled = phase !== "active" || Boolean(matchedProfile);

  return (
    <div className="shell-page">
      <div className="shell-page__header">
        <h1 className="shell-page__title">Find</h1>
        <p className="shell-page__subtitle">Meet someone new.</p>
      </div>

      {allowance && !exhausted && allowance.remaining > 0 ? (
        <p className="feed-allowance">{allowance.remaining} left today</p>
      ) : null}

      <FindSwipeStack
        key={active.id}
        profile={active}
        peekProfiles={queue}
        interaction={interaction}
        optionLabel={optionLabel}
        committingAction={phase === "committing" ? pendingAction : undefined}
        exiting={phase === "exit-left" ? "left" : phase === "exit-right" ? "right" : undefined}
        dragEnabled={phase === "active" && !matchedProfile}
        autoFocus={advanceCount > 0}
        onOpenDetail={() => openProfile(active.id)}
        onLike={() => requestAction("liked")}
        onPass={() => requestAction("passed")}
        onUndo={phase === "committing" ? undo : undefined}
      />

      <FindActions
        disabled={actionsDisabled}
        passLabel={interaction === "passed" ? "Passed" : "Pass"}
        likeLabel={interaction === "matched" ? "It's a match!" : interaction === "liked" ? "Liked" : "Like"}
        onPass={() => requestAction("passed")}
        onLike={() => requestAction("liked")}
      />

      {actionError ? (
        <p className="find-action-error" role="alert">
          {actionError}
        </p>
      ) : null}

      {matchedProfile ? (
        <div className="find-match">
          <p className="find-match__title">You matched with {matchedProfile.display_name ?? "them"}!</p>
          <button className="shell-primary-action" type="button" onClick={continueAfterMatch}>
            Continue browsing
          </button>
        </div>
      ) : null}

      {verificationModal}
    </div>
  );
}
