import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api/errors.ts";
import { getFindProfiles, getProfileDetail, likeProfile, passProfile } from "../../lib/api/find.ts";
import type { FindAllowance, FindProfile, ProfileDetail } from "../../lib/api/findTypes.ts";
import { listNotifications } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { listOwnerPhotos } from "../../lib/api/photos.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { openerActionLabel, openerSendAllowed } from "../../lib/api/openerTypes.ts";
import { listConversations } from "../../lib/api/social.ts";
import { conversationCanCompose } from "../chats/chatDisplay.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { BoltIcon, ChevronDownIcon, LightbulbIcon, SearchIcon } from "../shell/icons.tsx";
import { MatchModal } from "../shell/MatchModal.tsx";
import { ProfileStandOutPrompt } from "../profile/ProfileStandOutPrompt.tsx";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { FindActions } from "./FindActions.tsx";
import { FindRightRail } from "./FindRightRail.tsx";
import { FindSidePanel } from "./FindSidePanel.tsx";
import { FindSwipeStack } from "./FindSwipeStack.tsx";
import { orderFindProfiles, rememberedFindActiveId, rememberFindActive } from "./findDeckMemory.ts";
import { buildOptionLabelLookup, buildProfileFieldLabelLookup } from "./optionLabels.ts";

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
  const [detail, setDetail] = useState<ProfileDetail | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [configurationLoading, setConfigurationLoading] = useState(true);
  const [configurationFailed, setConfigurationFailed] = useState(false);
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
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [sentOpeners, setSentOpeners] = useState<Record<string, { text: string; expiresAt: string }>>({});
  const [tipOpen, setTipOpen] = useState(false);
  const [allowanceOpen, setAllowanceOpen] = useState(false);

  const [notifications, setNotifications] = useState<ProductNotification[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityUnavailable, setActivityUnavailable] = useState(false);
  const [conversation, setConversation] = useState<Conversation | undefined>();
  const [selfPhotoUrl, setSelfPhotoUrl] = useState<string | undefined>();

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

  const loadConfiguration = useCallback(() => {
    getProfileConfiguration()
      .then((result) => {
        setConfiguration(result.configuration);
        setConfigurationFailed(false);
      })
      .catch(() => {
        setConfiguration(undefined);
        setConfigurationFailed(true);
      })
      .finally(() => setConfigurationLoading(false));
  }, []);

  useEffect(() => {
    document.title = "Find — DateZA";
    let cancelled = false;
    const preferredId = rememberedFindActiveId();
    getFindProfiles()
      .then((result) => {
        if (cancelled) return;
        const profiles = orderFindProfiles(result.profiles, preferredId);
        setActive(profiles[0]);
        setQueue(profiles.slice(1));
        setNextCursor(result.next_cursor);
        setAllowance(result.allowance);
        setSeenAny(profiles.length > 0);
        rememberFindActive(profiles[0]);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(findErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    loadConfiguration();
    listNotifications()
      .then((result) => {
        if (cancelled) return;
        setNotifications(result.notifications);
        setActivityUnavailable(false);
      })
      .catch(() => {
        if (!cancelled) setActivityUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    listOwnerPhotos()
      .then((photos) => {
        if (!cancelled) setSelfPhotoUrl(photos[0]?.image?.url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [attempt, loadConfiguration]);

  useEffect(
    () => () => {
      clearTimeout(undoTimer.current);
      clearTimeout(exitTimer.current);
    },
    [],
  );

  useEffect(() => {
    rememberFindActive(active);
  }, [active]);

  useEffect(() => {
    const profileId = active?.id;
    if (!profileId) return;
    let cancelled = false;
    getProfileDetail(profileId)
      .then((result) => {
        if (!cancelled) setDetail(result.profile);
      })
      .catch(() => {
        if (!cancelled) setDetail(undefined);
      });
    listConversations()
      .then((result) => {
        if (cancelled) return;
        setConversation(result.conversations.find((item) => item.profile.id === profileId && conversationCanCompose(item)));
      })
      .catch(() => {
        if (!cancelled) setConversation(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [active?.id]);

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
    setMatchedId(null);
    const next = queueRef.current[0];
    setActive(next);
    rememberFindActive(next);
    setQueue((current) => current.slice(1));
    setAdvanceCount((current) => current + 1);
    if (queueRef.current.length <= 2 && nextCursorRef.current) {
      void fetchMore();
    }
  }

  function openProfile(profileId: string) {
    const compatibility = active?.id === profileId ? active.compatibility : null;
    requireVerified("profile", () => navigate(`/profile/${profileId}`, { state: { from: "find", compatibility } }));
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
          setMatchedId(result.match_id);
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
      const message =
        caught instanceof ApiError && caught.status === 429
          ? "Too many requests. Wait a moment and try again."
          : "We couldn't save that. Try again.";
      setActionError(message);
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

  const verificationModal = pendingReason ? (
    <Modal ariaLabel="Verify your account" onClose={dismiss}>
      <VerificationFlow onDone={dismiss} />
    </Modal>
  ) : null;

  if (loading) {
    return (
      <div className="shell-page find-page">
        <div className="shell-page__header">
          <h1 className="shell-page__title">Find</h1>
          <p className="shell-page__subtitle">Meet someone new.</p>
        </div>
        <div className="find-stage find-stage--skeleton" aria-hidden="true">
          <div className="find-layout__main">
            <div className="find-stack find-stack--skeleton">
              <div className="find-stack__peek find-card-skeleton" />
              <div className="find-stack__active find-card-skeleton" />
            </div>
          </div>
          <div className="find-side find-side--skeleton">
            <div className="find-side__section" />
            <div className="find-side__section" />
          </div>
          <div className="find-rail find-rail--skeleton">
            <div className="find-rail-card" />
            <div className="find-rail-card" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !active) {
    return (
      <div className="shell-page find-page">
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
        <ProfileStandOutPrompt />
        {verificationModal}
      </div>
    );
  }

  const exhausted = !active && allowance?.exhausted === true;
  const resetTime = allowance ? formatResetTime(allowance.resets_at) : undefined;

  if (!active) {
    return (
      <div className="shell-page find-page">
        <div className="shell-page__header">
          <p className="shell-page__eyebrow">Find</p>
          <h1 className="shell-page__title">Meet someone new</h1>
        </div>
        <div className="shell-empty">
          <SearchIcon className="shell-empty__icon" />
          {exhausted ? (
            <>
              <p className="shell-empty__title">You've seen today's Find picks</p>
              <p className="shell-empty__body">
                {resetTime ? `Come back after ${resetTime} for more.` : "Come back for more later."}
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
          <div className="find-empty-actions">
            <Link className="shell-primary-action" to="/discover">
              Explore Discover
            </Link>
            <Link className="shell-text-action" to="/likes">
              View Likes
            </Link>
          </div>
        </div>
        <ProfileStandOutPrompt />
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
  const fieldLabel = buildProfileFieldLabelLookup(configuration);
  const actionsDisabled = phase !== "active" || Boolean(matchedProfile);
  const name = active.display_name ?? "this person";

  return (
    <div className="shell-page find-page">
      <div className="shell-page__header shell-page__header--with-action">
        <div>
          <p className="shell-page__eyebrow">Find</p>
          <h1 className="shell-page__title">Meet someone new</h1>
          <p className="shell-page__subtitle">Take your time, find your person.</p>
        </div>
        {allowance && !exhausted && allowance.remaining > 0 ? (
          <div className="find-allowance">
            <button
              type="button"
              className="find-allowance-pill"
              aria-expanded={allowanceOpen}
              onClick={() => setAllowanceOpen((open) => !open)}
            >
              <BoltIcon className="find-allowance-pill__icon" />
              {allowance.remaining} {allowance.remaining === 1 ? "pick" : "picks"} left today
              <ChevronDownIcon className="find-allowance-pill__chevron" />
            </button>
            {allowanceOpen && resetTime ? (
              <p className="find-allowance__detail">New picks after {resetTime}.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="find-stage">
        <div className="find-layout__main">
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
            onBlocked={advance}
            onUndo={phase === "committing" ? undo : undefined}
          />

          <FindActions
            disabled={actionsDisabled}
            passLabel={interaction === "passed" ? "Passed" : "Pass"}
            likeLabel={interaction === "matched" ? "It's a match!" : interaction === "liked" ? "Liked" : "Like"}
            openerLabel={openerActionLabel(active.opener_state)}
            openerSoon={false}
            openerDisabled={!openerSendAllowed(active.opener_state)}
            onPass={() => requestAction("passed")}
            onLike={() => requestAction("liked")}
            onOpener={() => {
              const surface = document.getElementById("find-opener-surface");
              surface?.scrollIntoView({ block: "nearest" });
              surface?.querySelector<HTMLButtonElement>(".opener-chooser__send")?.focus();
            }}
          />

          <div className="find-tip">
            <LightbulbIcon className="find-tip__icon" />
            <div>
              <p>Tip: An opener is a first note — separate from a like. Choose one, send it, then wait for a reply.</p>
              {tipOpen ? (
                <p className="find-tip__more">You can like without sending an opener, and send an opener without liking.</p>
              ) : null}
            </div>
            <button type="button" className="find-tip__learn" onClick={() => setTipOpen((open) => !open)}>
              {tipOpen ? "Show less" : "Learn more"}
            </button>
          </div>

          {actionError ? (
            <p className="find-action-error" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>

        <FindSidePanel
          key={`${active.id}-side`}
          profile={active}
          detail={detail?.id === active.id ? detail : undefined}
          optionLabel={optionLabel}
          fieldLabel={fieldLabel}
          onOpenDetail={() => openProfile(active.id)}
        />

        <FindRightRail
          key={`${active.id}-rail`}
          name={name}
          profileId={active.id}
          matched={Boolean(matchedProfile)}
          matchId={matchedId}
          photoUrl={active.photos[0]?.url}
          selfPhotoUrl={selfPhotoUrl}
          openerState={active.opener_state}
          catalogue={configuration?.openers ?? []}
          catalogueLoading={configurationLoading}
          catalogueFailed={configurationFailed}
          sentText={sentOpeners[active.id]?.text}
          expiresAt={sentOpeners[active.id]?.expiresAt}
          conversation={!matchedProfile && conversation?.profile.id === active.id ? conversation : undefined}
          online={active.online}
          notifications={notifications}
          activityLoading={activityLoading}
          activityUnavailable={activityUnavailable}
          onKeepFinding={continueAfterMatch}
          onRetryCatalogue={() => {
            setConfigurationLoading(true);
            setConfigurationFailed(false);
            loadConfiguration();
          }}
          onOpenerSent={(text, expiresAt) => {
            setSentOpeners((current) => ({ ...current, [active.id]: { text, expiresAt } }));
            setActive((current) => (current && current.id === active.id ? { ...current, opener_state: "pending" } : current));
          }}
        />
      </div>

      {matchedProfile ? (
        <MatchModal
          name={matchedProfile.display_name ?? "them"}
          photoUrl={matchedProfile.photos[0]?.url}
          selfPhotoUrl={selfPhotoUrl}
          matchId={matchedId}
          continueLabel="Keep discovering"
          onContinue={continueAfterMatch}
        />
      ) : null}

      {verificationModal}
    </div>
  );
}
